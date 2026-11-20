import { isToday, weeklyStreak } from '../src/core/insight/streak';

const DAY = 24 * 3600 * 1000;
const NOW = new Date(2026, 10, 20, 15, 0, 0).getTime();

describe('the weekly streak', () => {
  it('is zero with no scans or only old ones', () => {
    expect(weeklyStreak([], NOW)).toBe(0);
    expect(weeklyStreak([NOW - 20 * DAY], NOW)).toBe(0);
  });

  it('counts weeks in a row that hold a scan', () => {
    expect(weeklyStreak([NOW - DAY], NOW)).toBe(1);
    expect(weeklyStreak([NOW - DAY, NOW - 9 * DAY, NOW - 15 * DAY], NOW)).toBe(3);
    // Two scans in one week still count as one week.
    expect(weeklyStreak([NOW - DAY, NOW - 2 * DAY], NOW)).toBe(1);
  });

  it('stops at the first empty week', () => {
    expect(weeklyStreak([NOW - DAY, NOW - 16 * DAY], NOW)).toBe(1);
  });

  it('stays alive while this week has no scan yet', () => {
    expect(weeklyStreak([NOW - 8 * DAY, NOW - 15 * DAY], NOW)).toBe(2);
  });

  it('knows what today is', () => {
    expect(isToday(NOW - 3600 * 1000, NOW)).toBe(true);
    expect(isToday(NOW - DAY, NOW)).toBe(false);
  });
});
