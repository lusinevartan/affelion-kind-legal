/**
 * The paywall never covers a reading (launch/STATUS.md, M5): the scan screen never opens it, and
 * the portrait offers it once, two seconds after a free person's first portrait is on screen.
 */
import * as React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const mockRouter = { back: jest.fn(), replace: jest.fn(), push: jest.fn(), canGoBack: jest.fn(() => true) };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ get router() { return mockRouter; }, useLocalSearchParams: () => mockParams }));
jest.mock('expo-haptics', () => ({ impactAsync: jest.fn(async () => {}), ImpactFeedbackStyle: { Light: 'light' } }));
jest.mock('../src/services/storage', () => ({ getSetting: jest.fn(), setSetting: jest.fn() }));
jest.mock('../src/render/fluid/AuraView', () => ({ AuraView: () => null }));
jest.mock('../src/features/scan/sessionCache', () => ({ getCachedMask: () => null }));
jest.mock('../src/features/portrait/usePolaroidExport', () => ({ usePolaroidExport: () => ({ auraRef: { current: null }, busy: null, run: jest.fn(), exportCard: null }) }));
let mockAppState: Record<string, unknown> = {};
jest.mock('../src/features/store/AppStore', () => ({ useAppState: () => mockAppState, useAppActions: () => ({ refreshScans: jest.fn() }) }));

import PortraitScreen from '../src/app/portrait/[id]';
import { mapBiometricsToAura } from '../src/core/color/mapping';

const heart = { bpm: 84, rmssd: 62, sdnn: 68, pnn50: 28, beatCount: 44, quality: 0.9, durationSec: 40 };
const voice = { dominantPitchHz: 172, variance: 0.62, stability: 0.6, pitchVarianceSemitones: 2.4, energyVariance: 0.5, spectralCentroidHz: 1300, voicedRatio: 0.6, quality: 0.8, durationSec: 5 };
const scan = (id: string) => ({ id, createdAt: Date.UTC(2026, 10, 20), heart, voice, aura: mapBiometricsToAura({ heart, voice }), portraitUri: null, stillUri: null });
const FREE = { isPro: false, plan: null, expiresAt: null, source: 'none' };
const PRO = { isPro: true, plan: 'annual', expiresAt: null, source: 'store' };

const show = () =>
  render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 47, left: 0, right: 0, bottom: 34 } }}>
      <PortraitScreen />
    </SafeAreaProvider>,
  );
const paywallOpened = () => mockRouter.push.mock.calls.some(([arg]) => (arg as { pathname?: string }).pathname === '/paywall');

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

describe('when the paywall appears', () => {
  it('waits two seconds after a free first portrait, then opens once, from that portrait', async () => {
    mockParams = { id: 's1', fresh: '1' };
    mockAppState = { scans: [scan('s1')], entitlement: FREE };
    await show();
    await act(async () => jest.advanceTimersByTime(1900));
    expect(paywallOpened()).toBe(false);
    await act(async () => jest.advanceTimersByTime(200));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/paywall', params: { from: 's1' } });
    await act(async () => jest.advanceTimersByTime(10000));
    expect(mockRouter.push).toHaveBeenCalledTimes(1);
  });

  it('does not open for Pro, for a later portrait, or when reopening an old one', async () => {
    for (const [params, state] of [
      [{ id: 's1', fresh: '1' }, { scans: [scan('s1')], entitlement: PRO }],
      [{ id: 's2', fresh: '1' }, { scans: [scan('s2'), scan('s1')], entitlement: FREE }],
      [{ id: 's1' }, { scans: [scan('s1')], entitlement: FREE }],
    ] as const) {
      jest.clearAllMocks();
      mockParams = { ...params };
      mockAppState = { ...state };
      const r = await show();
      await act(async () => jest.advanceTimersByTime(5000));
      expect(paywallOpened()).toBe(false);
      await r.unmount();
    }
  });

  it('is never opened by the scan screen, so it cannot cover a reading in progress', () => {
    const scanScreen = readFileSync(join(__dirname, '../src/app/scan.tsx'), 'utf8');
    expect(scanScreen).not.toMatch(/paywall/);
    // The scan hands over to the portrait only, once the reading is saved.
    expect(scanScreen).toMatch(/recordScan\(record\)\s*\.then\(\(\) => router\.replace\(\{ pathname: '\/portrait\/\[id\]'/);
  });
});
