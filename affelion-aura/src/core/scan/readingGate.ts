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

/** Why a reading passed or not, in technical terms, for the TestFlight debug screen. */
export function gateCheck(heart: HeartMetrics): { ok: boolean; reason: string } {
  if (!Number.isFinite(heart.bpm)) return { ok: false, reason: 'no pulse rate' };
  if (heart.quality < MIN_QUALITY) return { ok: false, reason: `signal quality ${Math.round(heart.quality * 100)}% is below ${MIN_QUALITY * 100}%` };
  if (heart.bpm < MIN_BPM || heart.bpm > MAX_BPM) return { ok: false, reason: `pulse ${Math.round(heart.bpm)} is outside ${MIN_BPM} to ${MAX_BPM}` };
  return { ok: true, reason: `quality ${Math.round(heart.quality * 100)}%, pulse ${Math.round(heart.bpm)}` };
}

export function readingProblem(heart: HeartMetrics): string | null {
  return gateCheck(heart).ok ? null : RETRY_MESSAGE;
}
