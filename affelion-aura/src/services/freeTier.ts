/**
 * The free plan: the first scan is free, then one free scan every seven days. Pure functions,
 * no storage, so they are easy to test. Storage lives in entitlements.ts.
 */

/** Free scans come back once a week. */
export const FREE_SCAN_INTERVAL_MS = 7 * 24 * 3600 * 1000;

/** The next moment a free scan is available, or null when one is available now. */
export function nextFreeScanAt(lastFreeScanAt: number | null, now: number): number | null {
  if (lastFreeScanAt === null) return null;
  const next = lastFreeScanAt + FREE_SCAN_INTERVAL_MS;
  return now >= next ? null : next;
}

/** Plain status line for the free plan: "Your free scan is ready" or "Next free scan Tuesday". */
export function freeScanStatus(next: number | null, now: number): string {
  if (next === null) return 'Your free scan is ready';
  // Count calendar days in the person's own time zone, so "tomorrow" means tomorrow.
  const startOf = (t: number) => {
    const d = new Date(t);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };
  const days = Math.round((startOf(next) - startOf(now)) / (24 * 3600 * 1000));
  if (days <= 0) return 'Next free scan later today';
  if (days === 1) return 'Next free scan tomorrow';
  const day = new Date(next).toLocaleDateString('en-US', { weekday: 'long' });
  return `Next free scan ${day}`;
}

export interface Access {
  canScan: boolean;
  canPractice: boolean;
  freeScansLeft: number;
  nextFreeScanAt: number | null;
}

/**
 * What a person may do right now. Pro opens everything; the free plan gets one scan a week and
 * one practice session. Every Pro gate in the app reads from this or from `isPro` directly.
 */
export function accessFor(p: { isPro: boolean; lastFreeScanAt: number | null; freePracticeUsed: boolean }, now: number): Access {
  const next = nextFreeScanAt(p.lastFreeScanAt, now);
  const freeScansLeft = next === null ? 1 : 0;
  return {
    canScan: p.isPro || freeScansLeft > 0,
    canPractice: p.isPro || !p.freePracticeUsed,
    freeScansLeft,
    nextFreeScanAt: next,
  };
}

export function freeScansRemaining(lastFreeScanAt: number | null, now: number): number {
  return nextFreeScanAt(lastFreeScanAt, now) === null ? 1 : 0;
}
