/** The disclaimer (launch/STATUS.md, M7): exact wording, and on every screen that shows a result. */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DISCLAIMER } from '../src/core/disclaimer';

describe('the disclaimer', () => {
  it('uses the agreed wording', () => {
    expect(DISCLAIMER).toBe('Affelion Aura is for wellness and self-reflection. It is not a medical device and does not diagnose, treat, cure, or prevent any medical condition. Talk to a doctor about any health concern.');
  });

  it.each(['app/portrait/[id].tsx', 'app/report/[id].tsx', 'app/settings.tsx', 'app/how.tsx'])('appears on %s', (file) => {
    expect(readFileSync(join(__dirname, '../src', file), 'utf8')).toMatch(/\{DISCLAIMER\}/);
  });

  it('matches the store listing', () => {
    expect(readFileSync(join(__dirname, '../launch/APP-STORE-LISTING.md'), 'utf8')).toContain(DISCLAIMER);
  });
});
