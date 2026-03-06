import type { RateChange } from '../models/RateChange';

export function getRateForDate(rateChanges: RateChange[], baseRate: number, date: string): number {
  let rate = baseRate;
  const sorted = [...rateChanges].sort((a, b) => a.date.localeCompare(b.date));

  for (const rc of sorted) {
    if (rc.date <= date) {
      rate = rc.annualInterestRate;
    } else {
      break;
    }
  }

  return rate;
}
