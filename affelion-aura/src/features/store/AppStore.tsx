import * as React from 'react';
import { AppState as RNAppState } from 'react-native';
import type { PracticeRecord, ScanRecord } from '../../core/types';
import type { FrameStyleId } from '../../render/polaroid/styles';
import { useNow } from '../../ui/useNow';
import {
  createPurchaseProvider,
  ENTITLEMENT_KEY,
  FREE_PRACTICE_USED_KEY,
  FREE_SCANS_USED_KEY,
  getFreeScansUsed,
  incrementFreeScansUsed,
  NO_ENTITLEMENT,
  type Entitlement,
  type PlanId,
  type PlanPrices,
  type PurchaseProvider,
  FREE_SCAN_LAST_KEY,
  getLastFreeScanAt,
  markFreeScanUsed,
  accessFor,
  pricesStatusFor,
  type PricesStatus,
} from '../../services/entitlements';
import { clearSettings, deleteAllScans, getSetting, listMasks, listPractices, listScans, saveMask, savePractice, saveScan, setSetting } from '../../services/storage';
import { deleteFiles } from '../../services/files';
import { cacheMask, clearCachedMasks, getCachedMask } from '../scan/sessionCache';

/**
 * App-wide state: onboarding, entitlement, free-scan count and the scan history.
 * Kept deliberately small. Persisted through the storage service.
 */
export interface AppState {
  ready: boolean;
  onboardingDone: boolean;
  entitlement: Entitlement;
  freeScansUsed: number;
  /** When the last free scan was taken, or null if none yet. */
  lastFreeScanAt: number | null;
  /** True once the single free practice session has been used. */
  freePracticeUsed: boolean;
  scans: ScanRecord[];
  practices: PracticeRecord[];
  /** Breathing rate found by the resonance finder, breaths per minute, or null. */
  resonanceRate: number | null;
  frameStyle: FrameStyleId;
  /** The store's own localized prices, where a store is connected; empty otherwise. */
  prices: PlanPrices;
  /** Whether live prices have loaded. Store-backed builds never fall back to built-in prices. */
  pricesStatus: PricesStatus;
  /** Derived: Pro, or a free scan available this week. */
  canScan: boolean;
  freeScansLeft: number;
  /** Derived: when the next free scan arrives, if one is not available now. */
  nextFreeScanAt: number | null;
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
  /** Ask the store for prices again, e.g. after the person was offline. */
  refreshPrices(): Promise<void>;
  manageSubscriptions(): Promise<void>;
  deleteAllData(): Promise<void>;
}

type StoredState = Omit<AppState, 'canScan' | 'freeScansLeft' | 'canPractice' | 'nextFreeScanAt'>;

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
    lastFreeScanAt: null,
    freePracticeUsed: false,
    scans: [],
    practices: [],
    resonanceRate: null,
    frameStyle: 'classic',
    prices: {},
    pricesStatus: 'loading',
  });

  // Store prices arrive on their own; the app never waits on the network to open.
  const fetchPrices = React.useCallback(async () => {
    const prices = (await purchases.getPrices?.().catch(() => ({}) as PlanPrices)) ?? {};
    return { prices, pricesStatus: pricesStatusFor(purchases.name !== 'dev', prices) };
  }, [purchases]);
  const loadPrices = React.useCallback(async () => {
    const next = await fetchPrices();
    setState((s) => ({ ...s, ...next }));
  }, [fetchPrices]);

  React.useEffect(() => {
    let canceled = false;
    fetchPrices()
      .then((next) => {
        if (!canceled) setState((s) => ({ ...s, ...next }));
      })
      .catch(() => {});
    return () => {
      canceled = true;
    };
  }, [fetchPrices]);

  // Coming back to the app re-checks Pro with the store, so a canceled subscription locks once it
  // ends and a purchase made elsewhere (another device, Family Sharing) unlocks without a restart.
  const pricesStatusRef = React.useRef<PricesStatus>('loading');
  React.useEffect(() => {
    pricesStatusRef.current = state.pricesStatus;
  }, [state.pricesStatus]);
  React.useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => {
      if (s !== 'active') return;
      purchases
        .getEntitlement()
        .then((entitlement) =>
          setState((st) => (st.entitlement.isPro === entitlement.isPro && st.entitlement.plan === entitlement.plan && st.entitlement.expiresAt === entitlement.expiresAt ? st : { ...st, entitlement })),
        )
        .catch(() => {});
      if (pricesStatusRef.current === 'unavailable') void loadPrices();
    });
    return () => sub.remove();
  }, [purchases, loadPrices]);

  React.useEffect(() => {
    let canceled = false;
    (async () => {
      const [onboarding, entitlement, used, scans, practices, resonance, frame, practiceUsed, lastFree] = await Promise.all([
        getSetting(ONBOARDING_KEY),
        purchases.getEntitlement(),
        getFreeScansUsed(),
        listScans(),
        listPractices(),
        getSetting(RESONANCE_KEY),
        getSetting(FRAME_KEY),
        getSetting(FREE_PRACTICE_USED_KEY),
        getLastFreeScanAt(),
      ]);
      // Outlines are restored before the first portrait draws, so a saved still and its aura
      // always line up.
      try {
        for (const m of await listMasks()) cacheMask(m.scanId, m);
      } catch {
        // A missing outline falls back to the neutral silhouette.
      }
      if (canceled) return;
      setState((prev) => ({
        prices: prev.prices,
        pricesStatus: prev.pricesStatus,
        ready: true,
        onboardingDone: onboarding === '1',
        entitlement,
        freeScansUsed: used,
        lastFreeScanAt: lastFree,
        freePracticeUsed: practiceUsed === '1' || practices.length > 0,
        scans,
        practices,
        resonanceRate: resonance ? Number(resonance) || null : null,
        frameStyle: (frame as FrameStyleId | null) ?? 'classic',
      }));
    })().catch((e) => {
      console.warn('App store failed to load', e);
      if (!canceled) setState((s) => ({ ...s, ready: true }));
    });
    return () => {
      canceled = true;
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
        const mask = getCachedMask(record.id);
        if (mask) await saveMask({ scanId: record.id, ...mask }).catch(() => {});
        // Only a saved portrait uses the free scan. A reading that failed was never saved.
        const isPro = stateRef.current.entitlement.isPro;
        const used = isPro ? stateRef.current.freeScansUsed : await incrementFreeScansUsed();
        if (!isPro) await markFreeScanUsed(record.createdAt);
        const scans = await listScans();
        setState((s) => ({ ...s, scans, freeScansUsed: used, lastFreeScanAt: isPro ? s.lastFreeScanAt : record.createdAt }));
      },
      async recordPractice(record) {
        await savePractice(record);
        await setSetting(FREE_PRACTICE_USED_KEY, '1');
        const practices = await listPractices();
        setState((s) => ({ ...s, practices, freePracticeUsed: true }));
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
      async refreshPrices() {
        setState((s) => (s.pricesStatus === 'ready' ? s : { ...s, pricesStatus: 'loading' }));
        await loadPrices();
      },
      manageSubscriptions: () => purchases.openManageSubscriptions(),
      async deleteAllData() {
        // The photographs and exported portraits are files, not database rows; remove them too.
        const [scans, practices] = await Promise.all([listScans(100000), listPractices(100000)]);
        deleteFiles([...scans.flatMap((s) => [s.stillUri, s.portraitUri]), ...practices.flatMap((p) => [p.beforePortraitUri, p.afterPortraitUri])]);
        await deleteAllScans();
        clearCachedMasks();
        // What the person has already used of the free tier, and what they have paid for, is
        // not their data to delete; everything else goes.
        await clearSettings([FREE_SCANS_USED_KEY, FREE_SCAN_LAST_KEY, FREE_PRACTICE_USED_KEY, ENTITLEMENT_KEY]);
        await setSetting(ONBOARDING_KEY, '1');
        const entitlement = await purchases.getEntitlement();
        setState((s) => ({ ready: true, onboardingDone: true, entitlement, freeScansUsed: s.freeScansUsed, lastFreeScanAt: s.lastFreeScanAt, freePracticeUsed: s.freePracticeUsed, scans: [], practices: [], resonanceRate: null, frameStyle: 'classic', prices: s.prices, pricesStatus: s.pricesStatus }));
      },
    }),
    [purchases, loadPrices],
  );

  const now = useNow();
  const derived = React.useMemo<AppState>(() => {
    return { ...state, ...accessFor({ isPro: state.entitlement.isPro, lastFreeScanAt: state.lastFreeScanAt, freePracticeUsed: state.freePracticeUsed }, now) };
  }, [state, now]);

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
