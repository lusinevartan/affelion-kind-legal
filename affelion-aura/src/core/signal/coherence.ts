import { clamp01, mean, stddev } from '../math';
import { fft, hannWindow } from './fft';

/**
 * Real-time heart-rhythm coherence from beat times.
 *
 * "Coherence" here has a precise meaning: how much of the beat-to-beat variability over the
 * last half minute is concentrated at one slow rhythm (0.04–0.26 Hz, the range of slow
 * breathing). When a person breathes slowly and evenly, the heart rate rises and falls with each
 * breath (respiratory sinus arrhythmia) and the spectrum of the beat intervals shows a single
 * sharp peak; coherence is high. Irregular or shallow breathing, or tension, spreads that power
 * out; coherence is low. This is the same quantity used in HRV biofeedback research. It is a
 * description of the heart rhythm, nothing more.
 */

export interface CoherenceOptions {
  /** Seconds of beats to analyse. */
  windowSec?: number;
  /** Resampling rate for the interval series (Hz). */
  fs?: number;
  /** FFT length (power of two). */
  nfft?: number;
}

export interface CoherenceEstimate {
  /** 0..1 score; 1 means nearly all slow variability sits at one rhythm. */
  score: number;
  /** Raw peak-to-remainder power ratio. */
  ratio: number;
  /** Frequency of the dominant slow rhythm in Hz, or null when there is too little data. */
  peakHz: number | null;
  /** Peak-to-peak size of the slow heart-rate wave in ms (respiratory sinus arrhythmia). */
  rsaMs: number;
  /** Mean heart rate in the window, bpm. */
  bpm: number;
  /** RMSSD over the window, ms. */
  rmssd: number;
  /** Number of beats used. */
  beats: number;
  level: 'low' | 'medium' | 'high';
}

const LO_HZ = 0.04;
const HI_HZ = 0.26;
const TOTAL_LO_HZ = 0.0033;
const TOTAL_HI_HZ = 0.4;

export class CoherenceAnalyzer {
  private readonly windowSec: number;
  private readonly fs: number;
  private readonly nfft: number;
  private beats: number[] = [];

  constructor(opts: CoherenceOptions = {}) {
    this.windowSec = opts.windowSec ?? 32;
    this.fs = opts.fs ?? 4;
    this.nfft = opts.nfft ?? 256;
  }

  reset() {
    this.beats = [];
  }

  /** Add a beat time in seconds (monotonic). Out-of-order or duplicate beats are ignored. */
  pushBeat(t: number) {
    const last = this.beats[this.beats.length - 1];
    if (last !== undefined && t <= last) return;
    this.beats.push(t);
    const minT = t - this.windowSec - 2;
    while (this.beats.length && this.beats[0]! < minT) this.beats.shift();
  }

  /** Replace the beat buffer with a full list (used when a processor re-detects beats). */
  setBeats(times: readonly number[]) {
    this.beats = [];
    for (const t of times) this.pushBeat(t);
  }

  get beatCount() {
    return this.beats.length;
  }

  /** Uniformly resampled interval series over the window, in ms. */
  private tachogram(): { x: Float32Array; ibis: number[] } | null {
    const n = this.beats.length;
    if (n < 8) return null;
    const ibis: number[] = [];
    const times: number[] = [];
    for (let i = 1; i < n; i++) {
      const ibi = (this.beats[i]! - this.beats[i - 1]!) * 1000;
      if (ibi < 300 || ibi > 1500) continue;
      ibis.push(ibi);
      times.push(this.beats[i]!);
    }
    if (ibis.length < 6) return null;
    const t0 = Math.max(times[0]!, times[times.length - 1]! - this.windowSec);
    const t1 = times[times.length - 1]!;
    const len = Math.floor((t1 - t0) * this.fs);
    if (len < this.fs * 10) return null;
    const x = new Float32Array(len);
    let j = 0;
    for (let i = 0; i < len; i++) {
      const t = t0 + i / this.fs;
      while (j < times.length - 2 && times[j + 1]! < t) j++;
      const ta = times[j]!,
        tb = times[Math.min(times.length - 1, j + 1)]!;
      const span = tb - ta;
      const u = span > 1e-6 ? Math.min(1, Math.max(0, (t - ta) / span)) : 0;
      x[i] = ibis[j]! + (ibis[Math.min(ibis.length - 1, j + 1)]! - ibis[j]!) * u;
    }
    return { x, ibis };
  }

  estimate(): CoherenceEstimate | null {
    const tg = this.tachogram();
    if (!tg) return null;
    const { x, ibis } = tg;
    // Detrend (mean + slope) and window.
    const n = x.length;
    let sx = 0,
      sy = 0,
      sxx = 0,
      sxy = 0;
    for (let i = 0; i < n; i++) {
      sx += i;
      sy += x[i]!;
      sxx += i * i;
      sxy += i * x[i]!;
    }
    const denom = n * sxx - sx * sx;
    const slope = denom === 0 ? 0 : (n * sxy - sx * sy) / denom;
    const intercept = (sy - slope * sx) / n;
    const w = hannWindow(n);
    const re = new Float32Array(this.nfft);
    const im = new Float32Array(this.nfft);
    for (let i = 0; i < n && i < this.nfft; i++) re[i] = (x[i]! - intercept - slope * i) * w[i]!;
    fft(re, im);
    const df = this.fs / this.nfft;
    const power = (k: number) => re[k]! * re[k]! + im[k]! * im[k]!;
    const bin = (hz: number) => Math.round(hz / df);

    let peakBin = -1;
    let peakVal = -1;
    for (let k = bin(LO_HZ); k <= bin(HI_HZ); k++) {
      const p = power(k);
      if (p > peakVal) {
        peakVal = p;
        peakBin = k;
      }
    }
    let total = 0;
    for (let k = Math.max(1, bin(TOTAL_LO_HZ)); k <= bin(TOTAL_HI_HZ); k++) total += power(k);
    let peakPower = 0;
    for (let k = peakBin - 1; k <= peakBin + 1; k++) if (k >= 1) peakPower += power(k);
    const remainder = Math.max(1e-9, total - peakPower);
    const ratio = total > 0 ? peakPower / remainder : 0;
    const score = clamp01(ratio / 4);

    // RSA: peak-to-peak of the slow component, estimated from the detrended series' range
    // after light smoothing (3-sample moving average).
    let mn = Infinity,
      mx = -Infinity;
    for (let i = 1; i < n - 1; i++) {
      const v = (x[i - 1]! + x[i]! + x[i + 1]!) / 3 - intercept - slope * i;
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    const rsaMs = Number.isFinite(mx - mn) ? mx - mn : 0;

    const diffs: number[] = [];
    for (let i = 1; i < ibis.length; i++) diffs.push(ibis[i]! - ibis[i - 1]!);
    const rmssd = diffs.length ? Math.sqrt(mean(diffs.map((d) => d * d))) : 0;
    const bpm = 60000 / mean(ibis);
    const level: CoherenceEstimate['level'] = score < 0.35 ? 'low' : score < 0.7 ? 'medium' : 'high';
    return { score, ratio, peakHz: peakBin > 0 ? peakBin * df : null, rsaMs, bpm, rmssd, beats: ibis.length + 1, level };
  }

  /**
   * How well the heart rhythm follows a breathing pacer at `pacerHz`: 1 when the dominant slow
   * rhythm sits on the pacer frequency, falling off with distance.
   */
  static breathingSync(estimate: CoherenceEstimate | null, pacerHz: number): number {
    if (!estimate || estimate.peakHz === null) return 0;
    const d = Math.abs(estimate.peakHz - pacerHz);
    return clamp01(1 - d / 0.035) * clamp01(estimate.score + 0.3);
  }
}

/**
 * Resonance-rate finder. Slow breathing produces the largest heart-rate wave at a rate that
 * differs slightly between people (roughly 4.5–7 breaths per minute). Each candidate rate is
 * breathed for a segment; the rate with the largest RSA wins, with coherence breaking ties.
 */
export interface ResonanceCandidate {
  breathsPerMinute: number;
  rsaMs: number;
  coherence: number;
}

export function pickResonanceRate(candidates: readonly ResonanceCandidate[]): ResonanceCandidate | null {
  if (!candidates.length) return null;
  const sorted = [...candidates].sort((a, b) => b.rsaMs - a.rsaMs || b.coherence - a.coherence);
  return sorted[0]!;
}

/** Convenience: standard deviation of a window's coherence scores, for reporting steadiness. */
export function steadiness(scores: readonly number[]): number {
  if (scores.length < 2) return 0;
  return clamp01(1 - stddev(scores) / 0.5);
}
