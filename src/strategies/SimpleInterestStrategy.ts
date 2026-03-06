import type { IInterestStrategy, BalanceAdjustments } from '../interfaces/IInterestStrategy';
import type { InterestCalculationInput } from '../models/InterestCalculationInput';
import type { PeriodResult } from '../models/InterestCalculationResult';
import { PayoutInterval, getPeriodsPerYear } from '../enums/PayoutInterval';

export class SimpleInterestStrategy implements IInterestStrategy {
  calculate(input: InterestCalculationInput, adjustments: BalanceAdjustments = {}): PeriodResult[] {
    if (input.interval === PayoutInterval.AtMaturity && !hasAdjustments(adjustments)) {
      const durationYears = input.durationMonths / 12;
      const interestEarned = input.startAmount * (input.annualInterestRate / 100) * durationYears;

      return [{
        period: 1,
        periodLabel: 'Einde looptijd',
        startBalance: input.startAmount,
        interestEarned,
        disbursed: interestEarned,
        endBalance: input.startAmount,
        deposited: 0,
      }];
    }

    const periodsPerYear = input.interval === PayoutInterval.AtMaturity ? 12 : getPeriodsPerYear(input.interval);
    const interestFraction = input.annualInterestRate / 100 / periodsPerYear;
    const totalPeriods = Math.floor(input.durationMonths / 12 * periodsPerYear);
    const periods: PeriodResult[] = [];

    let currentPrincipal = input.startAmount;

    for (let i = 1; i <= totalPeriods; i++) {
      const adjustment = adjustments[i] ?? 0;
      const deposited = Math.max(-currentPrincipal, adjustment);
      currentPrincipal = Math.max(0, currentPrincipal + deposited);

      const interestEarned = currentPrincipal * interestFraction;

      periods.push({
        period: i,
        periodLabel: `Periode ${i}`,
        startBalance: currentPrincipal,
        interestEarned,
        disbursed: interestEarned,
        endBalance: currentPrincipal,
        deposited,
      });
    }

    return periods;
  }
}

function hasAdjustments(adj: BalanceAdjustments): boolean {
  return Object.keys(adj).length > 0;
}
