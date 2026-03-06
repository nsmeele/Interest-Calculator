import { describe, it, expect } from 'vitest';
import { buildPortfolioChartData } from '../utils/interest';
import { BankAccount } from '../models/BankAccount';
import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import { addMonthsToISO } from '../utils/date';
import type { PeriodResult } from '../models/BankAccount';

function makeResult(overrides: {
  startAmount?: number;
  annualInterestRate?: number;
  durationMonths?: number;
  interval?: PayoutInterval;
  startDate?: string;
  periods?: PeriodResult[];
} = {}): BankAccount {
  const durationMonths = overrides.durationMonths ?? 12;
  const startDate = overrides.startDate;
  const periods = overrides.periods ?? Array.from({ length: durationMonths }, (_, i) => ({
    period: i + 1,
    periodLabel: `Periode ${i + 1}`,
    startBalance: 10000,
    interestEarned: 50,
    disbursed: 50,
    endBalance: 10000,
    deposited: 0,
    endDate: startDate ? addMonthsToISO(startDate, i + 1) : undefined,
  }));

  return new BankAccount(
    overrides.startAmount ?? 10000,
    overrides.annualInterestRate ?? 6,
    durationMonths,
    overrides.interval ?? PayoutInterval.Monthly,
    InterestType.Simple,
    overrides.startDate,
    periods,
  );
}

describe('interestPerMonth', () => {
  it('returns current period interest for active account', () => {
    const today = new Date();
    const startDate = `${today.getFullYear()}-01-01`;
    const periods = Array.from({ length: 12 }, (_, i) => {
      const endMonth = i + 2 > 12 ? 1 : i + 2;
      const endYear = i + 2 > 12 ? today.getFullYear() + 1 : today.getFullYear();
      return {
        period: i + 1,
        periodLabel: `Periode ${i + 1}`,
        startBalance: 10000,
        interestEarned: 50,
        disbursed: 50,
        endBalance: 10000,
        deposited: 0,
        endDate: `${endYear}-${String(endMonth).padStart(2, '0')}-01`,
      };
    });
    const result = makeResult({ startDate, periods });
    // Should return the interest of the period covering today
    expect(result.interestThisMonth).toBe(50);
  });

  it('returns 0 for expired account', () => {
    const periods = [{
      period: 1, periodLabel: 'Periode 1', startBalance: 10000,
      interestEarned: 50, disbursed: 50, endBalance: 10000, deposited: 0,
      endDate: '2020-02-01',
    }];
    const result = makeResult({ startDate: '2020-01-01', durationMonths: 1, periods });
    expect(result.interestThisMonth).toBe(0);
  });

  it('returns 0 for 0 duration', () => {
    const result = makeResult({ durationMonths: 0, periods: [] });
    expect(result.interestThisMonth).toBe(0);
  });
});

describe('buildPortfolioChartData', () => {
  it('returns empty for items without startDate', () => {
    const result = makeResult({ startDate: undefined });
    expect(buildPortfolioChartData([result])).toEqual([]);
  });

  it('returns one data point per month for a monthly result', () => {
    const result = makeResult({ startDate: '2025-01-01', durationMonths: 6, periods: Array.from({ length: 6 }, (_, i) => ({
      period: i + 1,
      periodLabel: `Periode ${i + 1}`,
      startBalance: 10000,
      interestEarned: 50,
      disbursed: 50,
      endBalance: 10000,
      deposited: 0,
      endDate: addMonthsToISO('2025-01-01', i + 1),
    })) });
    const data = buildPortfolioChartData([result]);
    expect(data).toHaveLength(6);
    expect(data[0].monthKey).toBe('2025-01');
    expect(data[5].monthKey).toBe('2025-06');
  });

  it('combines multiple items on the same months', () => {
    const a = makeResult({ startDate: '2025-01-01', durationMonths: 3, periods: Array.from({ length: 3 }, (_, i) => ({
      period: i + 1, periodLabel: '', startBalance: 10000, interestEarned: 100, disbursed: 100, endBalance: 10000, deposited: 0,
      endDate: addMonthsToISO('2025-01-01', i + 1),
    })) });
    const b = makeResult({ startDate: '2025-01-01', durationMonths: 3, periods: Array.from({ length: 3 }, (_, i) => ({
      period: i + 1, periodLabel: '', startBalance: 5000, interestEarned: 25, disbursed: 25, endBalance: 5000, deposited: 0,
      endDate: addMonthsToISO('2025-01-01', i + 1),
    })) });
    const data = buildPortfolioChartData([a, b]);
    expect(data).toHaveLength(3);
    expect(data[0].interest).toBeCloseTo(125, 2);
  });

  it('fills gaps between non-overlapping items', () => {
    const a = makeResult({ startDate: '2025-01-01', durationMonths: 2, periods: Array.from({ length: 2 }, (_, i) => ({
      period: i + 1, periodLabel: '', startBalance: 10000, interestEarned: 50, disbursed: 50, endBalance: 10000, deposited: 0,
      endDate: addMonthsToISO('2025-01-01', i + 1),
    })) });
    const b = makeResult({ startDate: '2025-05-01', durationMonths: 2, periods: Array.from({ length: 2 }, (_, i) => ({
      period: i + 1, periodLabel: '', startBalance: 10000, interestEarned: 50, disbursed: 50, endBalance: 10000, deposited: 0,
      endDate: addMonthsToISO('2025-05-01', i + 1),
    })) });
    const data = buildPortfolioChartData([a, b]);
    expect(data).toHaveLength(6);
    expect(data[2].interest).toBe(0); // March gap
    expect(data[3].interest).toBe(0); // April gap
  });

  it('labels use Dutch month abbreviations', () => {
    const result = makeResult({ startDate: '2025-01-01', durationMonths: 1, periods: [{
      period: 1, periodLabel: '', startBalance: 10000, interestEarned: 50, disbursed: 50, endBalance: 10000, deposited: 0,
      endDate: '2025-02-01',
    }] });
    const data = buildPortfolioChartData([result]);
    expect(data[0].label).toContain("'25");
  });
});
