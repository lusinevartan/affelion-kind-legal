import { mapBiometricsToAura } from '../../core/color/mapping';

/**
 * Neutral preview aura, derived through the same mapping from a resting input. Used on
 * onboarding and during the outline step, before any pulse has been read. The copy around it
 * always says real colours arrive after the measurement.
 */
export const PREVIEW_PARAMS = mapBiometricsToAura({
  heart: { bpm: 66, rmssd: 50, sdnn: 55, pnn50: 25, beatCount: 0, quality: 0, durationSec: 0 },
  voice: null,
});
