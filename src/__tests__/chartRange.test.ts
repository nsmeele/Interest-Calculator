import { describe, it, expect } from 'vitest';
import { getRangeEndYear, getDefaultRangeForAccount, isPeriodEndDateInRange } from '../utils/chartRange';
import { BankAccount } from '../models/BankAccount';
import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import type { PeriodResult } from '../models/BankAccount';

function makeAccount(overrides: {
  startDate?: string;
  durationMonths?: number;
  isOngoing?: boolean;
} = {}): BankAccount {
  const durationMonths = overrides.durationMonths ?? 12;
  return new BankAccount(
    10000, 6, durationMonths,
    PayoutInterval.Monthly, InterestType.Compound,
    overrides.startDate ?? '2026-01-01',
    [] as PeriodResult[],
    [], overrides.isOngoing ?? false,
  );
}

describe('getRangeEndYear', () => {
  it('1J from 2026 shows through 2026', () => {
    expect(getRangeEndYear(2026, 1)).toBe(2026);
  });

  it('2J from 2026 shows through 2027', () => {
    expect(getRangeEndYear(2026, 2)).toBe(2027);
  });

  it('5J from 2026 shows through 2030', () => {
    expect(getRangeEndYear(2026, 5)).toBe(2030);
  });

  it('10J from 2026 shows through 2035', () => {
    expect(getRangeEndYear(2026, 10)).toBe(2035);
  });

  it('5J from 2024 shows through 2028', () => {
    expect(getRangeEndYear(2024, 5)).toBe(2028);
  });
});

describe('getDefaultRangeForAccount', () => {
  it('returns 1 for ongoing account', () => {
    const account = makeAccount({ isOngoing: true });
    expect(getDefaultRangeForAccount(account)).toBe(1);
  });

  it('returns smallest range covering end date from account start', () => {
    // Start 2026-01-01, ends 2027-01-01 → endYear=2027 → 2J (2026+2-1=2027)
    const account = makeAccount({ durationMonths: 12 });
    expect(getDefaultRangeForAccount(account)).toBe(2);
  });

  it('returns 1J when account ends within start year', () => {
    // Start 2026-01-01, ends 2026-07-01 → endYear=2026 → 1J (2026+1-1=2026)
    const account = makeAccount({ durationMonths: 6 });
    expect(getDefaultRangeForAccount(account)).toBe(1);
  });

  it('returns 5J when account ends in 4 years from start', () => {
    // Start 2026-01-01, ends 2030-01-01 → endYear=2030 → 5J (2026+5-1=2030)
    const account = makeAccount({ durationMonths: 48 });
    expect(getDefaultRangeForAccount(account)).toBe(5);
  });

  it('uses explicit startYear when provided', () => {
    // Start 2026-01-01, ends 2030-01-01 → endYear=2030
    // With startYear=2028: 3J (2028+3-1=2030)
    const account = makeAccount({ durationMonths: 48 });
    expect(getDefaultRangeForAccount(account, 2028)).toBe(3);
  });

  it('returns 10J fallback for very long accounts', () => {
    const account = makeAccount({ durationMonths: 240 }); // 20 years
    expect(getDefaultRangeForAccount(account)).toBe(10);
  });
});

describe('isPeriodEndDateInRange', () => {
  it('includes date within range', () => {
    expect(isPeriodEndDateInRange('2026-06-15', 2025, 2027)).toBe(true);
  });

  it('includes date on start boundary', () => {
    expect(isPeriodEndDateInRange('2025-01-01', 2025, 2027)).toBe(true);
  });

  it('includes December 31 of end year', () => {
    expect(isPeriodEndDateInRange('2026-12-31', 2025, 2026)).toBe(true);
  });

  it('excludes date before start year', () => {
    expect(isPeriodEndDateInRange('2024-12-31', 2025, 2026)).toBe(false);
  });

  it('excludes date after end year', () => {
    expect(isPeriodEndDateInRange('2027-01-01', 2025, 2026)).toBe(false);
  });
});
