import type { AuraParams, MappingInput } from '../types';
import { clamp01, lerp, mixHue } from '../math';
import { mapBiometricsToColor } from './mapping';
import { buildRegionExplanation, buildSummary } from './explain';

/**
 * Live aura during a practice session. The same deterministic mapping is applied to a sliding
 * window of heart metrics, then eased toward the new values so the portrait evolves smoothly
 * instead of jumping. Coherence reduces turbulence on top of the family rule, which is the
 * visible "settling" the user is practising toward. The vocal inputs are held from the scan.
 */
export interface LiveWindow {
  bpm: number;
  hrv: number;
  /** 0..1 coherence score. */
  coherence: number;
}

export function auraFromWindow(w: LiveWindow, voice: Pick<MappingInput, 'vocalPitchHz' | 'vocalVariance' | 'vocalStability'>, voiceAvailable: boolean): AuraParams {
  const m: MappingInput = { bpm: w.bpm, hrv: w.hrv, ...voice };
  const out = mapBiometricsToColor(m, voiceAvailable);
  const turbulence = out.turbulence * (1 - 0.5 * clamp01(w.coherence));
  const seed = 1; // live portraits share one seed so the fluid pattern continues across updates
  return {
    ...out,
    turbulence,
    regions: [
      { id: 'core', colorId: out.primaryColorId, weight: 1, metric: 'heartRate', explanation: buildRegionExplanation('core', out.primaryColorId, m, voiceAvailable) },
      { id: 'halo', colorId: out.secondaryColorId, weight: 0.6, metric: 'hrv', explanation: buildRegionExplanation('halo', out.secondaryColorId, m, voiceAvailable) },
    ],
    state: { activation: clamp01((w.bpm - 45) / 75), coherence: clamp01(w.coherence), vocalVariance: voice.vocalVariance, vocalStability: voice.vocalStability, voiceAvailable },
    seed,
    summary: buildSummary(out.primaryColorId, m, voiceAvailable),
  };
}

/** Ease the continuous shader parameters toward a target; discrete fields jump to the target. */
export function blendAuraParams(prev: AuraParams | null, next: AuraParams, t: number): AuraParams {
  if (!prev) return next;
  const k = clamp01(t);
  return {
    ...next,
    hue: mixHue(prev.hue, next.hue, k),
    saturation: lerp(prev.saturation, next.saturation, k),
    lightness: lerp(prev.lightness, next.lightness, k),
    turbulence: lerp(prev.turbulence, next.turbulence, k),
    pulseSpeed: lerp(prev.pulseSpeed, next.pulseSpeed, k),
    accentStrength: lerp(prev.accentStrength, next.accentStrength, k),
    seed: prev.seed,
  };
}
