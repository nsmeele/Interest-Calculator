import type { BalanceAdjustments, PeriodScheduleEntry, PeriodCashFlows } from '../interfaces/IInterestStrategy';
import type { BankAccountInput } from '../models/BankAccountInput';
import type { PeriodResult } from '../models/BankAccount';
import { PayoutInterval, getPeriodsPerYear } from '../enums/PayoutInterval';
import { addMonthsToISO } from './date';
import { calculateDailyInterest } from './dailyInterest';
import { yearFraction } from './dayCount';

export function hasAdjustments(adj: BalanceAdjustments): boolean {
  return Object.keys(adj).length > 0;
}

export function calculateAtMaturityNoSchedule(input: BankAccountInput, compound: boolean): PeriodResult[] {
  const rate = input.annualInterestRate / 100;
  const periods: PeriodResult[] = [];
  let totalInterestAccrued = 0;

  for (let i = 1; i <= input.durationMonths; i++) {
    let startBalance: number;
    let endBalance: number;
    let interestEarned: number;

    if (compound) {
      startBalance = input.startAmount * Math.pow(1 + rate, (i - 1) / 12);
      endBalance = input.startAmount * Math.pow(1 + rate, i / 12);
      interestEarned = endBalance - startBalance;
    } else {
      startBalance = input.startAmount;
      endBalance = input.startAmount;
      interestEarned = input.startAmount * rate / 12;
    }

    totalInterestAccrued += interestEarned;
    const isLast = i === input.durationMonths;

    periods.push({
      period: i,
      periodLabel: isLast ? 'Einde looptijd' : `Maand ${i}`,
      startBalance,
      interestEarned,
      disbursed: isLast ? totalInterestAccrued : 0,
      endBalance,
      deposited: 0,
      endDate: input.startDate ? addMonthsToISO(input.startDate, i) : undefined,
    });
  }

  return periods;
}

export function calculatePeriods(
  input: BankAccountInput,
  adjustments: BalanceAdjustments,
  periodCashFlows: PeriodCashFlows | undefined,
  compound: boolean,
): PeriodResult[] {
  const isAtMaturity = input.interval === PayoutInterval.AtMaturity;
  const periodsPerYear = isAtMaturity ? 12 : getPeriodsPerYear(input.interval);
  const monthsPerPeriod = 12 / periodsPerYear;
  const totalPeriods = Math.floor(input.durationMonths / 12 * periodsPerYear);
  const rate = input.annualInterestRate / 100;
  const periods: PeriodResult[] = [];

  let balance = input.startAmount;

  for (let i = 1; i <= totalPeriods; i++) {
    const cashFlowsForPeriod = periodCashFlows?.[i];
    const periodStartDate = input.startDate ? addMonthsToISO(input.startDate, (i - 1) * monthsPerPeriod) : undefined;
    const periodEndDate = input.startDate ? addMonthsToISO(input.startDate, i * monthsPerPeriod) : undefined;

    const hasRateChanges = input.rateChanges.length > 0;

    if ((cashFlowsForPeriod?.length || hasRateChanges) && periodStartDate && periodEndDate) {
      const result = calculateDailyInterest(periodStartDate, periodEndDate, balance, cashFlowsForPeriod ?? [], input.annualInterestRate, input.dayCount, input.rateChanges);
      const endBalance = compound ? result.endBalance + result.interestEarned : result.endBalance;

      periods.push({
        period: i,
        periodLabel: `Periode ${i}`,
        startBalance: balance,
        interestEarned: result.interestEarned,
        disbursed: result.interestEarned,
        endBalance,
        deposited: result.totalDeposited,
        endDate: periodEndDate,
      });

      balance = endBalance;
    } else {
      const adjustment = adjustments[i] ?? 0;
      const deposited = Math.max(-balance, adjustment);
      balance = Math.max(0, balance + deposited);

      const interestFraction = periodStartDate && periodEndDate
        ? yearFraction(periodStartDate, periodEndDate, input.dayCount)
        : 1 / periodsPerYear;
      const interestEarned = balance * rate * interestFraction;
      const endBalance = compound ? balance + interestEarned : balance;

      periods.push({
        period: i,
        periodLabel: `Periode ${i}`,
        startBalance: balance,
        interestEarned,
        disbursed: interestEarned,
        endBalance,
        deposited,
        endDate: periodEndDate,
      });

      if (compound) balance = endBalance;
    }
  }

  if (isAtMaturity) deferDisbursement(periods);
  return periods;
}

function deferDisbursement(periods: PeriodResult[]): void {
  let total = 0;
  for (const p of periods) {
    total += p.interestEarned;
    p.disbursed = 0;
  }
  if (periods.length > 0) {
    periods[periods.length - 1].disbursed = total;
    periods[periods.length - 1].periodLabel = 'Einde looptijd';
  }
}

export function calculatePeriodsWithSchedule(
  input: BankAccountInput,
  adjustments: BalanceAdjustments,
  schedule: PeriodScheduleEntry[],
  periodCashFlows: PeriodCashFlows | undefined,
  compound: boolean,
): PeriodResult[] {
  const isAtMaturity = input.interval === PayoutInterval.AtMaturity;
  const rate = input.annualInterestRate / 100;
  const periods: PeriodResult[] = [];
  let balance = input.startAmount;

  for (let i = 0; i < schedule.length; i++) {
    const entry = schedule[i];
    const periodIndex = i + 1;
    const cashFlowsForPeriod = periodCashFlows?.[periodIndex];

    const hasRateChanges = input.rateChanges.length > 0;

    if (cashFlowsForPeriod?.length || hasRateChanges) {
      const result = calculateDailyInterest(entry.startDate, entry.endDate, balance, cashFlowsForPeriod ?? [], input.annualInterestRate, input.dayCount, input.rateChanges);
      const endBalance = compound ? result.endBalance + result.interestEarned : result.endBalance;

      periods.push({
        period: periodIndex,
        periodLabel: entry.label,
        startBalance: balance,
        interestEarned: result.interestEarned,
        disbursed: result.interestEarned,
        endBalance,
        deposited: result.totalDeposited,
        endDate: entry.endDate,
      });

      balance = endBalance;
    } else {
      const adjustment = adjustments[periodIndex] ?? 0;
      const deposited = Math.max(-balance, adjustment);
      balance = Math.max(0, balance + deposited);

      const periodFraction = yearFraction(entry.startDate, entry.endDate, input.dayCount);
      const interestEarned = balance * rate * periodFraction;
      const endBalance = compound ? balance + interestEarned : balance;

      periods.push({
        period: periodIndex,
        periodLabel: entry.label,
        startBalance: balance,
        interestEarned,
        disbursed: interestEarned,
        endBalance,
        deposited,
        endDate: entry.endDate,
      });

      if (compound) balance = endBalance;
    }
  }

  if (isAtMaturity) deferDisbursement(periods);
  return periods;
}
