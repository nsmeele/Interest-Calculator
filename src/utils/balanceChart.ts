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

function toMonthKey(date: string): string {
  return date.slice(0, 7); // '2026-03-15' → '2026-03'
}

export function buildBalanceData(account: BankAccount, startYear: number, endYear: number): BalanceDataPoint[] {
  if (!account.startDate || account.periods.length === 0) return [];

  const isSimple = account.interestType === InterestType.Simple;
  const rangeStart = `${startYear}-01-01`;
  const accountStartKey = toMonthKey(account.startDate);

  // Build a map of monthKey → chart balance
  // Simple: endBalance + cumulative disbursed (endBalance stays flat, disbursed tracks payouts)
  // Compound: just endBalance (already includes compounded interest)
  let cumulativeDisbursed = 0;
  const periodBalances = new Map<string, number>();

  for (const period of account.periods) {
    if (!period.endDate) continue;
    if (isSimple) cumulativeDisbursed += period.disbursed;
    periodBalances.set(toMonthKey(period.endDate), period.endBalance + cumulativeDisbursed);
  }

  // Find opening balance if account started before range
  let openingBalance = account.startAmount;
  if (account.startDate < rangeStart) {
    let preDisbursed = 0;
    for (const period of account.periods) {
      if (!period.endDate || period.endDate >= rangeStart) break;
      openingBalance = period.endBalance;
      if (isSimple) preDisbursed += period.disbursed;
    }
    openingBalance += preDisbursed;
  }

  // Determine the last month the account has data for
  const lastPeriod = account.periods[account.periods.length - 1];
  const accountEndKey = lastPeriod?.endDate ? toMonthKey(lastPeriod.endDate) : undefined;

  // Generate monthly grid
  const points: BalanceDataPoint[] = [];
  let lastKnownBalance: number | null = null;

  for (let y = startYear; y <= endYear; y++) {
    for (let m = 1; m <= 12; m++) {
      const key = `${y}-${String(m).padStart(2, '0')}`;
      const label = formatPeriodLabel(`${key}-01`);

      // Before account start: null
      if (key < accountStartKey) {
        points.push({ label, balance: null });
        continue;
      }

      // Account start month
      if (key === accountStartKey && account.startDate >= rangeStart) {
        lastKnownBalance = account.startAmount;
        points.push({ label, balance: lastKnownBalance });
        // Also check if a period ends in this month
        const periodBalance = periodBalances.get(key);
        if (periodBalance !== undefined) lastKnownBalance = periodBalance;
        continue;
      }

      // Opening balance at range start when account started before range
      if (key === toMonthKey(rangeStart) && account.startDate < rangeStart) {
        lastKnownBalance = openingBalance;
        points.push({ label, balance: lastKnownBalance });
        const periodBalance = periodBalances.get(key);
        if (periodBalance !== undefined) lastKnownBalance = periodBalance;
        continue;
      }

      // Period data available for this month
      const periodBalance = periodBalances.get(key);
      if (periodBalance !== undefined) {
        lastKnownBalance = periodBalance;
        points.push({ label, balance: lastKnownBalance });
        continue;
      }

      // After account ends: null (line stops)
      if (!account.isOngoing && accountEndKey && key > accountEndKey) {
        points.push({ label, balance: null });
      } else if (lastKnownBalance !== null) {
        points.push({ label, balance: lastKnownBalance });
      } else {
        points.push({ label, balance: null });
      }
    }
  }

  return points;
}
