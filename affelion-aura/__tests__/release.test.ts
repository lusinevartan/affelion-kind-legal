/**
 * Release builds (launch/STATUS.md, M6): purchases can never be simulated, so no test text and no
 * free Pro can appear, and no build profile turns simulation on.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

jest.mock('../src/services/storage', () => ({ getSetting: jest.fn(), setSetting: jest.fn() }));

function loadAs({ dev, os, flag, key }: { dev: boolean; os: string; flag?: string; key?: string }) {
  jest.resetModules();
  (globalThis as { __DEV__?: boolean }).__DEV__ = dev;
  process.env.EXPO_PUBLIC_ALLOW_SIMULATED_PURCHASES = flag ?? '';
  process.env.EXPO_PUBLIC_RC_IOS_KEY = key ?? '';
  jest.doMock('react-native', () => ({ Platform: { OS: os }, Linking: { openURL: jest.fn() } }));
  return require('../src/services/entitlements') as typeof import('../src/services/entitlements');
}

afterAll(() => {
  (globalThis as { __DEV__?: boolean }).__DEV__ = true;
  delete process.env.EXPO_PUBLIC_ALLOW_SIMULATED_PURCHASES;
  delete process.env.EXPO_PUBLIC_RC_IOS_KEY;
});

describe('release builds', () => {
  it('never simulate purchases on iPhone, with or without a store key', () => {
    for (const key of [undefined, 'appl_x']) {
      const e = loadAs({ dev: false, os: 'ios', key });
      expect(e.simulatedPurchasesAllowed()).toBe(false);
      expect(e.purchasesAreSimulated()).toBe(false);
    }
  });

  it('take no money and give no Pro when the store key is missing', async () => {
    const e = loadAs({ dev: false, os: 'ios' });
    expect(e.purchasesAvailable()).toBe(false);
    const p = new e.DevPurchaseProvider();
    await expect(p.purchase('annual')).rejects.toThrow();
    expect((await p.getEntitlement()).isPro).toBe(false);
  });

  it('no EAS build profile switches simulation on', () => {
    const eas = readFileSync(join(__dirname, '../eas.json'), 'utf8');
    expect(eas).not.toMatch(/ALLOW_SIMULATED_PURCHASES/);
  });

  it('the test-build line is shown only where purchases are simulated, and never on web', () => {
    const paywall = readFileSync(join(__dirname, '../src/app/paywall.tsx'), 'utf8');
    expect(paywall).toMatch(/purchasesAreSimulated\(\) && Platform\.OS !== 'web' \?/);
  });
});

describe('store keys in the build config', () => {
  it('any RevenueCat key in eas.json is a real public key, never a placeholder', () => {
    const eas = JSON.parse(readFileSync(join(__dirname, '../eas.json'), 'utf8'));
    for (const [name, profile] of Object.entries<{ env?: Record<string, string> }>(eas.build)) {
      for (const k of ['EXPO_PUBLIC_RC_IOS_KEY', 'EXPO_PUBLIC_RC_ANDROID_KEY']) {
        const v = profile.env?.[k];
        if (v === undefined) continue;
        const prefix = k.includes('IOS') ? 'appl_' : 'goog_';
        expect({ profile: name, key: k, ok: v.startsWith(prefix) && /^[a-z]+_[A-Za-z0-9]{16,}$/.test(v) && !/x{6,}/i.test(v) }).toEqual({ profile: name, key: k, ok: true });
      }
    }
  });
});
