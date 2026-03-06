import { describe, it, expect } from 'vitest';
import { itemStatusForMonth } from '../utils/portfolioStatus';
import { BankAccount } from '../models/BankAccount';
import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import { addMonthsToISO } from '../utils/date';
import type { PeriodResult } from '../models/BankAccount';

function makePeriods(startDate: string, count: number): PeriodResult[] {
  return Array.from({ length: count }, (_, i) => ({
    period: i + 1,
    periodLabel: `Periode ${i + 1}`,
    startBalance: 10000,
    interestEarned: 50,
    disbursed: 50,
    endBalance: 10000,
    deposited: 0,
    endDate: addMonthsToISO(startDate, i + 1),
  }));
}

function makeAccount(opts: {
  startDate: string;
  durationMonths: number;
  isOngoing?: boolean;
  periods?: PeriodResult[];
}): BankAccount {
  const periods = opts.periods ?? makePeriods(opts.startDate, opts.durationMonths);
  return new BankAccount(
    10000, 6, opts.durationMonths,
    PayoutInterval.Monthly, InterestType.Simple,
    opts.startDate, periods, [], opts.isOngoing ?? false,
  );
}

describe('itemStatusForMonth', () => {
  it('returns upcoming before start month', () => {
    const account = makeAccount({ startDate: '2026-03-01', durationMonths: 6 });
    expect(itemStatusForMonth(account, '2026-02')).toBe('upcoming');
  });

  it('returns active from start month onwards', () => {
    const account = makeAccount({ startDate: '2026-01-01', durationMonths: 6 });
    expect(itemStatusForMonth(account, '2026-01')).toBe('active');
  });

  it('returns active for quarterly account in months before first payout', () => {
    // Quarterly starting Jan 10 → first payout April 1
    const account = makeAccount({
      startDate: '2026-01-10',
      durationMonths: 3,
      periods: [{
        period: 1, periodLabel: 'Periode 1', startBalance: 10000,
        interestEarned: 150, disbursed: 150, endBalance: 10000, deposited: 0,
        endDate: '2026-04-01',
      }],
    });

    expect(itemStatusForMonth(account, '2025-12')).toBe('upcoming');
    expect(itemStatusForMonth(account, '2026-01')).toBe('active');
    expect(itemStatusForMonth(account, '2026-02')).toBe('active');
    expect(itemStatusForMonth(account, '2026-03')).toBe('active');
  });

  it('returns active during the account lifetime', () => {
    const account = makeAccount({ startDate: '2026-01-01', durationMonths: 6 });
    expect(itemStatusForMonth(account, '2026-04')).toBe('active');
  });

  it('returns active in the last payout month (not expired)', () => {
    // 6 months from Jan 1 → last period ends 2026-07-01 → last payout month = "2026-07"
    const account = makeAccount({ startDate: '2026-01-01', durationMonths: 6 });
    expect(itemStatusForMonth(account, '2026-07')).toBe('active');
  });

  it('returns expired after the last payout month', () => {
    const account = makeAccount({ startDate: '2026-01-01', durationMonths: 6 });
    // Last payout month = "2026-07", August should be expired
    expect(itemStatusForMonth(account, '2026-08')).toBe('expired');
  });

  it('never returns expired for ongoing accounts', () => {
    const account = makeAccount({ startDate: '2026-01-01', durationMonths: 6, isOngoing: true });
    expect(itemStatusForMonth(account, '2026-12')).toBe('active');
    expect(itemStatusForMonth(account, '2027-06')).toBe('active');
  });

  it('account starting mid-month is active from start month', () => {
    // Start 2026-03-09, monthly → first period ends 2026-04-01
    const account = makeAccount({
      startDate: '2026-03-09',
      durationMonths: 3,
      periods: [
        { period: 1, periodLabel: 'Periode 1', startBalance: 25000, interestEarned: 40, disbursed: 40, endBalance: 25000, deposited: 0, endDate: '2026-04-01' },
        { period: 2, periodLabel: 'Periode 2', startBalance: 25000, interestEarned: 40, disbursed: 40, endBalance: 25000, deposited: 0, endDate: '2026-05-01' },
        { period: 3, periodLabel: 'Periode 3', startBalance: 25000, interestEarned: 40, disbursed: 40, endBalance: 25000, deposited: 0, endDate: '2026-06-01' },
      ],
    });

    expect(itemStatusForMonth(account, '2026-02')).toBe('upcoming');
    expect(itemStatusForMonth(account, '2026-03')).toBe('active');
    expect(itemStatusForMonth(account, '2026-04')).toBe('active');
    expect(itemStatusForMonth(account, '2026-05')).toBe('active');
    expect(itemStatusForMonth(account, '2026-06')).toBe('active');
    expect(itemStatusForMonth(account, '2026-07')).toBe('expired');
  });

  it('returns active for account with no periods', () => {
    const account = makeAccount({ startDate: '2026-01-01', durationMonths: 0, periods: [] });
    expect(itemStatusForMonth(account, '2026-03')).toBe('active');
  });
});
