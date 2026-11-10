import type {
  AuraColorId,
  AuraParams,
  AuraRegion,
  BiometricInput,
  HeartMetrics,
  NormalisedState,
  VoiceMetrics,
} from '../types';
import { clamp, clamp01, fnv1a, mixHue, norm, piecewise, quantize, smoothstep, wrapHue } from '../math';
import { AURA_COLORS, nearestChromaticColor } from './palette';
import { buildRegionExplanation, buildSummary } from './explain';

/**
 * Deterministic biometric → aura mapping.
 *
 * Contract (from the product brief):
 *   high BPM or low HRV   → reds / oranges, higher turbulence
 *   high HRV + calm BPM   → greens / teals, smooth motion
 *   low BPM               → blues / indigos
 *   vocal variance        → raises saturation, can add bright accents
 *
 * The same quantised inputs always produce the same outputs. There is no randomness here;
 * the only "random" element in the experience is the fluid simulation, and that is seeded
 * from the quantised inputs too.
 */

/** Resting heart-rate range we normalise against. Outside is clamped. */
const BPM_LO = 45;
const BPM_HI = 110;
/** RMSSD range (ms), normalised in log space because HRV is log-normal in adults. */
const RMSSD_LO = 12;
const RMSSD_HI = 100;

/** Hue path over the activation axis, in "unwrapped" degrees so the red end can sit below 0. */
const ACTIVATION_HUE_KNOTS: ReadonlyArray<readonly [number, number]> = [
  [0.0, 250], // indigo      (~45 bpm)
  [0.15, 208], // sky blue   (~55 bpm)
  [0.32, 173], // teal       (~66 bpm)
  [0.5, 95], // lime green   (~77 bpm)
  [0.66, 46], // golden yellow (~88 bpm)
  [0.82, 26], // bright orange (~98 bpm)
  [1.0, 3], // deep red      (~110 bpm)
];

export function quantiseHeart(h: HeartMetrics): HeartMetrics {
  return {
    ...h,
    bpm: quantize(h.bpm, 1),
    rmssd: quantize(h.rmssd, 1),
    sdnn: quantize(h.sdnn, 1),
    pnn50: quantize(h.pnn50, 1),
    quality: quantize(clamp01(h.quality), 0.05),
  };
}

export function quantiseVoice(v: VoiceMetrics | null): VoiceMetrics | null {
  if (!v) return null;
  return {
    ...v,
    medianPitchHz: quantize(v.medianPitchHz, 1),
    pitchVarianceSemitones: quantize(v.pitchVarianceSemitones, 0.1),
    energyVariance: quantize(clamp01(v.energyVariance), 0.02),
    spectralCentroidHz: quantize(v.spectralCentroidHz, 10),
    voicedRatio: quantize(clamp01(v.voicedRatio), 0.05),
    quality: quantize(clamp01(v.quality), 0.05),
  };
}

export function normalise(input: BiometricInput): NormalisedState {
  const { heart, voice } = input;
  const activation = norm(heart.bpm, BPM_LO, BPM_HI);
  const coherence = norm(Math.log(clamp(heart.rmssd, 1, 400)), Math.log(RMSSD_LO), Math.log(RMSSD_HI));

  let vocalVariance = 0;
  if (voice && voice.quality > 0.2 && voice.voicedRatio > 0.15) {
    const pitchVar = norm(voice.pitchVarianceSemitones, 0.4, 4.0);
    const energyVar = clamp01(voice.energyVariance);
    const brightness = norm(voice.spectralCentroidHz, 400, 2600);
    vocalVariance = clamp01(0.55 * pitchVar + 0.3 * energyVar + 0.15 * brightness);
  }

  const arousal = clamp01(0.6 * activation + 0.4 * (1 - coherence));
  return { activation, coherence, vocalVariance, arousal };
}

/** Core hue from activation, bent by coherence. */
export function deriveHue(state: NormalisedState): number {
  const { activation: a, coherence: c } = state;
  const base = piecewise(ACTIVATION_HUE_KNOTS, a);
  if (c < 0.5) {
    // Low variability pulls toward red/orange. At very low activation the blue/indigo
    // family stays put and low coherence is expressed as muted earth tones instead.
    const k = 0.8 * (1 - 2 * c) * smoothstep(0.15, 0.45, a);
    return wrapHue(mixHue(base, 8, k));
  }
  // High variability pulls toward teal/green once the pulse is out of the deep-rest band,
  // easing off at very high activation so a racing pulse is never read as calm.
  const k = 0.7 * (2 * c - 1) * smoothstep(0.1, 0.35, a) * (1 - 0.5 * smoothstep(0.7, 0.95, a));
  return wrapHue(mixHue(base, 160, k));
}

export function deriveSaturation(state: NormalisedState): number {
  const { activation: a, coherence: c, vocalVariance: v } = state;
  let s = 0.52 + 0.28 * v + 0.1 * Math.abs(2 * c - 1);
  // Low energy + low coherence → muted earth tones.
  const earthiness = (1 - c) * (1 - smoothstep(0.25, 0.5, a));
  s -= 0.38 * earthiness;
  return clamp(s, 0.14, 0.95);
}

export function deriveLightness(state: NormalisedState): number {
  const { activation: a, coherence: c } = state;
  let l = 0.5 + 0.14 * (c - 0.5) - 0.08 * (a - 0.5);
  // Strong coherence lifts the centre toward soft white.
  l += 0.22 * smoothstep(0.86, 1.0, c);
  // Low energy + low coherence darkens toward earth.
  l -= 0.1 * (1 - c) * (1 - smoothstep(0.25, 0.5, a));
  return clamp(l, 0.3, 0.9);
}

export function deriveTurbulence(state: NormalisedState): number {
  const { activation: a, coherence: c } = state;
  let t = 0.12 + 0.55 * a + 0.38 * (1 - c);
  t *= 1 - 0.35 * c; // smooth motion when coherence is high
  return clamp01(t);
}

export function derivePulseSpeed(bpm: number): number {
  return clamp(bpm / 60, 0.6, 2.2);
}

function chooseColors(
  state: NormalisedState,
  hue: number,
  saturation: number,
  lightness: number,
): { dominant: AuraColorId; secondary: AuraColorId; accent: AuraColorId | null } {
  const { activation: a, coherence: c, vocalVariance: v } = state;
  const earthiness = (1 - c) * (1 - smoothstep(0.25, 0.5, a));

  let dominant: AuraColorId = nearestChromaticColor(hue);
  if (earthiness > 0.55 && saturation < 0.3) dominant = 'earth';
  if (c > 0.96 && lightness > 0.72) dominant = 'softWhite';

  // Secondary: the halo. Tied to HRV: high → teal/lime, low → orange/red, mid → neighbour hue.
  let secondary: AuraColorId;
  if (c > 0.66) secondary = a < 0.45 ? 'teal' : 'limeGreen';
  else if (c < 0.34) secondary = a > 0.55 ? 'deepRed' : 'earth';
  else secondary = nearestChromaticColor(mixHue(hue, c >= 0.5 ? 160 : 30, 0.5));
  if (dominant === 'earth') {
    // Low energy: pair the muted centre with deep rest or, at a higher pulse, strain.
    secondary = a < 0.3 ? 'indigo' : 'deepRed';
  } else if (dominant === 'softWhite') {
    secondary = a < 0.3 ? 'skyBlue' : 'teal';
  } else if (secondary === dominant) {
    secondary = nearestChromaticColor(wrapHue(hue + (c >= 0.5 ? 35 : -35)));
    if (secondary === dominant) secondary = c >= 0.5 ? 'skyBlue' : 'brightOrange';
  }

  // Accent: driven by vocal variance. Bright, well-articulated voice → golden yellow;
  // very steady voice with high coherence → soft white; low pulse + quiet voice → violet.
  let accent: AuraColorId | null = null;
  if (v > 0.45) accent = 'goldenYellow';
  else if (v < 0.2 && c > 0.7) accent = 'softWhite';
  else if (v < 0.25 && a < 0.3) accent = 'violet';
  if (accent === dominant || accent === secondary) accent = accent === 'goldenYellow' ? 'softWhite' : null;

  return { dominant, secondary, accent };
}

/**
 * Map measured biometrics to shader parameters and palette choices.
 * Pure and deterministic for identical (quantised) inputs.
 */
export function mapBiometricsToAura(rawInput: BiometricInput): AuraParams {
  const heart = quantiseHeart(rawInput.heart);
  const voice = quantiseVoice(rawInput.voice);
  const input: BiometricInput = { heart, voice };
  const state = normalise(input);

  const hue = quantize(deriveHue(state), 0.5);
  const saturation = quantize(deriveSaturation(state), 0.005);
  const lightness = quantize(deriveLightness(state), 0.005);
  const turbulence = quantize(deriveTurbulence(state), 0.005);
  const pulseSpeed = quantize(derivePulseSpeed(heart.bpm), 0.01);

  const { dominant, secondary, accent } = chooseColors(state, hue, saturation, lightness);
  const haloHue = AURA_COLORS[secondary].hsl.h;
  const accentStrength = accent
    ? quantize(clamp01(accent === 'goldenYellow' ? (state.vocalVariance - 0.45) / 0.55 + 0.25 : 0.35), 0.01)
    : 0;

  const regions: AuraRegion[] = [
    {
      id: 'core',
      colorId: dominant,
      weight: 1,
      metric: 'heartRate',
      explanation: buildRegionExplanation('core', dominant, input, state),
    },
    {
      id: 'halo',
      colorId: secondary,
      weight: quantize(0.45 + 0.35 * Math.abs(2 * state.coherence - 1), 0.01),
      metric: 'hrv',
      explanation: buildRegionExplanation('halo', secondary, input, state),
    },
  ];
  if (accent) {
    regions.push({
      id: 'accent',
      colorId: accent,
      weight: accentStrength,
      metric: 'voice',
      explanation: buildRegionExplanation('accent', accent, input, state),
    });
  }

  const seed = fnv1a(
    [heart.bpm, heart.rmssd, voice?.pitchVarianceSemitones ?? -1, voice?.energyVariance ?? -1, hue].join('|'),
  );

  return {
    hue,
    saturation,
    lightness,
    turbulence,
    pulseSpeed,
    haloHue,
    accentStrength,
    dominant,
    secondary,
    accent,
    regions,
    state,
    seed,
    summary: buildSummary(dominant, input, state),
  };
}
