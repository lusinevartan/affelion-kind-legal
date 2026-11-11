import type { AuraColorId as KbColorId } from './color/knowledgeBase';

/**
 * Shared domain types for Affelion Aura.
 *
 * Everything the app shows is derived from measured physical signals:
 * heart rate and heart-rate variability from rear-camera photoplethysmography (PPG),
 * and pitch / variation of the voice from a short recording. The app translates those
 * numbers into colour and motion. It does not measure, detect or claim anything invisible.
 */

/** Summary of the finger PPG measurement. */
export interface HeartMetrics {
  /** Mean heart rate in beats per minute. */
  bpm: number;
  /** Root mean square of successive differences between beats, in milliseconds. */
  rmssd: number;
  /** Standard deviation of beat intervals, in milliseconds. */
  sdnn: number;
  /** Percentage (0..100) of successive intervals that differ by more than 50 ms. */
  pnn50: number;
  /** Number of accepted beats used for the estimate. */
  beatCount: number;
  /** Signal quality estimate, 0 (unusable) to 1 (clean). */
  quality: number;
  /** Seconds of usable signal. */
  durationSec: number;
}

/** Summary of the short voice sample (4–6 s). */
export interface VoiceMetrics {
  /** Dominant (median) fundamental frequency in Hz over voiced frames. */
  dominantPitchHz: number;
  /** Pitch variance normalised 0..1 (0 = monotone, 1 = highly varied). */
  variance: number;
  /** Stability normalised 0..1 (1 = very steady pitch and level frame to frame). */
  stability: number;
  /** Raw: standard deviation of pitch in semitones over voiced frames. */
  pitchVarianceSemitones: number;
  /** Raw: coefficient of variation of frame energy, clamped 0..1. */
  energyVariance: number;
  /** Raw: mean spectral centroid in Hz over voiced frames. */
  spectralCentroidHz: number;
  /** Fraction (0..1) of frames with a confident pitch. */
  voicedRatio: number;
  /** Signal quality estimate 0..1 (voiced coverage, level, clipping). */
  quality: number;
  /** Seconds of audio analysed. */
  durationSec: number;
}

/** Inputs to the biometric-to-colour engine. */
export interface BiometricInput {
  heart: HeartMetrics;
  voice: VoiceMetrics | null;
}

/** The exact input vector named by the mapping specification. */
export interface MappingInput {
  bpm: number;
  /** HRV in ms (RMSSD). */
  hrv: number;
  vocalPitchHz: number;
  /** 0..1 */
  vocalVariance: number;
  /** 0..1 */
  vocalStability: number;
}

export type { AuraColorId } from './color/knowledgeBase';

export interface HSL {
  /** Degrees 0..360 */
  h: number;
  /** 0..1 */
  s: number;
  /** 0..1 */
  l: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Which rule of the specification selected the colour family. */
export type ColorFamily = 'greensTeals' | 'redsOranges' | 'bluesIndigos' | 'skyBlue';

/** Normalised state derived from the raw metrics. All values 0..1 unless noted. */
export interface NormalisedState {
  /** Heart-rate driven activation. 0 = very low BPM, 1 = very high BPM. */
  activation: number;
  /** HRV driven coherence. 0 = very low variability, 1 = very high variability. */
  coherence: number;
  /** Vocal variance 0..1 as supplied. */
  vocalVariance: number;
  /** Vocal stability 0..1 as supplied. */
  vocalStability: number;
  /** False when no usable voice sample existed and neutral defaults were used. */
  voiceAvailable: boolean;
}

/** A region of the portrait that the user can tap for a knowledge-base explanation. */
export interface AuraRegion {
  id: 'core' | 'halo';
  colorId: KbColorId;
  /** Relative weight 0..1 used by the renderer for dye injection. */
  weight: number;
  /** Which measurements this region is tied to. */
  metric: 'heartRate' | 'hrv' | 'voice';
  /** Knowledge-base explanation followed by the user's actual numbers. */
  explanation: string;
}

/** The deterministic output consumed by the shader and the UI. */
export interface AuraParams {
  /** Dominant hue, degrees 0..360. */
  hue: number;
  /** 0..1 */
  saturation: number;
  /** 0..1 */
  lightness: number;
  /** 0..1 how chaotic the fluid motion is. */
  turbulence: number;
  /** Pulses per second driving the fluid injection rhythm. */
  pulseSpeed: number;
  /** Knowledge-base id of the primary colour. */
  primaryColorId: KbColorId;
  /** Knowledge-base id of the secondary (halo) colour. */
  secondaryColorId: KbColorId;
  family: ColorFamily;
  /** 0..1 strength of the brighter accent triggered by vocal variance. */
  accentStrength: number;
  regions: AuraRegion[];
  state: NormalisedState;
  /** 32-bit seed derived from the quantised input, for the fluid simulation's PRNG. */
  seed: number;
  /** One-sentence honest summary for the teaser Polaroid. */
  summary: string;
}

export type ScanPhase =
  | 'idle'
  | 'face'
  | 'finger'
  | 'voice'
  | 'computing'
  | 'done'
  | 'failed';

export interface ScanRecord {
  id: string;
  createdAt: number;
  heart: HeartMetrics;
  voice: VoiceMetrics | null;
  aura: AuraParams;
  /** File URI of the Polaroid composite (if exported) */
  portraitUri: string | null;
  /** File URI of the raw camera still used under the aura */
  stillUri: string | null;
  /** Small base64 preview for history list, optional */
  thumbnailBase64?: string | null;
}

/** Snapshot of the heart metrics over a short window, used for before/after comparisons. */
export interface WindowMetrics {
  bpm: number;
  rmssd: number;
  /** 0..1 coherence score (see CoherenceAnalyzer). */
  coherence: number;
  /** Respiratory sinus arrhythmia amplitude, ms. */
  rsaMs: number;
}

/** A guided breathing practice with live aura feedback. */
export interface PracticeRecord {
  id: string;
  createdAt: number;
  /** Scan the practice started from, if any. */
  scanId: string | null;
  durationSec: number;
  breathsPerMinute: number;
  before: WindowMetrics;
  after: WindowMetrics;
  beforeAura: AuraParams;
  afterAura: AuraParams;
  /** Mean coherence score across the session. */
  coherenceMean: number;
  coherencePeak: number;
  /** Seconds spent at high coherence. */
  highCoherenceSec: number;
  /** Mean breathing sync with the pacer, 0..1. */
  breathingSync: number;
  beforePortraitUri: string | null;
  afterPortraitUri: string | null;
}
