import { Linking, Platform } from 'react-native';
import { getSetting, setSetting } from './storage';
import type { Trial } from './trial';
import { FREE_SCAN_INTERVAL_MS, accessFor, freeScanStatus, freeScansRemaining, nextFreeScanAt } from './freeTier';

export { FREE_SCAN_INTERVAL_MS, accessFor, freeScanStatus, freeScansRemaining, nextFreeScanAt };

/**
 * Prices sit level with the leading meditation apps (about $13 a month, $70 a year). They are
 * the figures shown when no store is connected; the stores' own prices replace them otherwise.
 *
 * Free tier: the first scan is free, then one free scan a week, each with the basic portrait.
 * Pro: unlimited scans, full report, history and trends, the AI guide, premium styles and clean
 * exports. (The launch plan's recommendation; test it against three scans total once there is
 * traffic.)
 *
 * Billing goes through a `PurchaseProvider`. The app ships with a development provider that
 * simulates purchases locally so the whole flow can be exercised without store accounts.
 * For production, implement the same interface with RevenueCat or expo-iap (see
 * docs/ARCHITECTURE.md → Monetization) and swap it in `createPurchaseProvider`.
 */


export type PlanId = 'monthly' | 'annual' | 'lifetime';

export interface Plan {
  id: PlanId;
  productId: string;
  title: string;
  /** Display price string. Real providers return localized strings from the store. */
  price: string;
  period: string;
  /** Per-month framing for comparison. */
  perMonth: string | null;
  recommended?: boolean;
  note: string;
}

export const PLANS: Plan[] = [
  {
    id: 'monthly',
    productId: 'com.affelion.aura.pro.monthly',
    title: 'Monthly',
    price: '$12.99',
    period: 'per month',
    perMonth: null,
    note: 'Cancel any time in your App Store or Google Play subscriptions.',
  },
  {
    id: 'annual',
    productId: 'com.affelion.aura.pro.annual',
    title: 'Annual',
    price: '$69.99',
    period: 'per year',
    perMonth: '$5.83 / month',
    recommended: true,
    note: 'Billed once a year. Cancel any time; access continues to the end of the period.',
  },
  {
    id: 'lifetime',
    productId: 'com.affelion.aura.pro.lifetime',
    title: 'Lifetime',
    // Close to three years of the annual plan, so the annual plan stays the natural choice and
    // a one-time buyer still covers the running cost of the guide.
    price: '$199',
    period: 'one time',
    perMonth: null,
    note: 'A single purchase. No renewal.',
  },
];

export interface Entitlement {
  isPro: boolean;
  plan: PlanId | null;
  /** Unix ms when a subscription period ends, if known. */
  expiresAt: number | null;
  source: 'dev' | 'store' | 'none';
}

export const NO_ENTITLEMENT: Entitlement = { isPro: false, plan: null, expiresAt: null, source: 'none' };

/** Prices as the store will charge them, formatted for the person's country and currency. */
export type PlanPrices = Partial<Record<PlanId, { price: string; perMonth: string | null; /** A free trial the store offers this person on the plan. */ trial?: Trial | null }>>;

export interface PurchaseProvider {
  readonly name: string;
  getEntitlement(): Promise<Entitlement>;
  /**
   * The store's own prices, when a store is connected. The paywall shows these in place of the
   * figures in PLANS, so what a person reads is always what they are charged.
   */
  getPrices?(): Promise<PlanPrices>;
  purchase(plan: PlanId): Promise<Entitlement>;
  restore(): Promise<Entitlement>;
  /** Opens the platform's subscription management page so canceling is one tap away. */
  openManageSubscriptions(): Promise<void>;
}

export const ENTITLEMENT_KEY = 'entitlement.dev';

/**
 * Simulated purchases exist so the flow can be exercised without store accounts. They are only
 * honored in development, in the web review build, or when a build opts in explicitly with
 * EXPO_PUBLIC_ALLOW_SIMULATED_PURCHASES=1 (for an internal test build). A release build that is
 * missing its store keys must never hand out Pro for free.
 */
export function simulatedPurchasesAllowed(): boolean {
  return __DEV__ || Platform.OS === 'web' || process.env.EXPO_PUBLIC_ALLOW_SIMULATED_PURCHASES === '1';
}

/** Local simulation for development builds. Clearly labeled in the UI. */
export class DevPurchaseProvider implements PurchaseProvider {
  readonly name = 'dev';

  async getEntitlement(): Promise<Entitlement> {
    if (!simulatedPurchasesAllowed()) return NO_ENTITLEMENT;
    const raw = await getSetting(ENTITLEMENT_KEY);
    if (!raw) return NO_ENTITLEMENT;
    try {
      const e = JSON.parse(raw) as Entitlement;
      if (e.expiresAt && e.expiresAt < Date.now()) return NO_ENTITLEMENT;
      return e;
    } catch {
      return NO_ENTITLEMENT;
    }
  }

  async purchase(plan: PlanId): Promise<Entitlement> {
    if (!simulatedPurchasesAllowed()) throw new Error('Purchases are not available in this build yet.');
    const expiresAt = plan === 'lifetime' ? null : Date.now() + (plan === 'annual' ? 365 : 30) * 24 * 3600 * 1000;
    const e: Entitlement = { isPro: true, plan, expiresAt, source: 'dev' };
    await setSetting(ENTITLEMENT_KEY, JSON.stringify(e));
    return e;
  }

  async restore(): Promise<Entitlement> {
    return this.getEntitlement();
  }

  async openManageSubscriptions(): Promise<void> {
    await openStoreSubscriptions();
  }
}

export async function openStoreSubscriptions(): Promise<void> {
  const url =
    Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions';
  await Linking.openURL(url);
}

export function createPurchaseProvider(): PurchaseProvider {
  // Store-backed when RevenueCat keys are present in the build; the simulated provider otherwise.
  // Required lazily so the dev provider never loads the native module (web review builds).
  const key = revenueCatKey();
  if (key) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy so web review builds never load the native module
    const { RevenueCatPurchaseProvider } = require('./purchases/revenueCat') as typeof import('./purchases/revenueCat');
    return new RevenueCatPurchaseProvider(key);
  }
  return new DevPurchaseProvider();
}

function revenueCatKey(): string | null {
  const key = Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_RC_IOS_KEY : process.env.EXPO_PUBLIC_RC_ANDROID_KEY;
  return key && key.length > 0 ? key : null;
}

/** Prices come from the store in a store-backed build; this says whether they arrived. */
export type PricesStatus = 'loading' | 'ready' | 'unavailable';

/**
 * A store-backed build must show the store's own prices or none at all; the figures in PLANS are
 * only for simulated builds. No prices from the store (offline, or products not set up yet) means
 * "unavailable", and the paywall asks the person to try again instead of guessing.
 */
export function pricesStatusFor(storeBacked: boolean, prices: PlanPrices): PricesStatus {
  if (!storeBacked) return 'ready';
  return prices.annual || prices.monthly ? 'ready' : 'unavailable';
}

/** True when purchases are simulated, so the paywall can say so. */
export function purchasesAreSimulated(): boolean {
  return revenueCatKey() === null && simulatedPurchasesAllowed();
}

/** False in a build that has neither store keys nor permission to simulate. */
export function purchasesAvailable(): boolean {
  return revenueCatKey() !== null || simulatedPurchasesAllowed();
}

export const FREE_SCANS_USED_KEY = 'freeScansUsed';

export async function getFreeScansUsed(): Promise<number> {
  const raw = await getSetting(FREE_SCANS_USED_KEY);
  return raw ? Number(raw) || 0 : 0;
}

export async function incrementFreeScansUsed(): Promise<number> {
  const n = (await getFreeScansUsed()) + 1;
  await setSetting(FREE_SCANS_USED_KEY, String(n));
  return n;
}

/** Set once the single free practice session has been used. Survives "delete all data". */
export const FREE_PRACTICE_USED_KEY = 'freePracticeUsed';

/** When the last free scan was taken (Unix ms). Survives "delete all data", like the count. */
export const FREE_SCAN_LAST_KEY = 'freeScanLastAt';

export async function getLastFreeScanAt(): Promise<number | null> {
  const raw = await getSetting(FREE_SCAN_LAST_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function markFreeScanUsed(at: number): Promise<void> {
  await setSetting(FREE_SCAN_LAST_KEY, String(at));
}



