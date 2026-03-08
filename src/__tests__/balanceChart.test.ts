import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildBalanceData, formatPeriodLabel } from '../utils/balanceChart';
import { BankAccount } from '../models/BankAccount';
import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import type { PeriodResult } from '../models/BankAccount';

function makePeriods(
  entries: { endDate: string; endBalance?: number; interestEarned?: number }[],
): PeriodResult[] {
  return entries.map((e, i) => ({
    period: i + 1,
    periodLabel: `Periode ${i + 1}`,
    startBalance: 10000,
    interestEarned: e.interestEarned ?? 50,
    disbursed: 0,
    endBalance: e.endBalance ?? 10000,
    deposited: 0,
    endDate: e.endDate,
  }));
}

function makeAccount(
  periods: PeriodResult[],
  overrides: {
    startDate?: string | null;
    isOngoing?: boolean;
    interestType?: InterestType;
  } = {},
): BankAccount {
  return new BankAccount(
    10000, 6, periods.length,
    PayoutInterval.Monthly,
    overrides.interestType ?? InterestType.Compound,
    overrides.startDate === null ? undefined : (overrides.startDate ?? '2026-01-01'),
    periods,
    [], overrides.isOngoing ?? false,
  );
}

describe('buildBalanceData', () => {
  afterEach(() => { vi.useRealTimers(); });

  it('returns empty array when account has no startDate', () => {
    const account = makeAccount(
      makePeriods([{ endDate: '2026-02-01' }]),
      { startDate: null },
    );
    expect(buildBalanceData(account, 2026, 2026)).toEqual([]);
  });

  it('returns empty array when account has no periods', () => {
    const account = makeAccount([]);
    expect(buildBalanceData(account, 2026, 2026)).toEqual([]);
  });

  it('includes all periods within range', () => {
    const periods = makePeriods([
      { endDate: '2026-03-01' },
      { endDate: '2026-06-01' },
      { endDate: '2026-09-01' },
      { endDate: '2026-12-01' },
    ]);
    const account = makeAccount(periods);
    const data = buildBalanceData(account, 2026, 2026);
    // 1 start point + 4 periods
    expect(data).toHaveLength(5);
  });

  it('excludes periods past end year', () => {
    const periods = makePeriods([
      { endDate: '2026-06-01' },
      { endDate: '2026-12-01' },
      { endDate: '2027-06-01' },
      { endDate: '2027-12-01' },
    ]);
    const account = makeAccount(periods);
    const data = buildBalanceData(account, 2026, 2026);
    // 1 start point + 2 periods within 2026
    expect(data).toHaveLength(3);
  });

  it('includes period on exactly December 31 of end year', () => {
    const periods = makePeriods([
      { endDate: '2026-06-30' },
      { endDate: '2026-12-31' },
      { endDate: '2027-06-30' },
    ]);
    const account = makeAccount(periods);
    const data = buildBalanceData(account, 2026, 2026);
    // 1 start point + 2 periods (June 30 + Dec 31)
    expect(data).toHaveLength(3);
  });

  it('shows account started before range start year', () => {
    const periods = makePeriods([
      { endDate: '2025-06-01' },
      { endDate: '2025-12-01' },
      { endDate: '2026-06-01' },
      { endDate: '2026-12-01' },
      { endDate: '2027-06-01' },
    ]);
    const account = makeAccount(periods, { startDate: '2025-01-01' });
    const data = buildBalanceData(account, 2026, 2026);
    // 1 opening balance point + 2 periods within 2026
    expect(data).toHaveLength(3);
  });

  it('accumulates cumulativeInterest for simple interest', () => {
    const periods = makePeriods([
      { endDate: '2026-06-01', endBalance: 10000, interestEarned: 100 },
      { endDate: '2026-12-01', endBalance: 10000, interestEarned: 100 },
    ]);
    const account = makeAccount(periods, { interestType: InterestType.Simple });
    const data = buildBalanceData(account, 2026, 2026);
    expect(data[0].balance).toBe(10000);
    expect(data[1].balance).toBe(10100); // endBalance + 100
    expect(data[2].balance).toBe(10200); // endBalance + 200
  });

  it('does not add cumulativeInterest for compound interest', () => {
    const periods = makePeriods([
      { endDate: '2026-06-01', endBalance: 10100, interestEarned: 100 },
      { endDate: '2026-12-01', endBalance: 10200, interestEarned: 100 },
    ]);
    const account = makeAccount(periods, { interestType: InterestType.Compound });
    const data = buildBalanceData(account, 2026, 2026);
    expect(data[1].balance).toBe(10100);
    expect(data[2].balance).toBe(10200);
  });

  it('uses break optimization — stops at first period past end year', () => {
    const periods = makePeriods([
      { endDate: '2026-06-01' },
      { endDate: '2027-01-01' },
      { endDate: '2027-06-01' },
    ]);
    const account = makeAccount(periods);
    const data = buildBalanceData(account, 2026, 2026);
    // 1 start + 1 period (only 2026-06-01)
    expect(data).toHaveLength(2);
  });

  it('returns only start point when all periods are past end year', () => {
    const periods = makePeriods([
      { endDate: '2028-06-01' },
      { endDate: '2028-12-01' },
    ]);
    const account = makeAccount(periods);
    const data = buildBalanceData(account, 2026, 2026);
    // Only the start point
    expect(data).toHaveLength(1);
  });

  it('includes periods across multiple years with wider range', () => {
    const periods = makePeriods([
      { endDate: '2026-06-01' },
      { endDate: '2026-12-01' },
      { endDate: '2027-06-01' },
      { endDate: '2027-12-01' },
      { endDate: '2028-06-01' },
    ]);
    const account = makeAccount(periods);
    const data = buildBalanceData(account, 2026, 2028);
    // 1 start point + 5 periods (all within 2026-2028)
    expect(data).toHaveLength(6);
  });
});

describe('buildBalanceData start and end dates', () => {
  it('starts at account startDate when within range', () => {
    const periods = makePeriods([
      { endDate: '2026-04-01' },
      { endDate: '2026-07-01' },
    ]);
    const account = makeAccount(periods, { startDate: '2026-01-01' });
    const data = buildBalanceData(account, 2026, 2026);
    expect(data[0].label).toBe(formatPeriodLabel('2026-01-01'));
  });

  it('starts axis at Jan 1 with zero balance when account started mid-year', () => {
    const periods = makePeriods([
      { endDate: '2026-09-15' },
      { endDate: '2026-12-15' },
    ]);
    const account = makeAccount(periods, { startDate: '2026-06-15' });
    const data = buildBalanceData(account, 2026, 2026);
    expect(data[0].label).toBe(formatPeriodLabel('2026-01-01'));
    expect(data[0].balance).toBeNull();
    expect(data[1].label).toBe(formatPeriodLabel('2026-06-15'));
    expect(data[1].balance).toBe(10000);
  });

  it('starts at range start when account started before range', () => {
    const periods = makePeriods([
      { endDate: '2025-06-01', endBalance: 10500 },
      { endDate: '2025-12-01', endBalance: 11000 },
      { endDate: '2026-06-01', endBalance: 11500 },
    ]);
    const account = makeAccount(periods, { startDate: '2025-01-01' });
    const data = buildBalanceData(account, 2026, 2026);
    // Opening label should be Jan 1 of startYear
    expect(data[0].label).toBe(formatPeriodLabel('2026-01-01'));
  });

  it('ends at last period within end year', () => {
    const periods = makePeriods([
      { endDate: '2026-06-01' },
      { endDate: '2026-12-01' },
      { endDate: '2027-06-01' },
    ]);
    const account = makeAccount(periods);
    const data = buildBalanceData(account, 2026, 2026);
    expect(data[data.length - 1].label).toBe(formatPeriodLabel('2026-12-01'));
  });

  it('ends at Dec 31 when period falls exactly on boundary', () => {
    const periods = makePeriods([
      { endDate: '2026-06-30' },
      { endDate: '2026-12-31' },
      { endDate: '2027-06-30' },
    ]);
    const account = makeAccount(periods);
    const data = buildBalanceData(account, 2026, 2026);
    expect(data[data.length - 1].label).toBe(formatPeriodLabel('2026-12-31'));
  });

  it('ongoing account with 1J range: starts at Jan 1, ends within current year', () => {
    vi.setSystemTime(new Date('2026-03-08'));
    const periods = makePeriods([
      { endDate: '2026-06-01' },
      { endDate: '2026-12-01' },
      { endDate: '2027-06-01' },
      { endDate: '2027-12-01' },
    ]);
    const account = makeAccount(periods, { startDate: '2026-01-01', isOngoing: true });
    const data = buildBalanceData(account, 2026, 2026);
    expect(data[0].label).toBe(formatPeriodLabel('2026-01-01'));
    expect(data[data.length - 1].label).toBe(formatPeriodLabel('2026-12-01'));
  });

  it('extending range from 1J to 3J includes more periods', () => {
    const periods = makePeriods([
      { endDate: '2026-06-01' },
      { endDate: '2026-12-01' },
      { endDate: '2027-06-01' },
      { endDate: '2027-12-01' },
      { endDate: '2028-06-01' },
      { endDate: '2028-12-01' },
    ]);
    const account = makeAccount(periods);
    const data1J = buildBalanceData(account, 2026, 2026);
    const data3J = buildBalanceData(account, 2026, 2028);
    expect(data1J[data1J.length - 1].label).toBe(formatPeriodLabel('2026-12-01'));
    expect(data3J[data3J.length - 1].label).toBe(formatPeriodLabel('2028-12-01'));
    expect(data3J.length).toBeGreaterThan(data1J.length);
  });
});
