import { parseISO, differenceInMonths, addMonths as dfnsAddMonths, format, isBefore } from 'date-fns';

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
