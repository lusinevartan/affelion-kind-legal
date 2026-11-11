import * as React from 'react';
import type { PracticeRecord, ScanRecord } from '../../core/types';
import type { FrameStyleId } from '../../render/polaroid/styles';
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
import { clearSettings, deleteAllScans, getSetting, listPractices, listScans, savePractice, saveScan, setSetting } from '../../services/storage';

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
  practices: PracticeRecord[];
  /** Breathing rate found by the resonance finder, breaths per minute, or null. */
  resonanceRate: number | null;
  frameStyle: FrameStyleId;
  /** Derived: Pro, or free scans remaining. */
  canScan: boolean;
  freeScansLeft: number;
  /** Derived: Pro, or the single free practice session not yet used. */
  canPractice: boolean;
}

export interface AppActions {
  completeOnboarding(): Promise<void>;
  refreshScans(): Promise<void>;
  recordScan(record: ScanRecord): Promise<void>;
  recordPractice(record: PracticeRecord): Promise<void>;
  setResonanceRate(rate: number): Promise<void>;
  setFrameStyle(style: FrameStyleId): Promise<void>;
  purchase(plan: PlanId): Promise<Entitlement>;
  restore(): Promise<Entitlement>;
  manageSubscriptions(): Promise<void>;
  deleteAllData(): Promise<void>;
}

type StoredState = Omit<AppState, 'canScan' | 'freeScansLeft' | 'canPractice'>;

const StateContext = React.createContext<AppState | null>(null);
const ActionsContext = React.createContext<AppActions | null>(null);

const ONBOARDING_KEY = 'onboardingDone';
const RESONANCE_KEY = 'resonanceRate';
const FRAME_KEY = 'frameStyle';

export function AppStoreProvider({ children, provider }: { children: React.ReactNode; provider?: PurchaseProvider }) {
  const purchases = React.useMemo(() => provider ?? createPurchaseProvider(), [provider]);
  const [state, setState] = React.useState<StoredState>({
    ready: false,
    onboardingDone: false,
    entitlement: NO_ENTITLEMENT,
    freeScansUsed: 0,
    scans: [],
    practices: [],
    resonanceRate: null,
    frameStyle: 'classic',
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const [onboarding, entitlement, used, scans, practices, resonance, frame] = await Promise.all([
        getSetting(ONBOARDING_KEY),
        purchases.getEntitlement(),
        getFreeScansUsed(),
        listScans(),
        listPractices(),
        getSetting(RESONANCE_KEY),
        getSetting(FRAME_KEY),
      ]);
      if (cancelled) return;
      setState({
        ready: true,
        onboardingDone: onboarding === '1',
        entitlement,
        freeScansUsed: used,
        scans,
        practices,
        resonanceRate: resonance ? Number(resonance) || null : null,
        frameStyle: (frame as FrameStyleId | null) ?? 'classic',
      });
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
      async recordPractice(record) {
        await savePractice(record);
        const practices = await listPractices();
        setState((s) => ({ ...s, practices }));
      },
      async setResonanceRate(rate) {
        await setSetting(RESONANCE_KEY, String(rate));
        setState((s) => ({ ...s, resonanceRate: rate }));
      },
      async setFrameStyle(style) {
        await setSetting(FRAME_KEY, style);
        setState((s) => ({ ...s, frameStyle: style }));
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
        setState({ ready: true, onboardingDone: true, entitlement, freeScansUsed: 0, scans: [], practices: [], resonanceRate: null, frameStyle: 'classic' });
        await setSetting(ONBOARDING_KEY, '1');
      },
    }),
    [purchases],
  );

  const derived = React.useMemo<AppState>(() => {
    const freeScansLeft = freeScansRemaining(state.freeScansUsed);
    return {
      ...state,
      freeScansLeft,
      canScan: state.entitlement.isPro || freeScansLeft > 0,
      canPractice: state.entitlement.isPro || state.practices.length === 0,
    };
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
