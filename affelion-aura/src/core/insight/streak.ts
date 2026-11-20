/**
 * A weekly streak: how many seven-day stretches in a row, counting back from now, hold at least
 * one scan. Weekly rather than daily, so the free plan's one scan a week can keep it going and
 * nobody is pushed to scan every day.
 *
 * The streak stays alive through the current week: if this week has no scan yet but last week
 * did, it counts from last week.
 */
const WEEK = 7 * 24 * 3600 * 1000;

export function weeklyStreak(scanTimes: readonly number[], now: number): number {
  if (scanTimes.length === 0) return 0;
  const weeks = new Set<number>();
  for (const t of scanTimes) {
    if (t > now) continue;
    weeks.add(Math.floor((now - t) / WEEK));
  }
  let k = weeks.has(0) ? 0 : weeks.has(1) ? 1 : -1;
  if (k < 0) return 0;
  let n = 0;
  while (weeks.has(k)) {
    n += 1;
    k += 1;
  }
  return n;
}

/** True when the time falls on the same calendar day as now, in local time. */
export function isToday(t: number, now: number): boolean {
  const a = new Date(t);
  const b = new Date(now);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
