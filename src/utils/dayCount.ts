import { DayCountConvention } from '../enums/DayCountConvention';
import { parseDate, daysBetween, getNextMonthStart } from './date';

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function days30_360(start: Date, end: Date): number {
  let d1 = start.getDate();
  let d2 = end.getDate();
  if (d1 === 31) d1 = 30;
  if (d2 === 31) d2 = 30;
  return (end.getFullYear() - start.getFullYear()) * 360
    + (end.getMonth() - start.getMonth()) * 30
    + (d2 - d1);
}

function actActFraction(startISO: string, endISO: string): number {
  const startYear = parseDate(startISO).getFullYear();
  const endYear = parseDate(endISO).getFullYear();

  if (startYear === endYear) {
    return daysBetween(startISO, endISO) / daysInYear(startYear);
  }

  let fraction = 0;
  const startOfNextYear = `${startYear + 1}-01-01`;
  fraction += daysBetween(startISO, startOfNextYear) / daysInYear(startYear);

  for (let y = startYear + 1; y < endYear; y++) {
    fraction += 1;
  }

  const startOfEndYear = `${endYear}-01-01`;
  fraction += daysBetween(startOfEndYear, endISO) / daysInYear(endYear);

  return fraction;
}

function nom12Fraction(startISO: string, endISO: string): number {
  if (startISO >= endISO) return 0;

  let fraction = 0;
  let cursor = startISO;

  while (cursor < endISO) {
    const d = parseDate(cursor);
    const monthDays = daysInMonth(d.getFullYear(), d.getMonth());
    const monthEnd = getNextMonthStart(cursor);
    const segmentEnd = monthEnd < endISO ? monthEnd : endISO;
    const segmentDays = daysBetween(cursor, segmentEnd);
    fraction += (segmentDays / monthDays) / 12;
    cursor = segmentEnd;
  }

  return fraction;
}

export function yearFraction(startISO: string, endISO: string, convention: DayCountConvention): number {
  switch (convention) {
    case DayCountConvention.NOM_12:
      return nom12Fraction(startISO, endISO);
    case DayCountConvention.ACT_365:
      return daysBetween(startISO, endISO) / 365;
    case DayCountConvention.ACT_ACT:
      return actActFraction(startISO, endISO);
    case DayCountConvention.THIRTY_360:
      return days30_360(parseDate(startISO), parseDate(endISO)) / 360;
  }
}
