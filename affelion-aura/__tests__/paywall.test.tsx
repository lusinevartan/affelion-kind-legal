/**
 * The paywall (launch/STATUS.md, M4 and M5): everything Apple's guideline 3.1.2 asks to be
 * visible, closing returns to the portrait, Restore Purchases goes through the store, and a
 * store build never shows prices the store did not send.
 */
import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn(), canGoBack: jest.fn(() => true) };
jest.mock('expo-router', () => ({ get router() { return mockRouter; }, useLocalSearchParams: () => ({ from: 'scan_1' }) }));
jest.mock('../src/services/storage', () => ({ getSetting: jest.fn(), setSetting: jest.fn() }));
jest.mock('../src/services/links', () => ({ PRIVACY_URL: 'https://example.com/privacy', TERMS_URL: 'https://example.com/terms', openLink: jest.fn() }));
jest.mock('../src/services/entitlements', () => ({
  ...jest.requireActual('../src/services/entitlements'),
  purchasesAreSimulated: () => false,
  purchasesAvailable: () => true,
}));

const mockActions = { purchase: jest.fn(), restore: jest.fn(async () => ({ isPro: true, plan: 'annual', expiresAt: null, source: 'store' })), manageSubscriptions: jest.fn(), refreshPrices: jest.fn() };
let mockAppState: Record<string, unknown>;
jest.mock('../src/features/store/AppStore', () => ({ useAppState: () => mockAppState, useAppActions: () => mockActions }));

import Paywall, { BENEFITS } from '../src/app/paywall';
import { openLink } from '../src/services/links';

const NOT_PRO = { isPro: false, plan: null, expiresAt: null, source: 'none' };
const storePrices = {
  annual: { price: '$69.99', perMonth: '$5.83', trial: { count: 7, unit: 'day' } },
  monthly: { price: '$12.99', perMonth: null, trial: null },
};
const show = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
      <Paywall />
    </SafeAreaProvider>,
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockRouter.canGoBack.mockReturnValue(true);
  mockAppState = { entitlement: NOT_PRO, prices: storePrices, pricesStatus: 'ready' };
});

describe('paywall content', () => {
  it('shows each plan with the store price and billing period', async () => {
    await show();
    expect(screen.getByText('$69.99')).toBeTruthy();
    expect(screen.getByText('$5.83 / month')).toBeTruthy();
    expect(screen.getByText('$12.99')).toBeTruthy();
    expect(screen.getByText('per month')).toBeTruthy();
  });

  it('states the trial terms and renewal terms in readable text', async () => {
    await show();
    expect(screen.getByText('7 days free, then $69.99 per year.')).toBeTruthy();
    expect(screen.getByText(/when the free trial ends unless you cancel at least 24 hours before\. Renews automatically\. Cancel anytime in Settings\./)).toBeTruthy();
    expect(screen.getByText('Start my free week')).toBeTruthy();
  });

  it('lists what Pro includes', async () => {
    await show();
    for (const b of BENEFITS) expect(screen.getByText(b)).toBeTruthy();
  });

  it('shows Restore Purchases, Terms of Use and Privacy Policy, and the links open', async () => {
    await show();
    expect(screen.getByText('Restore Purchases')).toBeTruthy();
    await fireEvent.press(screen.getByText('Terms of Use'));
    await fireEvent.press(screen.getByText('Privacy Policy'));
    expect(openLink).toHaveBeenCalledWith('https://example.com/terms');
    expect(openLink).toHaveBeenCalledWith('https://example.com/privacy');
  });

  it('hides the one-time purchase until asked', async () => {
    await show();
    expect(screen.queryByText('Lifetime')).toBeNull();
    expect(screen.getByText('Prefer to pay once?')).toBeTruthy();
  });
});

describe('guideline 3.1.2 disclosures', () => {
  it('without a trial: annual says how often it bills, monthly shows its period, renewal terms say it renews automatically', async () => {
    mockAppState = { entitlement: NOT_PRO, prices: { annual: { price: '$69.99', perMonth: '$5.83', trial: null }, monthly: { price: '$12.99', perMonth: null, trial: null } }, pricesStatus: 'ready' };
    await show();
    expect(screen.getByText('Billed once a year. Cancel anytime.')).toBeTruthy();
    expect(screen.getByText('per month')).toBeTruthy();
    expect(screen.getByText(/Renews automatically unless you cancel at least 24 hours before the period ends\. Cancel anytime in Settings\./)).toBeTruthy();
    expect(screen.getByText('Continue')).toBeTruthy();
  });

  it('the one-time purchase shows its price, that it is one time, and that it never renews', async () => {
    mockAppState = { entitlement: NOT_PRO, prices: { ...storePrices, lifetime: { price: '$199.00', perMonth: null, trial: null } }, pricesStatus: 'ready' };
    await show();
    await fireEvent.press(screen.getByText('Prefer to pay once?'));
    expect(screen.getByText('$199.00')).toBeTruthy();
    expect(screen.getByText('one time')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText(/^Lifetime,/));
    expect(screen.getByText(/One payment to your Apple ID\. It never renews\./)).toBeTruthy();
  });
});

describe('closing', () => {
  it('"Not now" goes back to the portrait it opened from', async () => {
    await show();
    await fireEvent.press(screen.getByLabelText('Not now, close'));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('with nothing to go back to, "Not now" opens that portrait', async () => {
    mockRouter.canGoBack.mockReturnValue(false);
    await show();
    await fireEvent.press(screen.getByLabelText('Not now, close'));
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/portrait/[id]', params: { id: 'scan_1' } });
  });
});

describe('restore', () => {
  it('Restore Purchases asks the store', async () => {
    await show();
    await fireEvent.press(screen.getByText('Restore Purchases'));
    expect(mockActions.restore).toHaveBeenCalledTimes(1);
  });
});

describe('prices that did not load', () => {
  it('shows a friendly retry and no made-up prices', async () => {
    mockAppState = { entitlement: NOT_PRO, prices: {}, pricesStatus: 'unavailable' };
    await show();
    expect(screen.getByText('We could not load prices.')).toBeTruthy();
    expect(screen.queryByText('$69.99')).toBeNull();
    await fireEvent.press(screen.getByText('Try again'));
    expect(mockActions.refreshPrices).toHaveBeenCalledTimes(1);
  });
});
