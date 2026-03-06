import type { InterestCalculationInput } from '../models/InterestCalculationInput';
import type { PeriodResult } from '../models/InterestCalculationResult';

export interface BalanceAdjustments {
  [periodIndex: number]: number;
}

export interface IInterestStrategy {
  calculate(input: InterestCalculationInput, adjustments?: BalanceAdjustments): PeriodResult[];
}
