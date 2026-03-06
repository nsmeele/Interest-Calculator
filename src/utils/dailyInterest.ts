import type { ExpandedCashFlow } from '../models/CashFlow';
import { DayCountConvention } from '../enums/DayCountConvention';
import { yearFraction } from './dayCount';

export interface DailyInterestResult {
  interestEarned: number;
  totalDeposited: number;
  endBalance: number;
}

export function calculateDailyInterest(
  periodStart: string,
  periodEnd: string,
  startBalance: number,
  cashFlows: ExpandedCashFlow[],
  annualRate: number,
  dayCount: DayCountConvention = DayCountConvention.ACT_ACT,
): DailyInterestResult {
  const rate = annualRate / 100;
  const sorted = [...cashFlows].sort((a, b) => a.date.localeCompare(b.date));

  let balance = startBalance;
  let interestEarned = 0;
  let totalDeposited = 0;
  let segmentStart = periodStart;

  for (const cf of sorted) {
    if (cf.date < periodStart || cf.date >= periodEnd) continue;

    interestEarned += balance * rate * yearFraction(segmentStart, cf.date, dayCount);

    const clamped = Math.max(-balance, cf.amount);
    balance = Math.max(0, balance + clamped);
    totalDeposited += clamped;
    segmentStart = cf.date;
  }

  interestEarned += balance * rate * yearFraction(segmentStart, periodEnd, dayCount);

  return { interestEarned, totalDeposited, endBalance: balance };
}
