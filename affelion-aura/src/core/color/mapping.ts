import type { AuraParams, AuraRegion, BiometricInput, ColorFamily, MappingInput, NormalisedState } from '../types';
import { clamp, clamp01, fnv1a, lerp, norm, quantize } from '../math';
import { COLOR_KNOWLEDGE_BASE, type AuraColorId } from './knowledgeBase';
import { hueRangeDistance } from './palette';
import { buildRegionExplanation, buildSummary } from './explain';

/**
 * Deterministic biometric → colour mapping. Implements the specification's rules exactly:
 *
 *   1. hrv >= 55 and bpm <= 78           → greens/teals, hue 140–190, low turbulence
 *   2. bpm >= 92 or hrv <= 28            → reds/oranges, hue 0–40, higher turbulence and pulse speed
 *   3. bpm <= 62                         → blues/indigos, hue 200–270, low turbulence
 *   4. otherwise                         → sky blue range (195–215)
 *   vocalVariance raises saturation and can trigger a brighter accent
 *   vocalStability sets lightness
 *   secondary signals refine the shade within the family (teal vs aqua, deep red vs crimson …)
 *
 * Rules are evaluated in the order listed, so a reading that satisfies more than one takes the
 * first. Every output carries a `primaryColorId` from the knowledge base. There is no randomness:
 * inputs are quantised, the same inputs always give the same outputs, and the fluid simulation's
 * seed is a hash of the quantised inputs.
 *
 * Assumptions made where the specification is silent (documented, not invented behaviour):
 *   • Crimson's range is 345–360, adjacent to 0 on the hue circle; it is treated as part of the
 *     reds/oranges family so the knowledge-base case "high BPM with moderate-to-high vocal
 *     variance" is reachable.
 *   • Achromatic knowledge-base tones (soft white, pearl, muted gray, earth brown, charcoal) have
 *     no hue range. They are selected by their stated biometric descriptions, applied after the
 *     family rule, and expressed through saturation and lightness rather than hue.
 *   • When no usable voice sample exists, vocalVariance is 0 and vocalStability is 0.5, and the
 *     explanations say the voice was not used.
 */

export const FAMILY_HUE: Record<ColorFamily, readonly [number, number]> = {
  greensTeals: [140, 190],
  redsOranges: [0, 40],
  bluesIndigos: [200, 270],
  skyBlue: [195, 215],
};

/** Knowledge-base entries that can be selected within each family (reds include crimson). */
const FAMILY_MEMBERS: Record<ColorFamily, readonly AuraColorId[]> = {
  greensTeals: ['emerald', 'teal', 'aqua'],
  redsOranges: ['crimson', 'deep_red', 'bright_orange', 'amber'],
  bluesIndigos: ['sky_blue', 'cobalt', 'indigo', 'violet', 'lavender'],
  skyBlue: ['sky_blue', 'aqua', 'cobalt'],
};

export function toMappingInput(input: BiometricInput): MappingInput & { voiceAvailable: boolean } {
  const { heart, voice } = input;
  const voiceAvailable = !!voice && voice.quality > 0.2 && voice.voicedRatio > 0.15;
  return {
    bpm: heart.bpm,
    hrv: heart.rmssd,
    vocalPitchHz: voiceAvailable ? voice!.dominantPitchHz : 0,
    vocalVariance: voiceAvailable ? clamp01(voice!.variance) : 0,
    vocalStability: voiceAvailable ? clamp01(voice!.stability) : 0.5,
    voiceAvailable,
  };
}

/** Quantise so near-identical readings map to identical portraits. */
export function quantiseInput<T extends MappingInput>(m: T): T {
  return {
    ...m,
    bpm: quantize(m.bpm, 1),
    hrv: quantize(m.hrv, 1),
    vocalPitchHz: quantize(m.vocalPitchHz, 1),
    vocalVariance: quantize(clamp01(m.vocalVariance), 0.02),
    vocalStability: quantize(clamp01(m.vocalStability), 0.02),
  };
}

export function selectFamily(m: MappingInput): ColorFamily {
  if (m.hrv >= 55 && m.bpm <= 78) return 'greensTeals';
  if (m.bpm >= 92 || m.hrv <= 28) return 'redsOranges';
  if (m.bpm <= 62) return 'bluesIndigos';
  return 'skyBlue';
}

interface FamilyResult {
  hue: number;
  turbulence: number;
  pulseMultiplier: number;
  primary: AuraColorId;
}

/**
 * Hue inside the family range and the refined knowledge-base shade.
 * Each family's position parameter is a 0..1 blend of the signals the knowledge base names for
 * its members; the refinement rules quote those descriptions.
 */
function resolveFamily(family: ColorFamily, m: MappingInput): FamilyResult {
  const [lo, hi] = FAMILY_HUE[family];
  switch (family) {
    case 'greensTeals': {
      // Stronger HRV and calmer pulse move from emerald (140) through teal toward aqua (190).
      const hrvStrength = norm(m.hrv, 55, 100);
      const calm = norm(78 - m.bpm, 0, 20);
      const t = 0.6 * hrvStrength + 0.4 * calm;
      let hue = lerp(lo, hi, t);
      // Aqua: "good HRV with open, steady voice". Teal: "high HRV + calm BPM". Emerald: "solid HRV with calm-to-moderate BPM".
      const openSteadyVoice = m.vocalStability >= 0.6 && m.vocalVariance >= 0.3;
      let primary: AuraColorId;
      if (hue >= 175 && openSteadyVoice) {
        primary = 'aqua';
        hue = Math.max(hue, 176);
      } else if (hue >= 155) {
        primary = 'teal';
        hue = clamp(hue, 160, 185);
      } else {
        primary = 'emerald';
        hue = clamp(hue, 140, 150);
      }
      const turbulence = lerp(0.24, 0.12, hrvStrength);
      return { hue, turbulence, pulseMultiplier: 1, primary };
    }
    case 'redsOranges': {
      // Intensity from how far past the thresholds the reading is; higher → deeper red.
      const bpmExcess = norm(m.bpm, 92, 120);
      const hrvDeficit = norm(28 - m.hrv, 0, 16);
      const intensity = clamp01(Math.max(bpmExcess, hrvDeficit) * 0.75 + Math.min(bpmExcess, hrvDeficit) * 0.25);
      let hue = lerp(hi, lo, intensity); // 40 → 0
      let primary: AuraColorId;
      const highBpm = m.bpm >= 92;
      if (highBpm && m.vocalVariance >= 0.5 && intensity >= 0.35) {
        // Crimson: "high BPM with moderate-to-high vocal variance".
        primary = 'crimson';
        hue = lerp(360, 345, norm(m.vocalVariance, 0.5, 1));
        if (hue >= 360) hue = 359.5;
      } else if (hue <= 15) {
        primary = 'deep_red'; // "high BPM or very low HRV"
        hue = Math.min(hue, 12);
      } else if (hue >= 34 && m.vocalVariance >= 0.4 && !highBpm) {
        primary = 'amber'; // "moderate-high BPM with positive vocal energy"
        hue = clamp(hue, 35, 40);
      } else {
        primary = 'bright_orange'; // "elevated BPM or rising activation"
        hue = clamp(hue, 18, 38);
      }
      const turbulence = lerp(0.62, 0.95, intensity);
      return { hue, turbulence, pulseMultiplier: 1.15, primary };
    }
    case 'bluesIndigos': {
      // Calmer pulse moves from sky blue (200) through cobalt and indigo toward violet (270).
      const calm = norm(62 - m.bpm, 0, 17);
      let hue = lerp(lo, hi, calm);
      let primary: AuraColorId;
      if (hue >= 255 && m.vocalStability >= 0.7) {
        primary = 'violet'; // "very calm BPM + clear, steady voice"
        hue = clamp(Math.max(hue, 260), 260, 270);
      } else if (hue >= 255 && m.vocalVariance <= 0.25) {
        primary = 'lavender'; // "calm metrics with low vocal variance"
        hue = 270;
      } else if (hue >= 230) {
        primary = 'indigo'; // "low BPM or strong parasympathetic markers"
        hue = clamp(hue, 230, 255);
      } else if (hue >= 210 && m.vocalStability >= 0.6) {
        primary = 'cobalt'; // "low BPM with high vocal stability"
        hue = clamp(hue, 210, 230);
      } else {
        primary = 'sky_blue'; // "lower-moderate BPM + stable voice"
        hue = clamp(hue, 200, 215);
      }
      const turbulence = lerp(0.2, 0.1, calm);
      return { hue, turbulence, pulseMultiplier: 1, primary };
    }
    case 'skyBlue':
    default: {
      // Default band: lower pulse sits higher in the range.
      const t = 1 - norm(m.bpm, 63, 91);
      const hue = lerp(195, 215, t);
      return { hue, turbulence: 0.32, pulseMultiplier: 1, primary: 'sky_blue' };
    }
  }
}

/**
 * Achromatic tones from the knowledge base, selected by their stated biometric descriptions.
 * Returns null when no achromatic tone applies. Precedence: charcoal, muted gray, earth brown,
 * soft white, pearl.
 */
export function selectAchromatic(m: MappingInput, voiceAvailable: boolean): AuraColorId | null {
  const flatVoice = voiceAvailable && m.vocalVariance <= 0.12;
  // Low-energy tones never override the greens/teals family (hrv >= 55 and calm bpm).
  const lowEnergyCandidate = !(m.hrv >= 55 && m.bpm <= 78);
  // Charcoal: "very low energy markers".
  if (m.bpm <= 52 && m.hrv <= 25 && (!voiceAvailable || m.vocalVariance <= 0.2)) return 'charcoal';
  // Muted gray: "low overall activation or flat vocal tone".
  if (lowEnergyCandidate && ((m.bpm <= 62 && m.hrv <= 40) || (flatVoice && m.bpm <= 70))) return 'muted_gray';
  // Earth brown: "moderate-low BPM with reduced HRV or flat voice".
  if (lowEnergyCandidate && m.bpm >= 55 && m.bpm <= 70 && (m.hrv <= 35 || flatVoice)) return 'earth_brown';
  // Soft white: "strong HRV + balanced metrics across the board".
  if (m.hrv >= 80 && m.bpm >= 55 && m.bpm <= 78 && voiceAvailable && m.vocalStability >= 0.6 && m.vocalVariance >= 0.2 && m.vocalVariance <= 0.6)
    return 'soft_white';
  // Pearl: "high HRV with moderate vocal variance".
  if (m.hrv >= 70 && voiceAvailable && m.vocalVariance >= 0.35 && m.vocalVariance <= 0.65) return 'pearl';
  return null;
}

/** Second-nearest chromatic member of the family to the hue, for the halo region. */
function selectSecondary(family: ColorFamily, hue: number, primary: AuraColorId): AuraColorId {
  const candidates = FAMILY_MEMBERS[family].filter((id) => id !== primary);
  let best: AuraColorId = candidates[0]!;
  let bestD = Infinity;
  for (const id of candidates) {
    const range = COLOR_KNOWLEDGE_BASE.find((c) => c.id === id)!.hueRange!;
    const d = hueRangeDistance(hue, range);
    if (d < bestD) {
      bestD = d;
      best = id;
    }
  }
  return best;
}

export function normalise(m: MappingInput, voiceAvailable: boolean): NormalisedState {
  return {
    activation: norm(m.bpm, 45, 120),
    coherence: norm(Math.log(clamp(m.hrv, 1, 400)), Math.log(12), Math.log(100)),
    vocalVariance: clamp01(m.vocalVariance),
    vocalStability: clamp01(m.vocalStability),
    voiceAvailable,
  };
}

export interface MappingOutput {
  hue: number;
  saturation: number;
  lightness: number;
  turbulence: number;
  pulseSpeed: number;
  primaryColorId: AuraColorId;
  secondaryColorId: AuraColorId;
  family: ColorFamily;
  accentStrength: number;
}

/** The core function named by the specification. Pure and deterministic. */
export function mapBiometricsToColor(raw: MappingInput, voiceAvailable = true): MappingOutput {
  const m = quantiseInput(raw);
  const family = selectFamily(m);
  const fam = resolveFamily(family, m);
  const achromatic = selectAchromatic(m, voiceAvailable);

  // Saturation: family base, raised by vocal variance.
  const familySat: Record<ColorFamily, number> = { greensTeals: 0.5, redsOranges: 0.66, bluesIndigos: 0.48, skyBlue: 0.44 };
  let saturation = clamp(familySat[family] + 0.32 * m.vocalVariance, 0.15, 0.98);
  // Lightness: set by vocal stability.
  let lightness = clamp(0.4 + 0.22 * m.vocalStability, 0.3, 0.75);
  // Brighter accent once vocal variance is high.
  let accentStrength = m.vocalVariance >= 0.6 ? clamp01((m.vocalVariance - 0.6) / 0.4) * 0.6 + 0.4 : 0;

  let hue = fam.hue;
  let primaryColorId = fam.primary;
  let turbulence = fam.turbulence;
  const pulseSpeed = clamp((m.bpm / 60) * fam.pulseMultiplier, 0.6, 2.2);

  switch (achromatic) {
    case 'charcoal':
      saturation = 0.06;
      lightness = 0.18;
      turbulence = Math.min(turbulence, 0.2);
      accentStrength = 0;
      break;
    case 'muted_gray':
      saturation = 0.08;
      lightness = 0.5;
      turbulence = Math.min(turbulence, 0.25);
      accentStrength = 0;
      break;
    case 'earth_brown':
      hue = 28;
      saturation = 0.26;
      lightness = 0.36;
      turbulence = Math.min(turbulence, 0.3);
      accentStrength = 0;
      break;
    case 'soft_white':
      saturation = Math.min(saturation, 0.28);
      lightness = 0.9;
      break;
    case 'pearl':
      saturation = Math.min(saturation, 0.3);
      lightness = 0.84;
      break;
    default:
      break;
  }
  if (achromatic) primaryColorId = achromatic;

  const secondaryColorId = selectSecondary(family, fam.hue, fam.primary);

  return {
    hue: quantize(((hue % 360) + 360) % 360, 0.5),
    saturation: quantize(saturation, 0.005),
    lightness: quantize(lightness, 0.005),
    turbulence: quantize(turbulence, 0.005),
    pulseSpeed: quantize(pulseSpeed, 0.01),
    primaryColorId,
    secondaryColorId,
    family,
    accentStrength: quantize(accentStrength, 0.01),
  };
}

/** Full aura parameters for the renderer and UI, including grounded copy. */
export function mapBiometricsToAura(input: BiometricInput): AuraParams {
  const { voiceAvailable, ...mapping } = toMappingInput(input);
  const m = quantiseInput(mapping);
  const out = mapBiometricsToColor(m, voiceAvailable);
  const state = normalise(m, voiceAvailable);

  const regions: AuraRegion[] = [
    {
      id: 'core',
      colorId: out.primaryColorId,
      weight: 1,
      metric: 'heartRate',
      explanation: buildRegionExplanation('core', out.primaryColorId, m, voiceAvailable),
    },
    {
      id: 'halo',
      colorId: out.secondaryColorId,
      weight: quantize(0.45 + 0.35 * Math.abs(2 * state.coherence - 1), 0.01),
      metric: 'hrv',
      explanation: buildRegionExplanation('halo', out.secondaryColorId, m, voiceAvailable),
    },
  ];

  const seed = fnv1a([m.bpm, m.hrv, m.vocalPitchHz, m.vocalVariance, m.vocalStability, out.hue].join('|'));

  return {
    ...out,
    regions,
    state,
    seed,
    summary: buildSummary(out.primaryColorId, m, voiceAvailable),
  };
}
