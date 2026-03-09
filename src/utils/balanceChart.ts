import type { BankAccount } from '../models/BankAccount';
import { expandCashFlows } from '../models/CashFlow';
import { InterestType } from '../enums/InterestType';
import { addMonthsToISO, endOfMonthISO } from './date';

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

/** Sums cashflow amounts within a date range (inclusive). */
function sumCashFlowsInRange(
  expanded: { date: string; amount: number }[],
  from: string,
  to: string,
): number {
  let sum = 0;
  for (const cf of expanded) {
    if (cf.date >= from && cf.date <= to) sum += cf.amount;
  }
  return sum;
}

/** Returns a map of monthKey → balance for each month in the range. */
export function buildMonthlyBalanceMap(
  account: BankAccount,
  startYear: number,
  endYear: number,
): Map<string, number | null> {
  const map = new Map<string, number | null>();
  if (!account.startDate || account.periods.length === 0) return map;

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

  // Expand cashflows for mid-period balance calculation
  const endISO = account.isOngoing
    ? addMonthsToISO(account.startDate, account.durationMonths)
    : (account.endDate ?? addMonthsToISO(account.startDate, account.durationMonths));
  const expanded = expandCashFlows(account.cashFlows, endISO);

  // Generate monthly grid
  let lastKnownBalance: number | null = null;

  for (let y = startYear; y <= endYear; y++) {
    for (let m = 1; m <= 12; m++) {
      const key = `${y}-${String(m).padStart(2, '0')}`;

      // Before account start: null
      if (key < accountStartKey) {
        map.set(key, null);
        continue;
      }

      // After account ends: null
      if (!account.isOngoing && accountEndKey && key > accountEndKey) {
        map.set(key, null);
        continue;
      }

      // Period end in this month: use period balance (authoritative)
      const periodBalance = periodBalances.get(key);
      if (periodBalance !== undefined) {
        lastKnownBalance = periodBalance;
        map.set(key, lastKnownBalance);
        continue;
      }

      // No period end — calculate balance from base + cashflows
      const monthEnd = endOfMonthISO(`${key}-01`);

      if (key === accountStartKey && account.startDate >= rangeStart) {
        // Account start month: startAmount + cashflows in this month
        lastKnownBalance = account.startAmount
          + sumCashFlowsInRange(expanded, account.startDate, monthEnd);
      } else if (key === toMonthKey(rangeStart) && account.startDate < rangeStart) {
        // First month of range when account started earlier
        lastKnownBalance = openingBalance
          + sumCashFlowsInRange(expanded, `${key}-01`, monthEnd);
      } else if (lastKnownBalance !== null) {
        // Carry forward + any cashflows in this month
        lastKnownBalance += sumCashFlowsInRange(expanded, `${key}-01`, monthEnd);
      }

      map.set(key, lastKnownBalance);
    }
  }

  return map;
}

export function buildBalanceData(account: BankAccount, startYear: number, endYear: number): BalanceDataPoint[] {
  const balanceMap = buildMonthlyBalanceMap(account, startYear, endYear);
  if (balanceMap.size === 0) return [];

  const points: BalanceDataPoint[] = [];
  for (const [key, balance] of balanceMap) {
    points.push({ label: formatPeriodLabel(`${key}-01`), balance });
  }
  return points;
}
