import { trialAdjective, trialFromIntro, trialLength, trialTerms } from '../src/services/trial';

describe('free trials reported by the store', () => {
  it('reads a free introductory offer as a trial', () => {
    expect(trialFromIntro({ price: 0, periodUnit: 'DAY', periodNumberOfUnits: 7, cycles: 1 })).toEqual({ count: 7, unit: 'day' });
    expect(trialFromIntro({ price: 0, periodUnit: 'MONTH', periodNumberOfUnits: 1 })).toEqual({ count: 1, unit: 'month' });
  });

  it('says one week the same way however the store reports it', () => {
    expect(trialFromIntro({ price: 0, periodUnit: 'WEEK', periodNumberOfUnits: 1, cycles: 1 })).toEqual({ count: 7, unit: 'day' });
    expect(trialFromIntro({ price: 0, periodUnit: 'WEEK', periodNumberOfUnits: 2, cycles: 1 })).toEqual({ count: 2, unit: 'week' });
  });

  it('never calls a paid discount a free trial', () => {
    expect(trialFromIntro({ price: 0.99, periodUnit: 'MONTH', periodNumberOfUnits: 1, cycles: 3 })).toBeNull();
  });

  it('shows nothing when there is no offer or it is malformed', () => {
    expect(trialFromIntro(null)).toBeNull();
    expect(trialFromIntro(undefined)).toBeNull();
    expect(trialFromIntro({ price: 0, periodUnit: 'FORTNIGHT', periodNumberOfUnits: 1 })).toBeNull();
    expect(trialFromIntro({ price: 0, periodUnit: 'DAY', periodNumberOfUnits: 0 })).toBeNull();
  });

  it('states what is free and what is charged after', () => {
    const t = { count: 7, unit: 'day' as const };
    expect(trialLength(t)).toBe('7 days');
    expect(trialLength({ count: 1, unit: 'month' })).toBe('1 month');
    expect(trialAdjective(t)).toBe('7-day');
    expect(trialTerms(t, '$69.99', 'per year')).toBe('7 days free, then $69.99 per year.');
  });
});
