import type { BankAccount } from '../models/BankAccount';
import { type ChartYearRange, CHART_YEAR_RANGES } from '../enums/ChartYearRange';
import { todayISO, getYear } from './date';

export function currentYear(): number {
  return getYear(todayISO());
}

export function getRangeEndYear(startYear: number, years: ChartYearRange): number {
  return startYear + years - 1;
}

export function getDefaultRangeForAccount(account: BankAccount): ChartYearRange {
  if (!account.endDate) return CHART_YEAR_RANGES[0]; // 1J for ongoing

  const endYear = getYear(account.endDate);
  const start = currentYear();

  for (const range of CHART_YEAR_RANGES) {
    if (start + range - 1 >= endYear) return range;
  }

  return CHART_YEAR_RANGES[CHART_YEAR_RANGES.length - 1]; // 10J fallback
}

export function isPeriodEndDateInRange(endDate: string, startYear: number, endYear: number): boolean {
  return endDate >= `${startYear}-01-01` && endDate <= `${endYear}-12-31`;
}
