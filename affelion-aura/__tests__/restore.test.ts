/** Restore Purchases goes through RevenueCat and needs no account (launch/STATUS.md, M3 and M4). */
jest.mock('../src/services/storage', () => ({ getSetting: jest.fn(), setSetting: jest.fn() }));
const mockPurchases = {
  configure: jest.fn(),
  setLogLevel: jest.fn(async () => {}),
  restorePurchases: jest.fn(),
  getCustomerInfo: jest.fn(),
  logIn: jest.fn(),
};
jest.mock('react-native-purchases', () => ({ __esModule: true, get default() { return mockPurchases; }, INTRO_ELIGIBILITY_STATUS: {}, LOG_LEVEL: { WARN: 'WARN' }, PURCHASES_ERROR_CODE: {} }));
import { RevenueCatPurchaseProvider } from '../src/services/purchases/revenueCat';

const active = { entitlements: { active: { halo_pro: { productIdentifier: 'com.affelion.aura.pro.monthly', expirationDate: '2026-12-20T00:00:00Z' } } } };

describe('restore through RevenueCat', () => {
  beforeEach(() => jest.clearAllMocks());

  it('asks the store to restore and unlocks Pro when it finds a purchase', async () => {
    mockPurchases.restorePurchases.mockResolvedValue(active);
    const e = await new RevenueCatPurchaseProvider('appl_test').restore();
    expect(mockPurchases.configure).toHaveBeenCalledWith({ apiKey: 'appl_test' });
    expect(mockPurchases.restorePurchases).toHaveBeenCalledTimes(1);
    expect(e).toMatchObject({ isPro: true, plan: 'monthly', source: 'store' });
  });

  it('stays free when there is nothing to restore', async () => {
    mockPurchases.restorePurchases.mockResolvedValue({ entitlements: { active: {} } });
    expect((await new RevenueCatPurchaseProvider('appl_test').restore()).isPro).toBe(false);
  });

  it('never asks the person to sign in', async () => {
    mockPurchases.restorePurchases.mockResolvedValue(active);
    await new RevenueCatPurchaseProvider('appl_test').restore();
    expect(mockPurchases.logIn).not.toHaveBeenCalled();
  });
});
