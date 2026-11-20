/**
 * Pro gating (launch/STATUS.md, M3): what the free plan and Pro may do, how a store answer
 * becomes Pro or not, and that a store build never shows made-up prices.
 */
jest.mock('../src/services/storage', () => ({ getSetting: jest.fn(), setSetting: jest.fn() }));
jest.mock('react-native-purchases', () => ({ __esModule: true, default: {}, INTRO_ELIGIBILITY_STATUS: {}, LOG_LEVEL: {}, PURCHASES_ERROR_CODE: {} }));
import { accessFor } from '../src/services/freeTier';
import { pricesStatusFor } from '../src/services/entitlements';
import { toEntitlement } from '../src/services/purchases/revenueCat';

const DAY = 24 * 3600 * 1000;
const NOW = Date.UTC(2026, 10, 20, 12);

// Only the fields toEntitlement reads.
const info = (active: Record<string, { productIdentifier: string; expirationDate: string | null }>) => ({ entitlements: { active } }) as never;

describe('access rules', () => {
  it('Pro can always scan and practice', () => {
    const a = accessFor({ isPro: true, lastFreeScanAt: NOW - DAY, freePracticeUsed: true }, NOW);
    expect(a.canScan).toBe(true);
    expect(a.canPractice).toBe(true);
  });

  it('the free plan gets one scan a week and one practice', () => {
    expect(accessFor({ isPro: false, lastFreeScanAt: null, freePracticeUsed: false }, NOW)).toMatchObject({ canScan: true, canPractice: true, freeScansLeft: 1 });
    expect(accessFor({ isPro: false, lastFreeScanAt: NOW - DAY, freePracticeUsed: true }, NOW)).toMatchObject({ canScan: false, canPractice: false, freeScansLeft: 0, nextFreeScanAt: NOW + 6 * DAY });
    expect(accessFor({ isPro: false, lastFreeScanAt: NOW - 7 * DAY, freePracticeUsed: true }, NOW).canScan).toBe(true);
  });
});

describe('store answer to Pro', () => {
  it('an active "halo_pro" entitlement unlocks Pro with its plan and end date', () => {
    const e = toEntitlement(info({ halo_pro: { productIdentifier: 'com.affelion.aura.pro.annual', expirationDate: '2027-11-20T12:00:00Z' } }));
    expect(e).toEqual({ isPro: true, plan: 'annual', expiresAt: Date.parse('2027-11-20T12:00:00Z'), source: 'store' });
  });

  it('a lifetime purchase never expires', () => {
    expect(toEntitlement(info({ halo_pro: { productIdentifier: 'com.affelion.aura.pro.lifetime', expirationDate: null } }))).toMatchObject({ isPro: true, plan: 'lifetime', expiresAt: null });
  });

  it('no active entitlement, or an expired or canceled one, locks Pro', () => {
    // The store drops an expired subscription from the active list.
    expect(toEntitlement(info({})).isPro).toBe(false);
    expect(toEntitlement(info({ other: { productIdentifier: 'x', expirationDate: null } })).isPro).toBe(false);
  });
});

describe('prices', () => {
  it('a store build with no prices from the store asks to try again', () => {
    expect(pricesStatusFor(true, {})).toBe('unavailable');
    expect(pricesStatusFor(true, { annual: { price: '$69.99', perMonth: '$5.83' } })).toBe('ready');
  });

  it('a simulated build uses the listed prices', () => {
    expect(pricesStatusFor(false, {})).toBe('ready');
  });
});
