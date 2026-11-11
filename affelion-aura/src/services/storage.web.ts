import type { PracticeRecord, ScanRecord, WindowMetrics } from '../core/types';
import { mapBiometricsToAura } from '../core/color/mapping';

/**
 * Web fallback for the storage service. The product is device-only; this exists so the screens
 * can be rendered in a browser for design review and screenshots. State lives in localStorage.
 * Setting `localStorage['aura.demo'] = '1'` seeds a few scans so every screen has content.
 */
const KEY = 'aura.web.store';

interface Store {
  scans: ScanRecord[];
  practices: PracticeRecord[];
  kv: Record<string, string>;
}

function load(): Store {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (raw) return JSON.parse(raw) as Store;
  } catch {
    // ignore
  }
  const store: Store = { scans: [], practices: [], kv: {} };
  try {
    if (globalThis.localStorage?.getItem('aura.demo') === '1') seed(store);
  } catch {
    // ignore
  }
  return store;
}

function save(store: Store) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

function seed(store: Store) {
  const mk = (i: number, bpm: number, rmssd: number, variance: number, stability: number): ScanRecord => {
    const heart = { bpm, rmssd, sdnn: rmssd * 1.1, pnn50: rmssd > 40 ? 28 : 6, beatCount: 44, quality: 0.88, durationSec: 40 };
    const voice = { dominantPitchHz: 172, variance, stability, pitchVarianceSemitones: variance * 4, energyVariance: variance * 0.8, spectralCentroidHz: 1300, voicedRatio: 0.6, quality: 0.8, durationSec: 5 };
    return { id: `demo_${i}`, createdAt: Date.now() - i * 86_400_000, heart, voice, aura: mapBiometricsToAura({ heart, voice }), portraitUri: null, stillUri: null };
  };
  store.scans = [mk(0, 66, 61, 0.42, 0.72), mk(1, 71, 52, 0.3, 0.66), mk(2, 74, 47, 0.35, 0.6), mk(3, 69, 44, 0.2, 0.7)];
  store.kv.onboardingDone = '1';
  try {
    if (globalThis.localStorage?.getItem('aura.pro') === '1') {
      store.kv['entitlement.dev'] = JSON.stringify({ isPro: true, plan: 'annual', expiresAt: null, source: 'dev' });
    }
  } catch {
    // ignore
  }
}

let store = load();

export function newScanId(): string {
  return `scan_${Date.now().toString(36)}`;
}
export async function saveScan(record: ScanRecord): Promise<void> {
  store.scans = [record, ...store.scans.filter((s) => s.id !== record.id)].sort((a, b) => b.createdAt - a.createdAt);
  save(store);
}
export async function updatePortraitUri(id: string, portraitUri: string): Promise<void> {
  store.scans = store.scans.map((s) => (s.id === id ? { ...s, portraitUri } : s));
  save(store);
}
export async function listScans(limit = 100): Promise<ScanRecord[]> {
  return store.scans.slice(0, limit);
}
export async function getScan(id: string): Promise<ScanRecord | null> {
  return store.scans.find((s) => s.id === id) ?? null;
}
export async function countScans(): Promise<number> {
  return store.scans.length;
}
export async function deleteScan(id: string): Promise<void> {
  store.scans = store.scans.filter((s) => s.id !== id);
  save(store);
}
export async function deleteAllScans(): Promise<void> {
  store.scans = [];
  store.practices = [];
  save(store);
}
export async function getSetting(key: string): Promise<string | null> {
  return store.kv[key] ?? null;
}
export async function setSetting(key: string, value: string): Promise<void> {
  store.kv[key] = value;
  save(store);
}
export async function clearSettings(): Promise<void> {
  store.kv = {};
  save(store);
}
export function newPracticeId(): string {
  return `practice_${Date.now().toString(36)}`;
}
export async function savePractice(record: PracticeRecord): Promise<void> {
  store.practices = [record, ...store.practices.filter((p) => p.id !== record.id)];
  save(store);
}
export async function listPractices(limit = 100): Promise<PracticeRecord[]> {
  return store.practices.slice(0, limit);
}
export async function updatePracticePortraits(id: string, before: string | null, after: string | null): Promise<void> {
  store.practices = store.practices.map((p) => (p.id === id ? { ...p, beforePortraitUri: before ?? p.beforePortraitUri, afterPortraitUri: after ?? p.afterPortraitUri } : p));
  save(store);
}
export function __resetWebStore() {
  store = load();
}
export type { WindowMetrics };
