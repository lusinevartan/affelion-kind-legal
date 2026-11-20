import * as React from 'react';

/**
 * A small live record of what the scan and practice sessions measured, for the TestFlight debug
 * screen. Only written when the debug panel is enabled. Nothing here is saved or sent anywhere.
 */
export interface DebugSnapshot {
  source: 'scan' | 'practice' | null;
  updatedAt: number | null;
  phase: string | null;
  guidance: string | null;
  failure: string | null;
  pulse: {
    liveQuality: number | null;
    bpm: number | null;
    beats: number | null;
    coverage: string | null;
    coverageConfidence: number | null;
    coveredSec: number | null;
  };
  final: { bpm: number; quality: number; beatCount: number; durationSec: number; rmssd: number } | null;
  gate: { ok: boolean; reason: string } | null;
  voice: {
    level: number | null;
    voicedSec: number | null;
    pitchHz: number | null;
    finalQuality: number | null;
    skipped: boolean;
  };
}

export const EMPTY_SNAPSHOT: DebugSnapshot = {
  source: null,
  updatedAt: null,
  phase: null,
  guidance: null,
  failure: null,
  pulse: { liveQuality: null, bpm: null, beats: null, coverage: null, coverageConfidence: null, coveredSec: null },
  final: null,
  gate: null,
  voice: { level: null, voicedSec: null, pitchHz: null, finalQuality: null, skipped: false },
};

let snapshot: DebugSnapshot = EMPTY_SNAPSHOT;
const listeners = new Set<() => void>();

type Patch = Partial<Omit<DebugSnapshot, 'pulse' | 'voice'>> & { pulse?: Partial<DebugSnapshot['pulse']>; voice?: Partial<DebugSnapshot['voice']> };

export function updateDebug(patch: Patch): void {
  snapshot = {
    ...snapshot,
    ...patch,
    pulse: { ...snapshot.pulse, ...(patch.pulse ?? {}) },
    voice: { ...snapshot.voice, ...(patch.voice ?? {}) },
    updatedAt: Date.now(),
  };
  listeners.forEach((l) => l());
}

/** A new scan or practice starts with a clean record. */
export function resetDebug(source: DebugSnapshot['source']): void {
  snapshot = { ...EMPTY_SNAPSHOT, source, updatedAt: Date.now() };
  listeners.forEach((l) => l());
}

export function getDebugSnapshot(): DebugSnapshot {
  return snapshot;
}

export function useDebugSnapshot(): DebugSnapshot {
  return React.useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getDebugSnapshot,
    getDebugSnapshot,
  );
}

const n = (v: number | null | undefined, digits = 0) => (v == null || !Number.isFinite(v) ? 'n/a' : v.toFixed(digits));
const pct = (v: number | null | undefined) => (v == null || !Number.isFinite(v) ? 'n/a' : `${Math.round(v * 100)}%`);

/** The plain-text report Lusine pastes into a message to Claude. */
export function buildDebugReport(s: DebugSnapshot, meta: { appVersion: string; build: string; device: string; os: string }): string {
  return [
    'Affelion Halo debug report',
    `App ${meta.appVersion} (build ${meta.build}) · ${meta.device} · ${meta.os}`,
    `Source: ${s.source ?? 'none yet'} · updated ${s.updatedAt ? new Date(s.updatedAt).toISOString() : 'never'}`,
    `Phase: ${s.phase ?? 'n/a'} · guidance: ${s.guidance ?? 'n/a'}`,
    `Last failure: ${s.failure ?? 'none'}`,
    '',
    'PULSE (live)',
    `Signal quality: ${pct(s.pulse.liveQuality)} · BPM: ${n(s.pulse.bpm)} · beats accepted: ${n(s.pulse.beats)}`,
    `Coverage: ${s.pulse.coverage ?? 'n/a'} (confidence ${pct(s.pulse.coverageConfidence)}) · finger covered: ${n(s.pulse.coveredSec, 1)} s`,
    '',
    'PULSE (final)',
    s.final
      ? `BPM: ${n(s.final.bpm)} · quality: ${pct(s.final.quality)} · beats: ${s.final.beatCount} · duration: ${n(s.final.durationSec, 1)} s · variation (RMSSD): ${n(s.final.rmssd)} ms`
      : 'No final reading (too few beats, or not finished)',
    `Reading gate: ${s.gate ? `${s.gate.ok ? 'PASS' : 'RETRY'} (${s.gate.reason})` : 'not checked yet'}`,
    '',
    'VOICE',
    s.voice.skipped
      ? 'Skipped'
      : `Level: ${pct(s.voice.level)} · voiced: ${n(s.voice.voicedSec, 1)} s · pitch: ${n(s.voice.pitchHz)} Hz · final quality: ${pct(s.voice.finalQuality)}`,
  ].join('\n');
}
