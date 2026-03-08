import type { BankAccount } from '../models/BankAccount';
import { InterestType } from '../enums/InterestType';

export interface BalanceDataPoint {
  label: string;
  balance: number | null;
}

export function formatPeriodLabel(date: string): string {
  const [year, month] = date.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  const label = new Intl.DateTimeFormat('nl-NL', { month: 'short' }).format(d);
  return `${label} '${String(year).slice(2)}`;
}

export function buildBalanceData(account: BankAccount, startYear: number, endYear: number): BalanceDataPoint[] {
  if (!account.startDate || account.periods.length === 0) return [];

  const isSimple = account.interestType === InterestType.Simple;
  const rangeStart = `${startYear}-01-01`;

  // Determine opening balance: if account started before startYear,
  // find the last period before the range and use its endBalance
  let openingBalance = account.startAmount;
  let openingLabel = account.startDate;
  let cumulativeInterest = 0;

  if (account.startDate < rangeStart) {
    // Walk periods before range to find opening balance
    for (const period of account.periods) {
      if (!period.endDate || period.endDate >= rangeStart) break;
      openingBalance = period.endBalance;
      if (isSimple) cumulativeInterest += period.interestEarned;
    }
    openingLabel = `${startYear}-01-01`;
    openingBalance += isSimple ? cumulativeInterest : 0;
  }

  const points: BalanceDataPoint[] = [];

  // If account started after range start, add a zero-balance anchor at Jan 1
  if (account.startDate > rangeStart) {
    points.push({ label: formatPeriodLabel(rangeStart), balance: null });
  }

  points.push({ label: formatPeriodLabel(openingLabel), balance: openingBalance });

  // Reset cumulative for in-range periods (already accounted for in openingBalance for simple)
  let rangeCumulativeInterest = isSimple ? cumulativeInterest : 0;

  for (const period of account.periods) {
    if (!period.endDate) continue;
    if (period.endDate < rangeStart) continue;
    if (period.endDate > `${endYear}-12-31`) break;
    if (isSimple) rangeCumulativeInterest += period.interestEarned;
    points.push({
      label: formatPeriodLabel(period.endDate),
      balance: period.endBalance + (isSimple ? rangeCumulativeInterest : 0),
    });
  }

  return points;
}
