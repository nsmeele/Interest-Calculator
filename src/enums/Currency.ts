import currency from 'currency.js';

export enum Currency {
  EUR = 'EUR',
  USD = 'USD',
  GBP = 'GBP',
  CHF = 'CHF',
  JPY = 'JPY',
  CAD = 'CAD',
  AUD = 'AUD',
  SEK = 'SEK',
  NOK = 'NOK',
  DKK = 'DKK',
  PLN = 'PLN',
}

export const DEFAULT_CURRENCY = Currency.EUR;

export const SUPPORTED_CURRENCIES: Currency[] = Object.values(Currency) as Currency[];

interface CurrencyConfig {
  symbol: string;
  precision: number;
  separator: string;
  decimal: string;
  pattern: string;
  negativePattern: string;
}

export const CURRENCY_CONFIG: Record<Currency, CurrencyConfig> = {
  [Currency.EUR]: { symbol: '\u20AC', precision: 2, separator: '.', decimal: ',', pattern: '! #', negativePattern: '-! #' },
  [Currency.USD]: { symbol: '$', precision: 2, separator: ',', decimal: '.', pattern: '!#', negativePattern: '-!#' },
  [Currency.GBP]: { symbol: '\u00A3', precision: 2, separator: ',', decimal: '.', pattern: '!#', negativePattern: '-!#' },
  [Currency.CHF]: { symbol: 'Fr', precision: 2, separator: '\u2019', decimal: '.', pattern: '! #', negativePattern: '-! #' },
  [Currency.JPY]: { symbol: '\u00A5', precision: 0, separator: ',', decimal: '.', pattern: '!#', negativePattern: '-!#' },
  [Currency.CAD]: { symbol: 'CA$', precision: 2, separator: ',', decimal: '.', pattern: '!#', negativePattern: '-!#' },
  [Currency.AUD]: { symbol: 'A$', precision: 2, separator: ',', decimal: '.', pattern: '!#', negativePattern: '-!#' },
  [Currency.SEK]: { symbol: 'kr', precision: 2, separator: ' ', decimal: ',', pattern: '# !', negativePattern: '-# !' },
  [Currency.NOK]: { symbol: 'kr', precision: 2, separator: ' ', decimal: ',', pattern: '# !', negativePattern: '-# !' },
  [Currency.DKK]: { symbol: 'kr', precision: 2, separator: '.', decimal: ',', pattern: '# !', negativePattern: '-# !' },
  [Currency.PLN]: { symbol: 'z\u0142', precision: 2, separator: ' ', decimal: ',', pattern: '# !', negativePattern: '-# !' },
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = Object.fromEntries(
  Object.entries(CURRENCY_CONFIG).map(([code, config]) => [code, config.symbol]),
) as Record<Currency, string>;

export function createCurrency(value: number | string, code: Currency): currency {
  return currency(value, CURRENCY_CONFIG[code]);
}
