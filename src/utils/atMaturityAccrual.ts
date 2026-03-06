import type { PeriodScheduleEntry } from '../interfaces/IInterestStrategy';
import type { PeriodResult } from '../models/BankAccount';
import type { InterestType } from '../enums/InterestType';
import { InterestType as IT } from '../enums/InterestType';
import { daysBetween } from './date';

export function calculateAtMaturityAccrual(
  startAmount: number,
  annualRate: number,
  interestType: InterestType,
  schedule: PeriodScheduleEntry[],
): PeriodResult[] {
  const rate = annualRate / 100;
  const dailySimple = rate / 365;
  const periods: PeriodResult[] = [];
  let totalInterestAccrued = 0;
  let daysSoFar = 0;

  for (let i = 0; i < schedule.length; i++) {
    const entry = schedule[i];
    const periodDays = daysBetween(entry.startDate, entry.endDate);
    let interestEarned: number;
    let balanceBefore: number;
    let balanceAfter: number;

    if (interestType === IT.Compound) {
      balanceBefore = startAmount * Math.pow(1 + rate, daysSoFar / 365);
      daysSoFar += periodDays;
      balanceAfter = startAmount * Math.pow(1 + rate, daysSoFar / 365);
      interestEarned = balanceAfter - balanceBefore;
    } else {
      balanceBefore = startAmount;
      balanceAfter = startAmount;
      interestEarned = startAmount * dailySimple * periodDays;
      daysSoFar += periodDays;
    }

    totalInterestAccrued += interestEarned;
    const isLast = i === schedule.length - 1;

    periods.push({
      period: i + 1,
      periodLabel: isLast ? 'Einde looptijd' : entry.label,
      startBalance: balanceBefore,
      interestEarned,
      disbursed: isLast ? totalInterestAccrued : 0,
      endBalance: balanceAfter,
      deposited: 0,
      endDate: entry.endDate,
    });
  }

  return periods;
}
