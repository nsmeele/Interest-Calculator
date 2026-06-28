import type { BankAccount } from '../models/BankAccount';
import { expandCashFlows } from '../models/CashFlow';
import { calculateDailyInterest } from './dailyInterest';

export function projectedBalanceAt(account: BankAccount, targetDate: string): number {
  if (!account.startDate || account.periods.length === 0) return account.startAmount;

  const allCashFlows = expandCashFlows(account.cashFlows, targetDate);

  for (let i = 0; i < account.periods.length; i++) {
    const periodStart = i === 0 ? account.startDate : account.periods[i - 1].endDate!;
    const periodEnd = account.periods[i].endDate;

    if (!periodEnd) continue;
    if (targetDate < periodStart) {
      return i === 0 ? account.startAmount : account.periods[i - 1].endBalance;
    }

    if (targetDate >= periodStart && targetDate < periodEnd) {
      const periodCashFlows = allCashFlows.filter((cf) => cf.date >= periodStart && cf.date < targetDate);
      const { endBalance } = calculateDailyInterest(
        periodStart, targetDate, account.periods[i].startBalance,
        periodCashFlows, account.annualInterestRate, account.dayCount, account.rateChanges,
      );
      return endBalance;
    }
  }

  return account.periods[account.periods.length - 1].endBalance;
}
