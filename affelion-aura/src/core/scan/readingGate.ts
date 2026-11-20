import type { HeartMetrics } from '../types';

/**
 * The last check before a reading becomes a portrait. A shaky or out-of-range pulse is never
 * dressed up as a result: the person gets one neutral line and a retry, and the free scan is not
 * used, because nothing is saved.
 */
export const MIN_QUALITY = 0.5;
export const MIN_BPM = 40;
export const MAX_BPM = 140;

/** The one message for any reading that can't become a portrait. Neutral, one tip, no health words. */
export const RETRY_MESSAGE = "We couldn't get a clear reading. Try again sitting still, with your fingertip covering the camera and flash.";

export function readingProblem(heart: HeartMetrics): string | null {
  const unclear = !Number.isFinite(heart.bpm) || heart.quality < MIN_QUALITY;
  const outOfRange = heart.bpm < MIN_BPM || heart.bpm > MAX_BPM;
  return unclear || outOfRange ? RETRY_MESSAGE : null;
}
