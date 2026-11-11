import { Linking, Platform } from 'react-native';
import { getSetting, setSetting } from './storage';

/**
 * Free tier: 3 scans with the basic portrait. Paid: unlimited scans, full report, history
 * and trends, the AI guide, premium styles and clean exports.
 *
 * Billing goes through a `PurchaseProvider`. The app ships with a development provider that
 * simulates purchases locally so the whole flow can be exercised without store accounts.
 * For production, implement the same interface with RevenueCat or expo-iap (see
 * docs/ARCHITECTURE.md → Monetisation) and swap it in `createPurchaseProvider`.
 */

export const FREE_SCAN_LIMIT = 3;

export type PlanId = 'monthly' | 'annual' | 'lifetime';

export interface Plan {
  id: PlanId;
  productId: string;
  title: string;
  /** Display price string. Real providers return localised strings from the store. */
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
    price: '$8.99',
    period: 'per month',
    perMonth: null,
    note: 'Cancel any time in your App Store or Google Play subscriptions.',
  },
  {
    id: 'annual',
    productId: 'com.affelion.aura.pro.annual',
    title: 'Annual',
    price: '$54',
    period: 'per year',
    perMonth: '$4.50 / month',
    recommended: true,
    note: 'Billed once a year. Cancel any time; access continues to the end of the period.',
  },
  {
    id: 'lifetime',
    productId: 'com.affelion.aura.pro.lifetime',
    title: 'Lifetime',
    price: '$89',
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

export interface PurchaseProvider {
  readonly name: string;
  getEntitlement(): Promise<Entitlement>;
  purchase(plan: PlanId): Promise<Entitlement>;
  restore(): Promise<Entitlement>;
  /** Opens the platform's subscription management page so cancelling is one tap away. */
  openManageSubscriptions(): Promise<void>;
}

const ENTITLEMENT_KEY = 'entitlement.dev';

/** Local simulation for development builds. Clearly labelled in the UI. */
export class DevPurchaseProvider implements PurchaseProvider {
  readonly name = 'dev';

  async getEntitlement(): Promise<Entitlement> {
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
    const { RevenueCatPurchaseProvider } = require('./purchases/revenueCat') as typeof import('./purchases/revenueCat');
    return new RevenueCatPurchaseProvider(key);
  }
  return new DevPurchaseProvider();
}

function revenueCatKey(): string | null {
  const key = Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_RC_IOS_KEY : process.env.EXPO_PUBLIC_RC_ANDROID_KEY;
  return key && key.length > 0 ? key : null;
}

/** True when purchases are simulated, so the paywall can say so. */
export function purchasesAreSimulated(): boolean {
  return revenueCatKey() === null;
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

export function freeScansRemaining(used: number): number {
  return Math.max(0, FREE_SCAN_LIMIT - used);
}
