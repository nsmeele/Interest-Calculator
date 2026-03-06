import type { IInterestCalculator } from '../interfaces/IInterestCalculator';
import type { InterestCalculationInput } from '../models/InterestCalculationInput';
import type { BalanceAdjustments } from '../interfaces/IInterestStrategy';
import { InterestCalculationResult } from '../models/InterestCalculationResult';
import { InterestStrategyFactory } from '../factories/InterestStrategyFactory';
import { PayoutInterval, getPeriodsPerYear } from '../enums/PayoutInterval';
import { expandCashFlows } from '../models/CashFlow';
import { addMonthsToISO, monthsBetween } from '../utils/date';

export class InterestCalculator implements IInterestCalculator {
  calculate(input: InterestCalculationInput): InterestCalculationResult {
    const strategy = InterestStrategyFactory.create(input.interestType);
    const adjustments = this.buildAdjustments(input);
    const periods = strategy.calculate(input, adjustments);

    return new InterestCalculationResult(
      input.startAmount,
      input.annualInterestRate,
      input.durationMonths,
      input.interval,
      input.interestType,
      input.startDate,
      periods,
      input.cashFlows,
      input.isOngoing,
    );
  }

  private buildAdjustments(input: InterestCalculationInput): BalanceAdjustments {
    if (input.cashFlows.length === 0 || !input.startDate) return {};

    const endISO = addMonthsToISO(input.startDate, input.durationMonths);

    const expanded = expandCashFlows(input.cashFlows, endISO);
    const hasCashFlows = expanded.length > 0;
    const periodsPerYear = (input.interval === PayoutInterval.AtMaturity && hasCashFlows) ? 12 : getPeriodsPerYear(input.interval);
    const monthsPerPeriod = 12 / periodsPerYear;

    const adjustments: BalanceAdjustments = {};

    for (const cf of expanded) {
      const monthOffset = monthsBetween(input.startDate, cf.date);

      if (monthOffset < 0 || monthOffset >= input.durationMonths) continue;

      const periodIndex = Math.floor(monthOffset / monthsPerPeriod) + 1;
      adjustments[periodIndex] = (adjustments[periodIndex] ?? 0) + cf.amount;
    }

    return adjustments;
  }
}
