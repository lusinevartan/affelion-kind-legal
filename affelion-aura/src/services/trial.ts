/**
 * Free trials. A trial is set up in the store on a product (an introductory offer at no charge);
 * the app only reports what the store offers this person. No trial in the store, no trial shown.
 */
export interface Trial {
  count: number;
  unit: 'day' | 'week' | 'month' | 'year';
}

/** The shape the store reports for an introductory offer. */
export interface IntroOffer {
  price: number;
  periodUnit: string;
  periodNumberOfUnits: number;
  cycles?: number;
}

const UNITS: Record<string, Trial['unit']> = { DAY: 'day', WEEK: 'week', MONTH: 'month', YEAR: 'year' };

/** A free trial, or null when the offer is a paid discount or is malformed. */
export function trialFromIntro(intro: IntroOffer | null | undefined): Trial | null {
  if (!intro || intro.price !== 0) return null;
  const unit = UNITS[String(intro.periodUnit).toUpperCase()];
  const count = Math.round(intro.periodNumberOfUnits * Math.max(1, intro.cycles ?? 1));
  if (!unit || !Number.isFinite(count) || count < 1) return null;
  // Stores report one week as either "1 WEEK" or "7 DAY"; say it one way.
  if (unit === 'week' && count === 1) return { count: 7, unit: 'day' };
  return { count, unit };
}

/** "7 days", "1 month" */
export function trialLength(t: Trial): string {
  return `${t.count} ${t.unit}${t.count === 1 ? '' : 's'}`;
}

/** The buy button while a trial is offered: "Start my free week" for the usual seven days. */
export function trialButton(t: Trial): string {
  return (t.unit === 'day' && t.count === 7) || (t.unit === 'week' && t.count === 1) ? 'Start my free week' : `Start ${trialAdjective(t)} free trial`;
}

/** "7-day", "1-month": for "Start 7-day free trial". */
export function trialAdjective(t: Trial): string {
  return `${t.count}-${t.unit}`;
}

/** The sentence a person must be able to read before starting: what is free, then what is charged. */
export function trialTerms(t: Trial, price: string, period: string): string {
  return `${trialLength(t)} free, then ${price} ${period}. Cancel anytime in Settings.`;
}
