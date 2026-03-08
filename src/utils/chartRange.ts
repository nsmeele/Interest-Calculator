import type { BankAccount } from '../models/BankAccount';
import { type ChartYearRange, CHART_YEAR_RANGES } from '../enums/ChartYearRange';
import { todayISO, getYear } from './date';

export function currentYear(): number {
  return getYear(todayISO());
}

export function getRangeEndYear(startYear: number, years: ChartYearRange): number {
  return startYear + years - 1;
}

export function getDefaultStartYear(account: BankAccount): number {
  return account.startDate ? getYear(account.startDate) : currentYear();
}

export function getDefaultRangeForAccount(account: BankAccount, startYear?: number): ChartYearRange {
  if (!account.endDate) return CHART_YEAR_RANGES[0]; // 1J for ongoing

  const endYear = getYear(account.endDate);
  const start = startYear ?? getDefaultStartYear(account);

  for (const range of CHART_YEAR_RANGES) {
    if (start + range - 1 >= endYear) return range;
  }

  return CHART_YEAR_RANGES[CHART_YEAR_RANGES.length - 1]; // 10J fallback
}

export function getMaxRangeForAccount(account: BankAccount): ChartYearRange | undefined {
  if (!account.endDate) return undefined; // ongoing: no limit
  return getDefaultRangeForAccount(account); // based on account start year
}

export function isPeriodEndDateInRange(endDate: string, startYear: number, endYear: number): boolean {
  return endDate >= `${startYear}-01-01` && endDate <= `${endYear}-12-31`;
}
