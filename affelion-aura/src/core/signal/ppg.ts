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
 * (42–210 bpm), detect beats with an adaptive threshold, refine their timing with parabolic
 * interpolation, reject artefacts, and compute heart rate and HRV from the surviving intervals.
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

export class PpgProcessor {
  readonly fs: number;
  private readonly windowSec: number;
  private readonly minBpm: number;
  private readonly maxBpm: number;

  private raw: PpgSample[] = [];
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
    this.raw = [];
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
      this.raw.push(sample);
    } else {
      // A gap breaks the continuous window. Keep only data after the last long gap.
      if (dt > 0.1 && this.raw.length) {
        const last = this.raw[this.raw.length - 1]!;
        if (sample.t - last.t > 1.0) this.raw = [];
      }
    }
    const minT = sample.t - this.windowSec;
    while (this.raw.length && this.raw[0]!.t < minT) this.raw.shift();
    return this.coverage;
  }

  get coveredSeconds() {
    return this.coveredSec;
  }

  /** Uniformly resampled, inverted red channel (so a beat is a peak), band-passed. */
  private preparedSignal(): { x: Float32Array; t0: number } | null {
    const n = this.raw.length;
    if (n < this.fs * 4) return null;
    const t0 = this.raw[0]!.t;
    const t1 = this.raw[n - 1]!.t;
    const len = Math.floor((t1 - t0) * this.fs);
    if (len < this.fs * 4) return null;
    const x = new Float32Array(len);
    let j = 0;
    for (let i = 0; i < len; i++) {
      const t = t0 + i / this.fs;
      while (j < n - 2 && this.raw[j + 1]!.t < t) j++;
      const a = this.raw[j]!;
      const b = this.raw[Math.min(n - 1, j + 1)]!;
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

  private intervals(beats: Beat[]): { accepted: number[]; total: number } {
    const ibis: number[] = [];
    for (let i = 1; i < beats.length; i++) ibis.push((beats[i]!.t - beats[i - 1]!.t) * 1000);
    const lo = (60 / this.maxBpm) * 1000;
    const hi = (60 / this.minBpm) * 1000;
    const plausible = ibis.filter((v) => v >= lo && v <= hi);
    if (plausible.length < 3) return { accepted: plausible, total: ibis.length };
    // Reject intervals deviating more than 25 % from a running median of neighbours.
    const med = median(plausible);
    const accepted: number[] = [];
    for (let i = 0; i < plausible.length; i++) {
      const local = plausible.slice(Math.max(0, i - 4), Math.min(plausible.length, i + 5));
      const ref = local.length >= 3 ? median(local) : med;
      if (Math.abs(plausible[i]! - ref) / ref <= 0.2) accepted.push(plausible[i]!);
    }
    return { accepted, total: ibis.length };
  }

  private snr(y: Float32Array): number {
    // Band power vs total using a crude periodogram over the dominant lag.
    // Cheaper proxy: ratio of autocorrelation peak within the heart band to lag-0 energy.
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

  /** Current live state for the scan UI. Cheap enough to call a few times per second. */
  live(): PpgLiveState {
    const prepared = this.preparedSignal();
    const waveLen = this.fs * 4;
    let waveform = new Float32Array(0);
    let bpm: number | null = null;
    let quality = 0;
    let lastBeatAt: number | null = null;
    if (prepared) {
      const { x, t0 } = prepared;
      waveform = x.slice(Math.max(0, x.length - waveLen));
      const beats = this.detectBeats(x, t0);
      const { accepted, total } = this.intervals(beats);
      if (accepted.length >= 4) {
        bpm = 60000 / mean(accepted);
        const acceptRatio = total ? accepted.length / total : 0;
        quality = clamp01(0.5 * acceptRatio + 0.5 * this.snr(x)) * clamp01(this.coverage.confidence + 0.4);
      }
      const lastBeat = beats[beats.length - 1];
      if (lastBeat) lastBeatAt = lastBeat.t;
    }
    return { coveredSec: this.coveredSec, coverage: this.coverage, bpm, quality, waveform, lastBeatAt };
  }

  /** Final metrics over the whole buffered window. Returns null if the window is unusable. */
  finish(): HeartMetrics | null {
    const prepared = this.preparedSignal();
    if (!prepared) return null;
    const { x, t0 } = prepared;
    const beats = this.detectBeats(x, t0);
    const { accepted, total } = this.intervals(beats);
    if (accepted.length < 8) return null;
    const bpm = 60000 / mean(accepted);
    const diffs: number[] = [];
    for (let i = 1; i < accepted.length; i++) diffs.push(accepted[i]! - accepted[i - 1]!);
    const rmssd = diffs.length ? Math.sqrt(mean(diffs.map((d) => d * d))) : 0;
    const sdnn = stddev(accepted);
    const pnn50 = diffs.length ? (100 * diffs.filter((d) => Math.abs(d) > 50).length) / diffs.length : 0;
    const durationSec = x.length / this.fs;
    const acceptRatio = total ? accepted.length / total : 0;
    const quality = clamp01(0.45 * acceptRatio + 0.35 * this.snr(x) + 0.2 * clamp01(durationSec / 40));
    return { bpm, rmssd, sdnn, pnn50, beatCount: accepted.length + 1, quality, durationSec };
  }
}
