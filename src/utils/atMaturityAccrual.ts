import type { PeriodScheduleEntry } from '../interfaces/IInterestStrategy';
import type { PeriodResult } from '../models/BankAccount';
import type { InterestType } from '../enums/InterestType';
import { InterestType as IT } from '../enums/InterestType';
import { DayCountConvention } from '../enums/DayCountConvention';
import { yearFraction } from './dayCount';

export function calculateAtMaturityAccrual(
  startAmount: number,
  annualRate: number,
  interestType: InterestType,
  schedule: PeriodScheduleEntry[],
  dayCount: DayCountConvention = DayCountConvention.ACT_ACT,
): PeriodResult[] {
  const rate = annualRate / 100;
  const periods: PeriodResult[] = [];
  let totalInterestAccrued = 0;
  let cumulativeFraction = 0;

  for (let i = 0; i < schedule.length; i++) {
    const entry = schedule[i];
    const periodFraction = yearFraction(entry.startDate, entry.endDate, dayCount);
    let interestEarned: number;
    let balanceBefore: number;
    let balanceAfter: number;

    if (interestType === IT.Compound) {
      balanceBefore = startAmount * Math.pow(1 + rate, cumulativeFraction);
      cumulativeFraction += periodFraction;
      balanceAfter = startAmount * Math.pow(1 + rate, cumulativeFraction);
      interestEarned = balanceAfter - balanceBefore;
    } else {
      balanceBefore = startAmount;
      balanceAfter = startAmount;
      interestEarned = startAmount * rate * periodFraction;
      cumulativeFraction += periodFraction;
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
