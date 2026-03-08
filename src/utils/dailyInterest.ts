import type { ExpandedCashFlow } from '../models/CashFlow';
import type { RateChange } from '../models/RateChange';
import { DayCountConvention } from '../enums/DayCountConvention';
import { yearFraction } from './dayCount';
import { getRateForDate } from './rateChange';
import { applyWithdrawal } from './applyWithdrawal';

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
  dayCount: DayCountConvention = DayCountConvention.NOM_12,
  rateChanges: RateChange[] = [],
  stoppedSources?: Set<string>,
): DailyInterestResult {
  // Build unified boundary dates from cash flows + rate changes
  const boundarySet = new Set<string>();
  for (const cf of cashFlows) {
    if (cf.date >= periodStart && cf.date < periodEnd) boundarySet.add(cf.date);
  }
  // Rate changes on periodStart don't need a boundary — getRateForDate handles them via <= comparison
  for (const rc of rateChanges) {
    if (rc.date > periodStart && rc.date < periodEnd) boundarySet.add(rc.date);
  }
  const boundaries = [...boundarySet].sort();

  // Index cash flows by date for quick lookup
  const cfByDate = new Map<string, ExpandedCashFlow[]>();
  for (const cf of cashFlows) {
    if (cf.date >= periodStart && cf.date < periodEnd) {
      const list = cfByDate.get(cf.date);
      if (list) { list.push(cf); } else { cfByDate.set(cf.date, [cf]); }
    }
  }

  let balance = startBalance;
  let interestEarned = 0;
  let totalDeposited = 0;
  let segmentStart = periodStart;
  stoppedSources ??= new Set<string>();

  for (const boundary of boundaries) {
    const rate = getRateForDate(rateChanges, annualRate, segmentStart) / 100;
    interestEarned += balance * rate * yearFraction(segmentStart, boundary, dayCount);

    // Apply any cash flows at this boundary
    const cfs = cfByDate.get(boundary);
    if (cfs) {
      for (const cf of cfs) {
        if (cf.sourceId && stoppedSources.has(cf.sourceId)) continue;

        const result = applyWithdrawal(balance, cf.amount);
        if (result.skipped && cf.sourceId) {
          stoppedSources.add(cf.sourceId);
        }
        balance = result.newBalance;
        totalDeposited += result.applied;
      }
    }

    segmentStart = boundary;
  }

  // Final segment
  const finalRate = getRateForDate(rateChanges, annualRate, segmentStart) / 100;
  interestEarned += balance * finalRate * yearFraction(segmentStart, periodEnd, dayCount);

  return { interestEarned, totalDeposited, endBalance: balance };
}
