import { describe, it, expect, vi, afterEach } from 'vitest';
import { BankAccount } from '../models/BankAccount';
import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import type { PeriodResult } from '../models/BankAccount';

function makePeriods(entries: { disbursed: number; endDate?: string }[]): PeriodResult[] {
  return entries.map((e, i) => ({
    period: i + 1,
    periodLabel: `Periode ${i + 1}`,
    startBalance: 10000,
    interestEarned: 50,
    disbursed: e.disbursed,
    endBalance: 10000,
    deposited: 0,
    endDate: e.endDate,
  }));
}

function makeAccount(periods: PeriodResult[], startDate?: string): BankAccount {
  return new BankAccount(
    10000,
    6,
    periods.length,
    PayoutInterval.Monthly,
    InterestType.Simple,
    startDate,
    periods,
  );
}

describe('BankAccount.totalDisbursed', () => {
  it('sums disbursed amounts across all periods', () => {
    const account = makeAccount(makePeriods([
      { disbursed: 50 }, { disbursed: 50 }, { disbursed: 50 },
    ]));
    expect(account.totalDisbursed).toBe(150);
  });

  it('returns 0 when no periods exist', () => {
    const account = makeAccount([]);
    expect(account.totalDisbursed).toBe(0);
  });

  it('handles periods with varying disbursed amounts', () => {
    const account = makeAccount(makePeriods([
      { disbursed: 100 }, { disbursed: 0 }, { disbursed: 200 }, { disbursed: 50 },
    ]));
    expect(account.totalDisbursed).toBe(350);
  });
});

describe('BankAccount.disbursedToDate', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('only sums periods that have ended before today', () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date('2025-04-01').getTime());
    vi.setSystemTime(new Date('2025-04-01'));

    const account = makeAccount(makePeriods([
      { disbursed: 50, endDate: '2025-02-01' },
      { disbursed: 50, endDate: '2025-03-01' },
      { disbursed: 50, endDate: '2025-04-01' },
      { disbursed: 50, endDate: '2025-05-01' },
    ]), '2025-01-01');

    expect(account.disbursedToDate).toBe(150);
  });

  it('returns 0 when all periods are in the future', () => {
    vi.setSystemTime(new Date('2025-01-01'));

    const account = makeAccount(makePeriods([
      { disbursed: 50, endDate: '2025-02-01' },
      { disbursed: 50, endDate: '2025-03-01' },
    ]), '2025-01-01');

    expect(account.disbursedToDate).toBe(0);
  });

  it('returns full total when all periods have passed', () => {
    vi.setSystemTime(new Date('2026-01-01'));

    const account = makeAccount(makePeriods([
      { disbursed: 50, endDate: '2025-02-01' },
      { disbursed: 50, endDate: '2025-03-01' },
    ]), '2025-01-01');

    expect(account.disbursedToDate).toBe(100);
  });

  it('returns 0 when periods have no endDate', () => {
    const account = makeAccount(makePeriods([
      { disbursed: 50 }, { disbursed: 50 },
    ]));

    expect(account.disbursedToDate).toBe(0);
  });
});
