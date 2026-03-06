import { parseDate, toISO, addMonthsToDate } from '../utils/date';

export interface CashFlow {
  id: string;
  date: string;
  amount: number;
  description: string;
  recurring?: {
    intervalMonths: number;
  };
}

export interface ExpandedCashFlow {
  date: string;
  amount: number;
}

export function expandCashFlows(
  cashFlows: CashFlow[],
  endDate: string,
): ExpandedCashFlow[] {
  const expanded: ExpandedCashFlow[] = [];
  const end = parseDate(endDate);

  for (const cf of cashFlows) {
    if (cf.recurring) {
      let current = parseDate(cf.date);

      while (current <= end) {
        expanded.push({ date: toISO(current), amount: cf.amount });
        current = addMonthsToDate(current, cf.recurring.intervalMonths);
      }
    } else {
      expanded.push({ date: cf.date, amount: cf.amount });
    }
  }

  return expanded.sort((a, b) => a.date.localeCompare(b.date));
}
