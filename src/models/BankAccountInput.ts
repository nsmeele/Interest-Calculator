import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import { DayCountConvention } from '../enums/DayCountConvention';
import type { CashFlow } from './CashFlow';

export class BankAccountInput {
  constructor(
    public readonly startAmount: number,
    public readonly annualInterestRate: number,
    public readonly durationMonths: number,
    public readonly interval: PayoutInterval,
    public readonly interestType: InterestType,
    public readonly startDate?: string,
    public readonly cashFlows: CashFlow[] = [],
    public readonly isOngoing: boolean = false,
    public readonly dayCount: DayCountConvention = DayCountConvention.ACT_ACT,
  ) {}

  get durationYears(): number {
    return this.durationMonths / 12;
  }

  get label(): string {
    return `€${this.startAmount.toLocaleString('nl-NL')} @ ${this.annualInterestRate}%`;
  }
}
