import type { BankAccountInput } from '../models/BankAccountInput';
import type { PeriodResult } from '../models/BankAccount';
import type { ExpandedCashFlow } from '../models/CashFlow';

export interface BalanceAdjustments {
  [periodIndex: number]: number;
}

export interface PeriodScheduleEntry {
  label: string;
  startDate: string;
  endDate: string;
}

export type PeriodCashFlows = { [periodIndex: number]: ExpandedCashFlow[] };

export interface IInterestStrategy {
  calculate(input: BankAccountInput, adjustments?: BalanceAdjustments, schedule?: PeriodScheduleEntry[], periodCashFlows?: PeriodCashFlows): PeriodResult[];
}
