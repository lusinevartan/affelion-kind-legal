import { FREE_SCAN_INTERVAL_MS, freeScanStatus, freeScansRemaining, nextFreeScanAt } from '../src/services/freeTier';

const DAY = 24 * 3600 * 1000;
// Noon on a Wednesday, local time, so day math never crosses midnight by accident.
const WED_NOON = new Date(2026, 10, 18, 12, 0, 0).getTime();

describe('the weekly free scan', () => {
  it('gives the first scan free', () => {
    expect(nextFreeScanAt(null, WED_NOON)).toBeNull();
    expect(freeScansRemaining(null, WED_NOON)).toBe(1);
    expect(freeScanStatus(null, WED_NOON)).toBe('Your free scan is ready');
  });

  it('locks for seven days after a free scan, then opens again', () => {
    expect(FREE_SCAN_INTERVAL_MS).toBe(7 * DAY);
    expect(freeScansRemaining(WED_NOON, WED_NOON + 1)).toBe(0);
    expect(nextFreeScanAt(WED_NOON, WED_NOON + DAY)).toBe(WED_NOON + 7 * DAY);
    expect(freeScansRemaining(WED_NOON, WED_NOON + 7 * DAY - 1)).toBe(0);
    expect(freeScansRemaining(WED_NOON, WED_NOON + 7 * DAY)).toBe(1);
  });

  it('names the day the next free scan arrives in plain words', () => {
    const next = WED_NOON + 7 * DAY;
    expect(freeScanStatus(next, WED_NOON + DAY)).toBe('Next free scan Wednesday');
    expect(freeScanStatus(next, WED_NOON + 6 * DAY)).toBe('Next free scan tomorrow');
    expect(freeScanStatus(next, WED_NOON + 7 * DAY - 3600 * 1000)).toBe('Next free scan later today');
  });
});
