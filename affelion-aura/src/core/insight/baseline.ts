import type { AuraColorId } from '../color/knowledgeBase';
import type { ScanRecord } from '../types';
import { median } from '../math';

/**
 * Personal baseline and trend. Population norms are not the point of this app; the only
 * comparison that helps someone understand themselves is to their own recent readings.
 * Baseline = median of the last `BASELINE_SCANS` scans (needs at least `MIN_SCANS`).
 */
export const BASELINE_SCANS = 7;
export const MIN_SCANS = 3;

export interface Baseline {
  bpm: number;
  rmssd: number;
  scans: number;
}

export type Trend = 'improving' | 'steady' | 'declining';

export interface ScanInsight {
  baseline: Baseline | null;
  /** Difference of this scan from baseline, as a fraction (0.12 = 12% above). */
  bpmDelta: number | null;
  rmssdDelta: number | null;
  /** HRV trend across the baseline window. */
  trend: Trend | null;
  /** Knowledge-base colour used to present the trend (display only, never the portrait). */
  trendColorId: AuraColorId | null;
  /** One grounded sentence. */
  sentence: string;
}

export function computeBaseline(history: readonly ScanRecord[], excludeId?: string): Baseline | null {
  const scans = history.filter((s) => s.id !== excludeId).slice(0, BASELINE_SCANS);
  if (scans.length < MIN_SCANS) return null;
  return { bpm: median(scans.map((s) => s.heart.bpm)), rmssd: median(scans.map((s) => s.heart.rmssd)), scans: scans.length };
}

/** Robust slope sign over the window using a Theil–Sen style median of pairwise slopes. */
export function hrvTrend(history: readonly ScanRecord[]): Trend | null {
  const scans = history.slice(0, BASELINE_SCANS).reverse(); // oldest first
  if (scans.length < MIN_SCANS) return null;
  const slopes: number[] = [];
  for (let i = 0; i < scans.length; i++) {
    for (let j = i + 1; j < scans.length; j++) {
      slopes.push((scans[j]!.heart.rmssd - scans[i]!.heart.rmssd) / (j - i));
    }
  }
  const slope = median(slopes);
  const ref = Math.max(5, median(scans.map((s) => s.heart.rmssd)));
  const rel = slope / ref; // per-scan change relative to typical HRV
  if (rel > 0.04) return 'improving';
  if (rel < -0.04) return 'declining';
  return 'steady';
}

const r0 = (n: number) => Math.round(n).toString();
const pct = (f: number) => `${Math.round(Math.abs(f) * 100)}%`;

export function scanInsight(scan: ScanRecord, history: readonly ScanRecord[]): ScanInsight {
  const baseline = computeBaseline(history, scan.id);
  const trend = hrvTrend(history);
  if (!baseline) {
    const left = Math.max(0, MIN_SCANS - history.length);
    return {
      baseline: null,
      bpmDelta: null,
      rmssdDelta: null,
      trend: null,
      trendColorId: null,
      sentence: left > 0 ? `Your personal baseline appears after ${left} more scan${left === 1 ? '' : 's'}.` : 'Your personal baseline is being established.',
    };
  }
  const bpmDelta = (scan.heart.bpm - baseline.bpm) / baseline.bpm;
  const rmssdDelta = (scan.heart.rmssd - baseline.rmssd) / Math.max(1, baseline.rmssd);
  // Lime: "improving HRV or recovering from activation"; emerald: "solid HRV with calm-to-moderate BPM";
  // earth brown: "moderate-low BPM with reduced HRV". Display colours only.
  const trendColorId: AuraColorId | null = trend === 'improving' ? 'lime' : trend === 'steady' ? 'emerald' : trend === 'declining' ? 'earth_brown' : null;
  const hrvWord = rmssdDelta > 0.08 ? `${pct(rmssdDelta)} above` : rmssdDelta < -0.08 ? `${pct(rmssdDelta)} below` : 'close to';
  const bpmWord = bpmDelta > 0.05 ? `${pct(bpmDelta)} faster than` : bpmDelta < -0.05 ? `${pct(bpmDelta)} slower than` : 'about the same as';
  const trendWord = trend === 'improving' ? 'Across your last scans, HRV is trending up.' : trend === 'declining' ? 'Across your last scans, HRV is trending down.' : 'Across your last scans, HRV has been steady.';
  const sentence = `HRV ${r0(scan.heart.rmssd)} ms is ${hrvWord} your baseline of ${r0(baseline.rmssd)} ms, and your pulse was ${bpmWord} usual (${r0(baseline.bpm)} bpm). ${trendWord}`;
  return { baseline, bpmDelta, rmssdDelta, trend, trendColorId, sentence };
}
