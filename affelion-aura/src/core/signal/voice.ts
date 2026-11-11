import type { VoiceMetrics } from '../types';
import { clamp01, mean, median, stddev } from '../math';
import { hannWindow, magnitudeSpectrum, spectralCentroid } from './fft';
import { yinPitch } from './pitch';

/**
 * Short vocal analysis (4–6 seconds). Frames of 1024 samples at 16 kHz (64 ms) with a
 * 512-sample hop. For each frame above the noise floor we estimate pitch (YIN) and the
 * spectral centroid. Aggregates describe how varied the voice was, not what was said.
 * Nothing is transcribed, stored or uploaded.
 */
export interface VoiceAnalyzerOptions {
  sampleRate?: number;
  frameSize?: number;
  hopSize?: number;
  /** RMS below which a frame is treated as silence. */
  silenceRms?: number;
}

export interface VoiceLiveState {
  /** Latest frame RMS 0..1 for the level meter. */
  level: number;
  /** Latest pitch (Hz) or null. */
  pitchHz: number | null;
  /** Seconds of voiced audio so far. */
  voicedSec: number;
  /** Seconds analysed so far. */
  durationSec: number;
  /** True if the input appears to be clipping. */
  clipping: boolean;
}

export class VoiceAnalyzer {
  readonly sampleRate: number;
  readonly frameSize: number;
  readonly hopSize: number;
  private readonly silenceRms: number;
  private readonly window: Float32Array;

  private pending = new Float32Array(0);
  private totalSamples = 0;
  private pitches: number[] = [];
  private energies: number[] = [];
  private centroids: number[] = [];
  private frameCount = 0;
  private clipCount = 0;
  private lastLevel = 0;
  private lastPitch: number | null = null;

  constructor(opts: VoiceAnalyzerOptions = {}) {
    this.sampleRate = opts.sampleRate ?? 16000;
    this.frameSize = opts.frameSize ?? 1024;
    this.hopSize = opts.hopSize ?? 512;
    this.silenceRms = opts.silenceRms ?? 0.012;
    this.window = hannWindow(this.frameSize);
  }

  reset() {
    this.pending = new Float32Array(0);
    this.totalSamples = 0;
    this.pitches = [];
    this.energies = [];
    this.centroids = [];
    this.frameCount = 0;
    this.clipCount = 0;
    this.lastLevel = 0;
    this.lastPitch = null;
  }

  /** Feed mono float PCM in −1..1. */
  push(pcm: Float32Array) {
    this.totalSamples += pcm.length;
    const merged = new Float32Array(this.pending.length + pcm.length);
    merged.set(this.pending, 0);
    merged.set(pcm, this.pending.length);
    let offset = 0;
    while (offset + this.frameSize <= merged.length) {
      this.analyseFrame(merged.subarray(offset, offset + this.frameSize));
      offset += this.hopSize;
    }
    this.pending = merged.slice(offset);
  }

  private analyseFrame(frame: Float32Array) {
    this.frameCount++;
    let sum = 0;
    let clipped = 0;
    for (let i = 0; i < frame.length; i++) {
      const v = frame[i]!;
      sum += v * v;
      if (Math.abs(v) > 0.985) clipped++;
    }
    const rms = Math.sqrt(sum / frame.length);
    this.lastLevel = clamp01(rms * 4);
    if (clipped > frame.length * 0.01) this.clipCount++;
    if (rms < this.silenceRms) {
      this.lastPitch = null;
      return;
    }
    const pitch = yinPitch(frame, this.sampleRate, { minHz: 65, maxHz: 500, threshold: 0.15 });
    if (pitch && pitch.confidence > 0.7) {
      this.pitches.push(pitch.hz);
      this.energies.push(rms);
      const mag = magnitudeSpectrum(frame, this.window);
      this.centroids.push(spectralCentroid(mag, this.sampleRate, this.frameSize));
      this.lastPitch = pitch.hz;
    } else {
      this.lastPitch = null;
    }
  }

  live(): VoiceLiveState {
    return {
      level: this.lastLevel,
      pitchHz: this.lastPitch,
      voicedSec: (this.pitches.length * this.hopSize) / this.sampleRate,
      durationSec: this.totalSamples / this.sampleRate,
      clipping: this.clipCount > 3,
    };
  }

  finish(): VoiceMetrics | null {
    const durationSec = this.totalSamples / this.sampleRate;
    if (durationSec < 1 || this.frameCount === 0) return null;
    const voicedRatio = this.pitches.length / this.frameCount;
    if (this.pitches.length < 6) {
      return {
        dominantPitchHz: 0,
        variance: 0,
        stability: 0,
        pitchVarianceSemitones: 0,
        energyVariance: 0,
        spectralCentroidHz: 0,
        voicedRatio,
        quality: 0,
        durationSec,
      };
    }
    const medPitch = median(this.pitches);
    const semis = this.pitches.map((f) => 12 * Math.log2(f / medPitch));
    const pitchVarianceSemitones = stddev(semis);
    const meanEnergy = mean(this.energies);
    const energyVariance = meanEnergy > 0 ? clamp01(stddev(this.energies) / meanEnergy) : 0;
    const spectralCentroidHz = mean(this.centroids);
    const levelOk = clamp01(meanEnergy / 0.05);
    const quality = clamp01(0.6 * clamp01(voicedRatio / 0.4) + 0.3 * levelOk + 0.1 * (this.clipCount > 3 ? 0 : 1));
    // Variance 0..1: 4 semitones of pitch spread or a fully varying level reads as 1.
    const variance = clamp01(0.7 * clamp01(pitchVarianceSemitones / 4) + 0.3 * energyVariance);
    // Stability 0..1: how little pitch and level move frame to frame, plus how continuously voiced.
    const jitter: number[] = [];
    for (let i = 1; i < semis.length; i++) jitter.push(Math.abs(semis[i]! - semis[i - 1]!));
    const shimmer: number[] = [];
    for (let i = 1; i < this.energies.length; i++)
      shimmer.push(Math.abs(this.energies[i]! - this.energies[i - 1]!) / Math.max(1e-6, meanEnergy));
    const pitchSteady = 1 - clamp01(median(jitter) / 1.0);
    const levelSteady = 1 - clamp01(median(shimmer) / 0.5);
    const continuity = clamp01(voicedRatio / 0.6);
    const stability = clamp01(0.5 * pitchSteady + 0.3 * levelSteady + 0.2 * continuity);
    return {
      dominantPitchHz: medPitch,
      variance,
      stability,
      pitchVarianceSemitones,
      energyVariance,
      spectralCentroidHz,
      voicedRatio,
      quality,
      durationSec,
    };
  }
}
