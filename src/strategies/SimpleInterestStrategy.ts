import type { IInterestStrategy, BalanceAdjustments, PeriodScheduleEntry, PeriodCashFlows } from '../interfaces/IInterestStrategy';
import type { BankAccountInput } from '../models/BankAccountInput';
import type { PeriodResult } from '../models/BankAccount';
import { PayoutInterval } from '../enums/PayoutInterval';
import { calculateAtMaturityAccrual } from '../utils/atMaturityAccrual';
import { hasAdjustments, calculateAtMaturityNoSchedule, calculatePeriods, calculatePeriodsWithSchedule } from '../utils/periodCalculation';

export class SimpleInterestStrategy implements IInterestStrategy {
  calculate(input: BankAccountInput, adjustments: BalanceAdjustments = {}, schedule?: PeriodScheduleEntry[], periodCashFlows?: PeriodCashFlows): PeriodResult[] {
    if (schedule && input.interval === PayoutInterval.AtMaturity && !hasAdjustments(adjustments)) {
      return calculateAtMaturityAccrual(input.startAmount, input.annualInterestRate, input.interestType, schedule);
    }

    if (input.interval === PayoutInterval.AtMaturity && !hasAdjustments(adjustments)) {
      return calculateAtMaturityNoSchedule(input, false);
    }

    if (schedule) {
      return calculatePeriodsWithSchedule(input, adjustments, schedule, periodCashFlows, false);
    }

    return calculatePeriods(input, adjustments, periodCashFlows, false);
  }
}
