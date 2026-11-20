import { RETRY_MESSAGE, readingProblem } from '../src/core/scan/readingGate';
import type { HeartMetrics } from '../src/core/types';

const good: HeartMetrics = { bpm: 68, rmssd: 42, sdnn: 50, pnn50: 20, beatCount: 40, quality: 0.8, durationSec: 40 };

describe('the reading gate', () => {
  it('lets a clean, ordinary reading through', () => {
    expect(readingProblem(good)).toBeNull();
    expect(readingProblem({ ...good, bpm: 40 })).toBeNull();
    expect(readingProblem({ ...good, bpm: 140 })).toBeNull();
  });

  it('gives the same neutral retry line for a shaky signal or an out-of-range pulse', () => {
    for (const bad of [{ quality: 0.3 }, { bpm: 35 }, { bpm: 152 }, { bpm: NaN }]) {
      expect(readingProblem({ ...good, ...bad })).toBe(RETRY_MESSAGE);
    }
  });

  it('uses no health wording', () => {
    expect(RETRY_MESSAGE).not.toMatch(/doctor|unwell|medical|health|heart rate|beats a minute/i);
  });
});
