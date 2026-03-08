import type { BankAccount } from '../models/BankAccount';
import { InterestType } from '../enums/InterestType';
import { PayoutInterval } from '../enums/PayoutInterval';
import { todayISO, toMonthKey } from './date';

export interface MaturityEvent {
  accountId: string;
  date: string;
  type: 'maturity' | 'disbursement';
  amount: number;
  monthKey: string;
}

export function collectMaturities(accounts: BankAccount[], portfolioIds?: Set<string>): MaturityEvent[] {
  const today = todayISO();
  const events: MaturityEvent[] = [];

  for (const account of accounts) {
    if (!account.startDate) continue;
    if (portfolioIds && !portfolioIds.has(account.id)) continue;

    // 1. Maturity: fixed accounts with a future end date
    if (!account.isOngoing && account.endDate && account.endDate > today) {
      events.push({
        accountId: account.id,
        date: account.endDate,
        type: 'maturity',
        amount: account.endAmount,
        monthKey: toMonthKey(account.endDate),
      });
    }

    // 2. Disbursements: simple interest with periodic payouts (not AtMaturity)
    if (
      account.interestType === InterestType.Simple &&
      account.interval !== PayoutInterval.AtMaturity
    ) {
      for (const period of account.periods) {
        if (!period.endDate || period.disbursed <= 0) continue;
        if (period.endDate <= today) continue;

        events.push({
          accountId: account.id,
          date: period.endDate,
          type: 'disbursement',
          amount: period.disbursed,
          monthKey: toMonthKey(period.endDate),
        });
      }
    }
  }

  // Sort chronologically
  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
