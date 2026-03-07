import { parseISO, differenceInMonths, differenceInDays, addDays, addMonths as dfnsAddMonths, lastDayOfMonth, format, isBefore } from 'date-fns';

export function parseDate(iso: string): Date {
  return parseISO(iso);
}

export function monthsBetween(startISO: string, endISO: string): number {
  return differenceInMonths(parseISO(endISO), parseISO(startISO));
}

export function addMonthsToISO(iso: string, months: number): string {
  return toISO(dfnsAddMonths(parseISO(iso), months));
}

export function addMonthsToDate(date: Date, months: number): Date {
  return dfnsAddMonths(date, months);
}

export function toISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function isBeforeDate(a: string, b: string): boolean {
  return isBefore(parseISO(a), parseISO(b));
}

export function getYear(iso: string): number {
  return parseISO(iso).getFullYear();
}

export function getMonth(iso: string): number {
  return parseISO(iso).getMonth();
}

export function addDayISO(iso: string): string {
  return toISO(addDays(parseISO(iso), 1));
}

export function daysBetween(startISO: string, endISO: string): number {
  return differenceInDays(parseISO(endISO), parseISO(startISO));
}

const MONTHLY_BOUNDARIES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const QUARTERLY_BOUNDARIES = [0, 3, 6, 9];
const SEMI_ANNUAL_BOUNDARIES = [0, 6];
const ANNUAL_BOUNDARIES = [0];

export const INTERVAL_BOUNDARIES: Record<string, number[]> = {
  monthly: MONTHLY_BOUNDARIES,
  quarterly: QUARTERLY_BOUNDARIES,
  semi_annually: SEMI_ANNUAL_BOUNDARIES,
  annually: ANNUAL_BOUNDARIES,
  at_maturity: MONTHLY_BOUNDARIES,
};

export function getNextBoundaryStart(iso: string, boundaries: number[]): string {
  const date = parseISO(iso);
  const month = date.getMonth();

  for (const bm of boundaries) {
    if (bm > month) {
      return toISO(new Date(date.getFullYear(), bm, 1));
    }
  }
  return toISO(new Date(date.getFullYear() + 1, boundaries[0], 1));
}

export function getNextQuarterStart(iso: string): string {
  return getNextBoundaryStart(iso, QUARTERLY_BOUNDARIES);
}

export function getNextMonthStart(iso: string): string {
  return getNextBoundaryStart(iso, MONTHLY_BOUNDARIES);
}

export function endOfMonthISO(iso: string): string {
  return toISO(lastDayOfMonth(parseISO(iso)));
}

export function toMonthKey(iso: string): string {
  const d = parseISO(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
