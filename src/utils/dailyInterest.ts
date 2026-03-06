import type { ExpandedCashFlow } from '../models/CashFlow';
import { daysBetween } from './date';

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
): DailyInterestResult {
  const dailyRate = annualRate / 100 / 365;
  const sorted = [...cashFlows].sort((a, b) => a.date.localeCompare(b.date));

  let balance = startBalance;
  let interestEarned = 0;
  let totalDeposited = 0;
  let segmentStart = periodStart;

  for (const cf of sorted) {
    if (cf.date < periodStart || cf.date >= periodEnd) continue;

    const days = daysBetween(segmentStart, cf.date);
    interestEarned += balance * dailyRate * days;

    const clamped = Math.max(-balance, cf.amount);
    balance = Math.max(0, balance + clamped);
    totalDeposited += clamped;
    segmentStart = cf.date;
  }

  const remainingDays = daysBetween(segmentStart, periodEnd);
  interestEarned += balance * dailyRate * remainingDays;

  return { interestEarned, totalDeposited, endBalance: balance };
}
