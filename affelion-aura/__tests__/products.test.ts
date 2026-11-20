/**
 * The product IDs here must match App Store Connect, Google Play and RevenueCat exactly
 * (launch/STATUS.md, M2). Changing one in code without changing it in the stores breaks buying.
 */
jest.mock('../src/services/storage', () => ({ getSetting: jest.fn(), setSetting: jest.fn() }));
import { PLANS } from '../src/services/entitlements';
import { RC_ENTITLEMENT } from '../src/services/purchases/revenueCat';

jest.mock('react-native-purchases', () => ({ __esModule: true, default: {}, INTRO_ELIGIBILITY_STATUS: {}, LOG_LEVEL: {}, PURCHASES_ERROR_CODE: {} }));

describe('store products', () => {
  it('uses the product IDs set up in the stores', () => {
    expect(Object.fromEntries(PLANS.map((p) => [p.id, p.productId]))).toEqual({
      monthly: 'com.affelion.aura.pro.monthly',
      annual: 'com.affelion.aura.pro.annual',
      lifetime: 'com.affelion.aura.pro.lifetime',
    });
  });

  it('unlocks Pro through one entitlement named "halo_pro"', () => {
    expect(RC_ENTITLEMENT).toBe('halo_pro');
  });

  it('marks annual as the recommended plan', () => {
    expect(PLANS.filter((p) => p.recommended).map((p) => p.id)).toEqual(['annual']);
  });
});

describe('app identifiers', () => {
  it('keeps the iOS bundle ID of the existing App Store record and uses com.affelion.halo on Android', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const app = require('../app.json').expo;
    expect(app.ios.bundleIdentifier).toBe('com.affelion.aura');
    expect(app.android.package).toBe('com.affelion.halo');
  });
});
