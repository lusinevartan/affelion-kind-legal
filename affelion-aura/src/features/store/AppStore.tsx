import * as React from 'react';
import type { ScanRecord } from '../../core/types';
import {
  createPurchaseProvider,
  freeScansRemaining,
  getFreeScansUsed,
  incrementFreeScansUsed,
  NO_ENTITLEMENT,
  type Entitlement,
  type PlanId,
  type PurchaseProvider,
} from '../../services/entitlements';
import { clearSettings, deleteAllScans, getSetting, listScans, saveScan, setSetting } from '../../services/storage';

/**
 * App-wide state: onboarding, entitlement, free-scan count and the scan history.
 * Kept deliberately small. Persisted through the storage service.
 */
export interface AppState {
  ready: boolean;
  onboardingDone: boolean;
  entitlement: Entitlement;
  freeScansUsed: number;
  scans: ScanRecord[];
  /** Derived: Pro, or free scans remaining. */
  canScan: boolean;
  freeScansLeft: number;
}

export interface AppActions {
  completeOnboarding(): Promise<void>;
  refreshScans(): Promise<void>;
  recordScan(record: ScanRecord): Promise<void>;
  purchase(plan: PlanId): Promise<Entitlement>;
  restore(): Promise<Entitlement>;
  manageSubscriptions(): Promise<void>;
  deleteAllData(): Promise<void>;
}

type StoredState = Omit<AppState, 'canScan' | 'freeScansLeft'>;

const StateContext = React.createContext<AppState | null>(null);
const ActionsContext = React.createContext<AppActions | null>(null);

const ONBOARDING_KEY = 'onboardingDone';

export function AppStoreProvider({ children, provider }: { children: React.ReactNode; provider?: PurchaseProvider }) {
  const purchases = React.useMemo(() => provider ?? createPurchaseProvider(), [provider]);
  const [state, setState] = React.useState<StoredState>({
    ready: false,
    onboardingDone: false,
    entitlement: NO_ENTITLEMENT,
    freeScansUsed: 0,
    scans: [],
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [onboarding, entitlement, used, scans] = await Promise.all([
        getSetting(ONBOARDING_KEY),
        purchases.getEntitlement(),
        getFreeScansUsed(),
        listScans(),
      ]);
      if (cancelled) return;
      setState({ ready: true, onboardingDone: onboarding === '1', entitlement, freeScansUsed: used, scans });
    })().catch((e) => {
      console.warn('App store failed to load', e);
      if (!cancelled) setState((s) => ({ ...s, ready: true }));
    });
    return () => {
      cancelled = true;
    };
  }, [purchases]);

  const stateRef = React.useRef(state);
  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const actions = React.useMemo<AppActions>(
    () => ({
      async completeOnboarding() {
        await setSetting(ONBOARDING_KEY, '1');
        setState((s) => ({ ...s, onboardingDone: true }));
      },
      async refreshScans() {
        const scans = await listScans();
        setState((s) => ({ ...s, scans }));
      },
      async recordScan(record) {
        await saveScan(record);
        const isPro = stateRef.current.entitlement.isPro;
        const used = isPro ? stateRef.current.freeScansUsed : await incrementFreeScansUsed();
        const scans = await listScans();
        setState((s) => ({ ...s, scans, freeScansUsed: used }));
      },
      async purchase(plan) {
        const entitlement = await purchases.purchase(plan);
        setState((s) => ({ ...s, entitlement }));
        return entitlement;
      },
      async restore() {
        const entitlement = await purchases.restore();
        setState((s) => ({ ...s, entitlement }));
        return entitlement;
      },
      manageSubscriptions: () => purchases.openManageSubscriptions(),
      async deleteAllData() {
        await deleteAllScans();
        await clearSettings();
        const entitlement = await purchases.getEntitlement();
        setState({ ready: true, onboardingDone: true, entitlement, freeScansUsed: 0, scans: [] });
        await setSetting(ONBOARDING_KEY, '1');
      },
    }),
    [purchases],
  );

  const derived = React.useMemo<AppState>(() => {
    const freeScansLeft = freeScansRemaining(state.freeScansUsed);
    return { ...state, freeScansLeft, canScan: state.entitlement.isPro || freeScansLeft > 0 };
  }, [state]);

  return (
    <StateContext.Provider value={derived}>
      <ActionsContext.Provider value={actions}>{children}</ActionsContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState(): AppState {
  const s = React.useContext(StateContext);
  if (!s) throw new Error('useAppState must be used inside AppStoreProvider');
  return s;
}

export function useAppActions(): AppActions {
  const a = React.useContext(ActionsContext);
  if (!a) throw new Error('useAppActions must be used inside AppStoreProvider');
  return a;
}
