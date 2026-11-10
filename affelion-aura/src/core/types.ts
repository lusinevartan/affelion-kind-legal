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

/** Summary of the short voice sample. */
export interface VoiceMetrics {
  /** Median fundamental frequency in Hz over voiced frames. */
  medianPitchHz: number;
  /** Standard deviation of pitch in semitones over voiced frames. */
  pitchVarianceSemitones: number;
  /** Coefficient of variation of frame energy (0..1 after clamping). */
  energyVariance: number;
  /** Mean spectral centroid in Hz over voiced frames. */
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

/** Identifier for one of the ten colours in the Affelion colour system. */
export type AuraColorId =
  | 'deepRed'
  | 'brightOrange'
  | 'goldenYellow'
  | 'limeGreen'
  | 'teal'
  | 'skyBlue'
  | 'indigo'
  | 'violet'
  | 'softWhite'
  | 'earth';

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

/** Normalised state derived from the raw metrics. All values 0..1. */
export interface NormalisedState {
  /** Heart-rate driven activation. 0 = very low BPM, 1 = very high BPM. */
  activation: number;
  /** HRV driven coherence. 0 = very low variability, 1 = very high variability. */
  coherence: number;
  /** Vocal variance. 0 = flat and quiet, 1 = highly varied. */
  vocalVariance: number;
  /** Overall arousal blend used for turbulence. */
  arousal: number;
}

/** A region of the portrait that the user can tap for an explanation. */
export interface AuraRegion {
  id: 'core' | 'halo' | 'accent';
  colorId: AuraColorId;
  /** Relative weight 0..1 used by the renderer for dye injection. */
  weight: number;
  /** Which metric this region is tied to. */
  metric: 'heartRate' | 'hrv' | 'voice';
  /** One grounded sentence tying the colour to the measurement. */
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
  /** Secondary hue used for the outer halo. */
  haloHue: number;
  /** 0..1 strength of bright accents from vocal variance. */
  accentStrength: number;
  /** Colour ids, dominant first. */
  dominant: AuraColorId;
  secondary: AuraColorId;
  accent: AuraColorId | null;
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
