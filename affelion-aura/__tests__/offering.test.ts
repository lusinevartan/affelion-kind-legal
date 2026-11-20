/**
 * The RevenueCat project is shared with other Affelion apps. Halo must read only its own offering,
 * halo_default, never the project's "current" offering, which belongs to another app.
 */
jest.mock('../src/services/storage', () => ({ getSetting: jest.fn(), setSetting: jest.fn() }));
const pkg = (identifier: string, productId: string, price: string) => ({ identifier, product: { identifier: productId, priceString: price, pricePerMonthString: '$5.83', introPrice: null } });
const mockPurchases = {
  configure: jest.fn(),
  setLogLevel: jest.fn(async () => {}),
  purchasePackage: jest.fn(async (p: { product: { identifier: string } }) => ({ customerInfo: { entitlements: { active: { halo_pro: { productIdentifier: p.product.identifier, expirationDate: null } } } } })),
  checkTrialOrIntroductoryPriceEligibility: jest.fn(async () => ({})),
  getOfferings: jest.fn(async () => ({
    current: { identifier: 'default', availablePackages: [pkg('$rc_annual', 'com.affelion.pop.annual', '$9.99')] },
    all: {
      default: { identifier: 'default', availablePackages: [pkg('$rc_annual', 'com.affelion.pop.annual', '$9.99')] },
      halo_default: {
        identifier: 'halo_default',
        availablePackages: [
          pkg('$rc_annual', 'com.affelion.aura.pro.annual', '$69.99'),
          pkg('$rc_monthly', 'com.affelion.aura.pro.monthly', '$12.99'),
          pkg('$rc_lifetime', 'com.affelion.aura.pro.lifetime', '$199.00'),
        ],
      },
    },
  })),
};
jest.mock('react-native-purchases', () => ({ __esModule: true, get default() { return mockPurchases; }, INTRO_ELIGIBILITY_STATUS: { INTRO_ELIGIBILITY_STATUS_ELIGIBLE: 2 }, LOG_LEVEL: { WARN: 'WARN' }, PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: '1' } }));
import { RC_OFFERING, RC_PACKAGES, RevenueCatPurchaseProvider } from '../src/services/purchases/revenueCat';

describe('the halo_default offering', () => {
  beforeEach(() => jest.clearAllMocks());

  it('is the offering Halo uses, with the three package identifiers', () => {
    expect(RC_OFFERING).toBe('halo_default');
    expect(RC_PACKAGES).toEqual({ annual: '$rc_annual', monthly: '$rc_monthly', lifetime: '$rc_lifetime' });
  });

  it('prices come from halo_default, not the shared project\'s current offering', async () => {
    const prices = await new RevenueCatPurchaseProvider('appl_test').getPrices();
    expect(prices.annual?.price).toBe('$69.99');
    expect(prices.monthly?.price).toBe('$12.99');
    expect(prices.lifetime?.price).toBe('$199.00');
  });

  it('buying annual purchases the halo_default annual package and unlocks halo_pro', async () => {
    const e = await new RevenueCatPurchaseProvider('appl_test').purchase('annual');
    expect(mockPurchases.purchasePackage).toHaveBeenCalledWith(expect.objectContaining({ identifier: '$rc_annual', product: expect.objectContaining({ identifier: 'com.affelion.aura.pro.annual' }) }));
    expect(e).toMatchObject({ isPro: true, plan: 'annual' });
  });
});
