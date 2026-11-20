import { readingProblem } from '../src/core/scan/readingGate';
import type { HeartMetrics } from '../src/core/types';

const good: HeartMetrics = { bpm: 68, rmssd: 42, sdnn: 50, pnn50: 20, beatCount: 40, quality: 0.8, durationSec: 40 };

describe('the reading gate', () => {
  it('lets a clean, ordinary reading through', () => {
    expect(readingProblem(good)).toBeNull();
    expect(readingProblem({ ...good, bpm: 40 })).toBeNull();
    expect(readingProblem({ ...good, bpm: 140 })).toBeNull();
  });

  it('asks for a retry when the signal is shaky, and says the free scan is safe', () => {
    const msg = readingProblem({ ...good, quality: 0.3 });
    expect(msg).toMatch(/could not get a clear pulse/);
    expect(msg).toMatch(/did not use your free scan/);
  });

  it('flags a pulse outside 40 to 140 with a calm see-a-doctor line', () => {
    expect(readingProblem({ ...good, bpm: 35 })).toMatch(/about 35 beats a minute/);
    expect(readingProblem({ ...good, bpm: 152 })).toMatch(/talk to a doctor/);
    expect(readingProblem({ ...good, bpm: NaN })).toMatch(/could not get a clear pulse/);
  });
});
