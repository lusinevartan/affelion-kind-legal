import type { HeartMetrics } from '../types';
import { clamp01, mean, median, stddev } from '../math';
import { bandpassZeroPhase, detrend } from './filters';

/**
 * Rear-camera photoplethysmography.
 *
 * The native module delivers one sample per camera frame: the mean red/green/blue of a
 * centre region while the torch is on and a fingertip covers the lens. Blood volume in the
 * fingertip rises with each heartbeat and absorbs more light, so the mean red value dips
 * once per beat. We resample to a uniform rate, band-pass between 0.7 and 3.5 Hz
 * (42–210 bpm), detect beats with an adaptive threshold, time each beat at its upstroke, reject
 * artefacts, and compute heart rate and HRV from the surviving intervals. Every stretch of
 * continuous coverage is processed on its own, so lifting the finger never invents a beat.
 */

export interface PpgSample {
  /** Seconds, monotonic (any origin). */
  t: number;
  /** Mean channel values normalised 0..1. */
  r: number;
  g: number;
  b: number;
}

export interface CoverageEstimate {
  covered: boolean;
  /** 0..1 confidence that a fingertip is over the lens with the torch on. */
  confidence: number;
  reason: 'ok' | 'noFinger' | 'tooDark' | 'saturated' | 'notRed';
}

/**
 * A finger over a torch-lit lens yields a frame dominated by red: red is high, green and
 * blue are far lower, and the frame is neither black nor blown out.
 */
export function estimateCoverage(s: PpgSample): CoverageEstimate {
  const { r, g, b } = s;
  if (r < 0.12) return { covered: false, confidence: 0, reason: 'tooDark' };
  if (r > 0.985 && g > 0.9) return { covered: false, confidence: 0.1, reason: 'saturated' };
  const redDominance = r / Math.max(0.02, (g + b) / 2);
  if (redDominance < 1.5) return { covered: false, confidence: clamp01((redDominance - 1) / 1.5), reason: 'notRed' };
  // Natural scenes rarely exceed dominance 2.5 with g,b both low.
  const conf = clamp01((redDominance - 1.5) / 2.0) * clamp01((0.9 - Math.max(g, b)) / 0.5);
  if (conf < 0.35) return { covered: false, confidence: conf, reason: 'noFinger' };
  return { covered: true, confidence: conf, reason: 'ok' };
}

export interface PpgLiveState {
  /** Seconds of covered signal accumulated so far. */
  coveredSec: number;
  /** Current coverage estimate. */
  coverage: CoverageEstimate;
  /** Latest BPM estimate or null until enough beats are present. */
  bpm: number | null;
  /** Latest signal quality estimate 0..1. */
  quality: number;
  /** Normalised waveform (last ~4 s) for the UI, values roughly −1..1. */
  waveform: Float32Array;
  /** Time of the last detected beat (seconds, sample clock) for haptics / pulse UI. */
  lastBeatAt: number | null;
  /** Detected beat times (seconds, sample clock) in the current window, for coherence analysis. */
  beats: number[];
}

export interface PpgProcessorOptions {
  /** Uniform resampling rate (Hz). Camera delivers ~30 fps. */
  fs?: number;
  /** Seconds of history to keep. */
  windowSec?: number;
  /** Lowest/highest heart rates considered, in bpm. */
  minBpm?: number;
  maxBpm?: number;
}

interface Beat {
  t: number;
  amp: number;
}

/** One accepted beat-to-beat interval. */
interface Interval {
  ms: number;
  /** Time of the beat that closes the interval (seconds, sample clock). */
  t: number;
  /** True when the interval immediately before it was also accepted, so their difference is real. */
  adjacent: boolean;
}

interface Prepared {
  x: Float32Array;
  t0: number;
}

interface Analysis {
  intervals: Interval[];
  /** Raw interval count before rejection, across all segments. */
  total: number;
  beats: number[];
  /** Filtered signal of the most recent segment, for the waveform. */
  latest: Prepared | null;
  snr: number;
  /** Seconds of usable signal analysed. */
  durationSec: number;
}

/** A break in coverage longer than this starts a new segment instead of being interpolated. */
const SEGMENT_GAP_SEC = 0.5;

export class PpgProcessor {
  readonly fs: number;
  private readonly windowSec: number;
  private readonly minBpm: number;
  private readonly maxBpm: number;

  /**
   * Covered samples, split wherever the finger left the lens. Each segment is filtered and
   * searched for beats on its own, so a lift never becomes a ramp in the signal, a beat that
   * did not happen, or a difference between two intervals that were not neighbours.
   */
  private segments: PpgSample[][] = [];
  private coveredSec = 0;
  private lastSampleT: number | null = null;
  private coverage: CoverageEstimate = { covered: false, confidence: 0, reason: 'noFinger' };

  constructor(opts: PpgProcessorOptions = {}) {
    this.fs = opts.fs ?? 30;
    this.windowSec = opts.windowSec ?? 75;
    this.minBpm = opts.minBpm ?? 42;
    this.maxBpm = opts.maxBpm ?? 200;
  }

  reset() {
    this.segments = [];
    this.coveredSec = 0;
    this.lastSampleT = null;
    this.coverage = { covered: false, confidence: 0, reason: 'noFinger' };
  }

  /** Feed one camera frame. Returns the coverage estimate for immediate UI feedback. */
  push(sample: PpgSample): CoverageEstimate {
    this.coverage = estimateCoverage(sample);
    const dt = this.lastSampleT === null ? 0 : Math.min(0.2, Math.max(0, sample.t - this.lastSampleT));
    this.lastSampleT = sample.t;
    if (this.coverage.covered) {
      this.coveredSec += dt;
      const seg = this.segments[this.segments.length - 1];
      const last = seg?.[seg.length - 1];
      if (!seg || !last || sample.t - last.t > SEGMENT_GAP_SEC || sample.t < last.t) this.segments.push([sample]);
      else seg.push(sample);
    }
    const minT = sample.t - this.windowSec;
    while (this.segments.length) {
      const first = this.segments[0]!;
      while (first.length && first[0]!.t < minT) first.shift();
      if (first.length) break;
      this.segments.shift();
    }
    return this.coverage;
  }

  get coveredSeconds() {
    return this.coveredSec;
  }

  /** Uniformly resampled, inverted red channel (so a beat is a peak), band-passed. */
  private prepare(raw: PpgSample[]): Prepared | null {
    const n = raw.length;
    if (n < this.fs * 4) return null;
    const t0 = raw[0]!.t;
    const t1 = raw[n - 1]!.t;
    const len = Math.floor((t1 - t0) * this.fs);
    if (len < this.fs * 4) return null;
    const x = new Float32Array(len);
    let j = 0;
    for (let i = 0; i < len; i++) {
      const t = t0 + i / this.fs;
      while (j < n - 2 && raw[j + 1]!.t < t) j++;
      const a = raw[j]!;
      const b = raw[Math.min(n - 1, j + 1)]!;
      const span = b.t - a.t;
      const u = span > 1e-6 ? Math.min(1, Math.max(0, (t - a.t) / span)) : 0;
      x[i] = -(a.r + (b.r - a.r) * u);
    }
    detrend(x);
    const filtered = bandpassZeroPhase(x, this.fs, this.minBpm / 60, this.maxBpm / 60);
    // Discard the filter transient at both ends (1.5 s) so boundary artefacts never become beats.
    const trim = Math.round(1.5 * this.fs);
    if (filtered.length <= trim * 2 + this.fs) return null;
    const y = filtered.slice(trim, filtered.length - trim);
    // Normalise by robust amplitude.
    const absMed = median(Array.from(y, Math.abs)) || 1e-6;
    for (let i = 0; i < y.length; i++) y[i] = y[i]! / (absMed * 2.5);
    return { x: y, t0: t0 + trim / this.fs };
  }

  private detectBeats(y: Float32Array, t0: number): Beat[] {
    const refractory = Math.round((60 / this.maxBpm) * this.fs);
    const beats: Beat[] = [];
    const recent: number[] = [];
    let lastIdx = -Infinity;
    for (let i = 1; i < y.length - 1; i++) {
      const v = y[i]!;
      if (v <= y[i - 1]! || v < y[i + 1]!) continue; // local max
      if (v <= 0) continue;
      const thresh = recent.length >= 3 ? 0.45 * median(recent) : 0.3;
      if (v < thresh) continue;
      if (i - lastIdx < refractory) {
        // Keep the larger of two close peaks.
        const prev = beats[beats.length - 1];
        if (prev && v > prev.amp) {
          beats.pop();
        } else continue;
      }
      beats.push({ t: t0 + this.upstrokeTime(y, i) / this.fs, amp: v });
      recent.push(v);
      if (recent.length > 8) recent.shift();
      lastIdx = i;
    }
    return beats;
  }

  /**
   * Beat timing from the upstroke zero-crossing preceding a peak, linearly interpolated.
   * The upstroke is the steepest part of the pulse wave, so its crossing time is far less
   * sensitive to noise and to the 30 Hz frame grid than the flat peak itself.
   */
  private upstrokeTime(y: Float32Array, peakIdx: number): number {
    let k = peakIdx;
    const minK = Math.max(1, peakIdx - Math.round(this.fs * 0.5));
    while (k > minK && y[k - 1]! > 0) k--;
    if (k <= minK || y[k - 1]! > 0) {
      // No crossing found; fall back to parabolic peak refinement.
      const ym = y[peakIdx - 1]!,
        v = y[peakIdx]!,
        yp = y[peakIdx + 1]!;
      const denom = ym - 2 * v + yp;
      return peakIdx + (denom !== 0 ? (0.5 * (ym - yp)) / denom : 0);
    }
    const a = y[k - 1]!; // <= 0
    const b = y[k]!; // > 0
    const frac = b - a !== 0 ? -a / (b - a) : 0;
    return k - 1 + frac;
  }

  /**
   * Intervals between consecutive beats of one segment, with implausible ones and those more
   * than 20 % from the local median removed. Each survivor records whether the interval just
   * before it also survived, because variability is only defined between true neighbours.
   */
  private intervals(beats: Beat[]): { accepted: Interval[]; total: number } {
    const lo = (60 / this.maxBpm) * 1000;
    const hi = (60 / this.minBpm) * 1000;
    const plausible: { ms: number; t: number; idx: number }[] = [];
    for (let i = 1; i < beats.length; i++) {
      const ms = (beats[i]!.t - beats[i - 1]!.t) * 1000;
      if (ms >= lo && ms <= hi) plausible.push({ ms, t: beats[i]!.t, idx: i });
    }
    const total = Math.max(0, beats.length - 1);
    let kept = plausible;
    if (plausible.length >= 3) {
      const med = median(plausible.map((p) => p.ms));
      kept = plausible.filter((p, i) => {
        const local = plausible.slice(Math.max(0, i - 4), Math.min(plausible.length, i + 5)).map((q) => q.ms);
        const ref = local.length >= 3 ? median(local) : med;
        return Math.abs(p.ms - ref) / ref <= 0.2;
      });
    }
    const accepted = kept.map((p, k) => ({ ms: p.ms, t: p.t, adjacent: k > 0 && kept[k - 1]!.idx === p.idx - 1 }));
    return { accepted, total };
  }

  private snr(y: Float32Array): number {
    // Ratio of the autocorrelation peak within the heart band to lag-0 energy.
    const n = y.length;
    let e0 = 0;
    for (let i = 0; i < n; i++) e0 += y[i]! * y[i]!;
    if (e0 === 0) return 0;
    const minLag = Math.round((60 / this.maxBpm) * this.fs);
    const maxLag = Math.round((60 / this.minBpm) * this.fs);
    let best = 0;
    for (let lag = minLag; lag <= maxLag && lag < n / 2; lag++) {
      let s = 0;
      for (let i = 0; i + lag < n; i++) s += y[i]! * y[i + lag]!;
      s /= e0;
      if (s > best) best = s;
    }
    return clamp01(best);
  }

  /** Filter, find beats and collect intervals for every segment long enough to use. */
  private analyse(): Analysis {
    const intervals: Interval[] = [];
    const beats: number[] = [];
    let total = 0;
    let samples = 0;
    let snrSum = 0;
    let latest: Prepared | null = null;
    const lastSegment = this.segments[this.segments.length - 1];
    for (const seg of this.segments) {
      const prepared = this.prepare(seg);
      if (!prepared) continue;
      const found = this.detectBeats(prepared.x, prepared.t0);
      const r = this.intervals(found);
      intervals.push(...r.accepted);
      total += r.total;
      for (const b of found) beats.push(b.t);
      samples += prepared.x.length;
      snrSum += this.snr(prepared.x) * prepared.x.length;
      if (seg === lastSegment) latest = prepared;
    }
    return { intervals, total, beats, latest, snr: samples ? snrSum / samples : 0, durationSec: samples / this.fs };
  }

  /** Current live state for the scan UI. Cheap enough to call a few times per second. */
  live(): PpgLiveState {
    const a = this.analyse();
    const waveLen = this.fs * 4;
    const waveform = a.latest ? a.latest.x.slice(Math.max(0, a.latest.x.length - waveLen)) : new Float32Array(0);
    let bpm: number | null = null;
    let quality = 0;
    if (a.intervals.length >= 4) {
      bpm = 60000 / mean(a.intervals.map((i) => i.ms));
      const acceptRatio = a.total ? a.intervals.length / a.total : 0;
      quality = clamp01(0.5 * acceptRatio + 0.5 * a.snr) * clamp01(this.coverage.confidence + 0.4);
    }
    const lastBeatAt = a.beats.length ? a.beats[a.beats.length - 1]! : null;
    return { coveredSec: this.coveredSec, coverage: this.coverage, bpm, quality, waveform, lastBeatAt, beats: a.beats };
  }

  /** Final metrics over the whole buffered window. Returns null if the window is unusable. */
  finish(): HeartMetrics | null {
    const a = this.analyse();
    if (a.intervals.length < 8) return null;
    const ms = a.intervals.map((i) => i.ms);
    const bpm = 60000 / mean(ms);
    const rmssd = rmssdOf(a.intervals);
    const diffs = neighbourDiffs(a.intervals);
    const sdnn = stddev(ms);
    const pnn50 = diffs.length ? (100 * diffs.filter((d) => Math.abs(d) > 50).length) / diffs.length : 0;
    const acceptRatio = a.total ? a.intervals.length / a.total : 0;
    const quality = clamp01(0.45 * acceptRatio + 0.35 * a.snr + 0.2 * clamp01(a.durationSec / 40));
    return { bpm, rmssd, sdnn, pnn50, beatCount: a.intervals.length + 1, quality, durationSec: a.durationSec, recovery: recoveryOf(a.intervals) };
  }
}

/** Differences between intervals that were true neighbours. */
function neighbourDiffs(intervals: readonly Interval[]): number[] {
  const diffs: number[] = [];
  for (let i = 1; i < intervals.length; i++) if (intervals[i]!.adjacent) diffs.push(intervals[i]!.ms - intervals[i - 1]!.ms);
  return diffs;
}

function rmssdOf(intervals: readonly Interval[]): number {
  const diffs = neighbourDiffs(intervals);
  return diffs.length ? Math.sqrt(mean(diffs.map((d) => d * d))) : 0;
}

/**
 * Recovery within one reading, 0..1: how clearly the pulse slowed and the variability rose from
 * the first half of the reading to the second. Zero unless the direction is unambiguous: the
 * pulse fell by at least 3 bpm without variability falling, or variability rose by at least a
 * fifth without the pulse rising. This is the knowledge base's "improving HRV or recovering
 * from activation", measured inside the scan itself.
 */
export function recoveryOf(intervals: readonly { ms: number; t: number; adjacent: boolean }[]): number {
  if (intervals.length < 16) return 0;
  const mid = (intervals[0]!.t + intervals[intervals.length - 1]!.t) / 2;
  const first = intervals.filter((i) => i.t <= mid);
  const second = intervals.filter((i) => i.t > mid).map((i, k) => (k === 0 ? { ...i, adjacent: false } : i));
  if (first.length < 6 || second.length < 6) return 0;
  const bpm1 = 60000 / mean(first.map((i) => i.ms));
  const bpm2 = 60000 / mean(second.map((i) => i.ms));
  const hrv1 = rmssdOf(first);
  const hrv2 = rmssdOf(second);
  return recoveryFromChange(bpm1, bpm2, hrv1, hrv2);
}

/** The same recovery score from any earlier and later pair of pulse and variability readings. */
export function recoveryFromChange(bpmBefore: number, bpmAfter: number, hrvBefore: number, hrvAfter: number): number {
  const pulseDrop = bpmBefore - bpmAfter;
  const hrvGain = hrvAfter / Math.max(1, hrvBefore) - 1;
  const recovering = (pulseDrop >= 3 && hrvGain >= 0) || (hrvGain >= 0.2 && pulseDrop >= 0);
  if (!recovering) return 0;
  return clamp01(0.5 * clamp01(pulseDrop / 8) + 0.5 * clamp01(hrvGain / 0.6));
}
