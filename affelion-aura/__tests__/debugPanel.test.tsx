/**
 * The TestFlight debug screen (launch/STATUS.md, M9): only a TestFlight build can turn it on,
 * the App Store build cannot, and its report carries what Claude needs to diagnose a failure.
 */
import * as React from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react-native';

const mockRedirects: string[] = [];
jest.mock('expo-router', () => ({ Redirect: ({ href }: { href: string }) => { mockRedirects.push(href); return null; }, router: { back: jest.fn(), push: jest.fn() } }));
jest.mock('expo-constants', () => ({ __esModule: true, default: { expoConfig: { version: '1.0.0' } } }));

import { buildDebugReport, EMPTY_SNAPSHOT, updateDebug, resetDebug, getDebugSnapshot } from '../src/features/debug/debugStore';

const eas = JSON.parse(readFileSync(join(__dirname, '../eas.json'), 'utf8'));

describe('who can turn the debug screen on', () => {
  it('the production (App Store) profile never sets the flag', () => {
    expect(JSON.stringify(eas.build.production)).not.toMatch(/DEBUG_PANEL/);
    expect(JSON.stringify(eas.build.preview)).not.toMatch(/DEBUG_PANEL/);
  });

  it('the testflight profile sets it and builds from production', () => {
    expect(eas.build.testflight.extends).toBe('production');
    expect(eas.build.testflight.env.EXPO_PUBLIC_DEBUG_PANEL).toBe('1');
  });

  it('the flag is read only from the build, nowhere else', () => {
    const flag = readFileSync(join(__dirname, '../src/features/debug/debugFlag.ts'), 'utf8');
    expect(flag).toMatch(/process\.env\.EXPO_PUBLIC_DEBUG_PANEL === '1'/);
  });
});

describe('the debug route', () => {
  const load = (dev: boolean, flag: string) => {
    jest.resetModules();
    (globalThis as { __DEV__?: boolean }).__DEV__ = dev;
    process.env.EXPO_PUBLIC_DEBUG_PANEL = flag;
    return require('../src/app/debug').default as React.ComponentType;
  };
  afterAll(() => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    delete process.env.EXPO_PUBLIC_DEBUG_PANEL;
  });

  it('sends an App Store build home', async () => {
    const Debug = load(false, '');
    mockRedirects.length = 0;
    await render(<Debug />);
    expect(mockRedirects).toEqual(['/home']);
  });
});

describe('the debug report', () => {
  it('includes the numbers Claude needs', () => {
    resetDebug('scan');
    updateDebug({ phase: 'failed', guidance: 'failedFinger', failure: 'too dark' });
    updateDebug({ pulse: { liveQuality: 0.42, bpm: 71, beats: 18, coverage: 'tooDark', coverageConfidence: 0.3, coveredSec: 12.5 } });
    updateDebug({ final: { bpm: 70, quality: 0.41, beatCount: 18, durationSec: 22, rmssd: 38 }, gate: { ok: false, reason: 'signal quality 41% is below 50%' } });
    updateDebug({ voice: { level: 0.2, voicedSec: 3.1, pitchHz: 180, finalQuality: 0.7 } });
    const text = buildDebugReport(getDebugSnapshot(), { appVersion: '1.0.0', build: '7', device: 'iPhone 15', os: 'ios 27.1' });
    for (const s of ['build 7', 'iPhone 15', 'Phase: failed', 'Last failure: too dark', 'Signal quality: 42%', 'BPM: 71', 'beats accepted: 18', 'Coverage: tooDark', 'finger covered: 12.5 s', 'RETRY (signal quality 41% is below 50%)', 'pitch: 180 Hz', 'final quality: 70%']) {
      expect(text).toContain(s);
    }
  });

  it('reads clearly before anything has run', () => {
    const text = buildDebugReport(EMPTY_SNAPSHOT, { appVersion: '1.0.0', build: 'n/a', device: 'iPhone', os: 'ios' });
    expect(text).toContain('Reading gate: not checked yet');
    expect(text).toContain('No final reading');
  });
});

describe('the debug route in a TestFlight build', () => {
  it('opens the panel', async () => {
    jest.resetModules();
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    process.env.EXPO_PUBLIC_DEBUG_PANEL = '1';
    const { debugPanelEnabled } = require('../src/features/debug/debugFlag') as typeof import('../src/features/debug/debugFlag');
    expect(debugPanelEnabled()).toBe(true);
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    delete process.env.EXPO_PUBLIC_DEBUG_PANEL;
  });
});
