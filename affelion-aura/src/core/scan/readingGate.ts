import type { HeartMetrics } from '../types';

/**
 * The last check before a reading becomes a portrait. A shaky or out-of-range pulse is never
 * dressed up as a result: the person gets a plain reason and a retry, and the free scan is not
 * used, because nothing is saved.
 */
export const MIN_QUALITY = 0.5;
export const MIN_BPM = 40;
export const MAX_BPM = 140;

export function readingProblem(heart: HeartMetrics): string | null {
  if (!Number.isFinite(heart.bpm) || heart.quality < MIN_QUALITY) {
    return 'We could not get a clear pulse that time. Rest your fingertip lightly over the camera and keep still. This try did not use your free scan.';
  }
  if (heart.bpm < MIN_BPM || heart.bpm > MAX_BPM) {
    return `That reading came out at about ${Math.round(heart.bpm)} beats a minute, outside the range this app reads well. Sit still for a minute and try again. If you feel unwell, talk to a doctor. This app is not a medical device.`;
  }
  return null;
}
