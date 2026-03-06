import type { BankAccount } from '../models/BankAccount';
import { toMonthKey } from './date';

export type ItemStatus = 'active' | 'expired' | 'upcoming';

export function itemStatusForMonth(r: BankAccount, monthKey: string): ItemStatus {
  if (r.startDate && monthKey < toMonthKey(r.startDate)) return 'upcoming';

  const lastPayout = r.periods[r.periods.length - 1]?.endDate;
  if (!r.isOngoing && lastPayout && monthKey > toMonthKey(lastPayout)) return 'expired';

  return 'active';
}
