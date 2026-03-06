import { parseDate } from './date';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

export function formatDuration(months: number): string {
  const j = Math.floor(months / 12);
  const m = months % 12;
  if (m === 0) return `${j} jaar`;
  if (j === 0) return `${m} maanden`;
  return `${j} jaar, ${m} mnd`;
}

export function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parseDate(isoString));
}

export function formatDurationShort(months: number): string {
  const j = Math.floor(months / 12);
  const m = months % 12;
  if (m === 0) return `${j} jr`;
  if (j === 0) return `${m} mnd`;
  return `${j} jr ${m} mnd`;
}
