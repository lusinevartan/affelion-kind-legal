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

describe('legal links', () => {
  it('point at the affelion.com pages named in the listing', () => {
    const links = readFileSync(join(__dirname, '../src/services/links.ts'), 'utf8');
    expect(links).toContain("'https://www.affelion.com/aura'");
    const listing = readFileSync(join(__dirname, '../launch/APP-STORE-LISTING.md'), 'utf8');
    expect(listing).toContain('https://www.affelion.com/aura/privacy');
    expect(listing).toContain('https://www.affelion.com/aura/terms');
  });
});
