import type { BankAccount } from '../models/BankAccount';
import type { MaturityEvent } from './collectMaturities';
import type { ReinvestmentAllocation } from '../models/ReinvestmentAllocation';
import { AccountType } from '../enums/AccountType';
import { buildMonthlyBalanceMap, formatPeriodLabel } from './balanceChart';

export interface DistributionDataPoint {
  monthKey: string;
  label: string;
  variable: number;
  fixed: number;
}

/** Builds a map of monthKey → cumulative unallocated amount from maturity/disbursement events. */
function buildUnallocatedMap(
  events: MaturityEvent[],
  allocations: ReinvestmentAllocation[],
): Map<string, number> {
  // Calculate remaining (unallocated) amount per event
  const eventAmounts: { monthKey: string; remaining: number }[] = [];

  for (const event of events) {
    const eventAllocations = allocations.filter(
      (a) => a.sourceAccountId === event.accountId && a.sourceDate === event.date && a.sourceType === event.type,
    );
    const allocated = eventAllocations.reduce((sum, a) => sum + a.amount, 0);
    const remaining = Math.max(0, event.amount - allocated);
    if (remaining > 0) {
      eventAmounts.push({ monthKey: event.monthKey, remaining });
    }
  }

  if (eventAmounts.length === 0) return new Map();

  // Group by monthKey and sum
  const perMonth = new Map<string, number>();
  for (const { monthKey, remaining } of eventAmounts) {
    perMonth.set(monthKey, (perMonth.get(monthKey) ?? 0) + remaining);
  }

  // Convert to cumulative: each month includes all previous months' unallocated amounts
  const sorted = [...perMonth.entries()].sort(([a], [b]) => a.localeCompare(b));
  const cumulative = new Map<string, number>();
  let running = 0;
  for (const [monthKey, amount] of sorted) {
    running += amount;
    cumulative.set(monthKey, running);
  }

  return cumulative;
}

export function buildDistributionData(
  accounts: BankAccount[],
  startYear: number,
  endYear: number,
  events: MaturityEvent[] = [],
  allocations: ReinvestmentAllocation[] = [],
): DistributionDataPoint[] {
  const withDates = accounts.filter((a) => a.startDate);
  if (withDates.length === 0) return [];

  // Build set of accountId:monthKey pairs where a maturity event occurs,
  // so we can skip those balances (the money transitions to unallocated/variable)
  const maturityKeys = new Set(
    events.filter((e) => e.type === 'maturity').map((e) => `${e.accountId}:${e.monthKey}`),
  );

  const accountMaps = withDates.map((account) => ({
    id: account.id,
    isSavings: account.accountType === AccountType.Savings,
    balances: buildMonthlyBalanceMap(account, startYear, endYear),
  }));

  const unallocatedMap = buildUnallocatedMap(events, allocations);

  const points: DistributionDataPoint[] = [];
  let lastUnallocated = 0;

  for (let y = startYear; y <= endYear; y++) {
    for (let m = 1; m <= 12; m++) {
      const monthKey = `${y}-${String(m).padStart(2, '0')}`;
      const label = formatPeriodLabel(`${monthKey}-01`);

      let variable = 0;
      let fixed = 0;
      let hasBalance = false;

      for (const { id, isSavings, balances } of accountMaps) {
        // Skip the maturity month for this account (money is handled via unallocated)
        if (maturityKeys.has(`${id}:${monthKey}`)) continue;

        const balance = balances.get(monthKey);
        if (balance === null || balance === undefined) continue;

        hasBalance = true;
        if (isSavings) {
          variable += balance;
        } else {
          fixed += balance;
        }
      }

      // Add cumulative unallocated maturity/disbursement money to variable
      if (unallocatedMap.has(monthKey)) {
        lastUnallocated = unallocatedMap.get(monthKey)!;
      }
      if (lastUnallocated > 0) {
        variable += lastUnallocated;
        hasBalance = true;
      }

      if (hasBalance) {
        points.push({ monthKey, label, variable, fixed });
      }
    }
  }

  return points;
}
