/**
 * AOW age lookup based on birth year.
 *
 * Confirmed schedule (rijksoverheid.nl):
 *   Born through 1960: 67
 *   Born 1961–1964:    67 + 3 months
 *
 * Projected schedule with 1:1 life expectancy coupling (berekenhet.nl, NOS):
 *   Born 1965–1966:    67 + 3 months
 *   Born 1967–1970:    67 + 6 months
 *   Born 1971–1973:    67 + 9 months
 *   Born 1974–1975:    68
 *   Born 1976–1978:    68 + 3 months
 *   Born 1979–1982:    68 + 6 months
 *   Born 1983–1985:    68 + 9 months
 *   Born 1986–1988:    69
 *   Born 1989–1991:    69 + 3 months
 *   Born 1992–1995:    69 + 6 months
 *   Born 1996–1999:    69 + 9 months
 *   Born 2000+:        70
 */

interface AowBracket {
  maxBirthYear: number;
  ageYears: number;
  ageMonths: number;
}

const AOW_BRACKETS: AowBracket[] = [
  { maxBirthYear: 1960, ageYears: 67, ageMonths: 0 },
  { maxBirthYear: 1966, ageYears: 67, ageMonths: 3 },
  { maxBirthYear: 1970, ageYears: 67, ageMonths: 6 },
  { maxBirthYear: 1973, ageYears: 67, ageMonths: 9 },
  { maxBirthYear: 1975, ageYears: 68, ageMonths: 0 },
  { maxBirthYear: 1978, ageYears: 68, ageMonths: 3 },
  { maxBirthYear: 1982, ageYears: 68, ageMonths: 6 },
  { maxBirthYear: 1985, ageYears: 68, ageMonths: 9 },
  { maxBirthYear: 1988, ageYears: 69, ageMonths: 0 },
  { maxBirthYear: 1991, ageYears: 69, ageMonths: 3 },
  { maxBirthYear: 1995, ageYears: 69, ageMonths: 6 },
  { maxBirthYear: 1999, ageYears: 69, ageMonths: 9 },
];

const AOW_MAX_AGE_YEARS = 70;
const AOW_MAX_AGE_MONTHS = 0;

function findBracket(birthYear: number): { ageYears: number; ageMonths: number } {
  for (const bracket of AOW_BRACKETS) {
    if (birthYear <= bracket.maxBirthYear) {
      return bracket;
    }
  }
  return { ageYears: AOW_MAX_AGE_YEARS, ageMonths: AOW_MAX_AGE_MONTHS };
}

/** Returns the estimated AOW age as a decimal (e.g. 67.25 for 67 years 3 months). */
export function estimateAowAge(birthYear: number): number {
  const { ageYears, ageMonths } = findBracket(birthYear);
  return ageYears + ageMonths / 12;
}

/** Returns the AOW age formatted as "67 jaar en 3 maanden" or "68 jaar". */
export function formatAowAge(birthYear: number, yearLabel: string, monthLabel: string, andLabel: string): string {
  const { ageYears, ageMonths } = findBracket(birthYear);
  if (ageMonths === 0) return `${ageYears} ${yearLabel}`;
  return `${ageYears} ${yearLabel} ${andLabel} ${ageMonths} ${monthLabel}`;
}

/** Derive birth year from current age (approximate, using current calendar year). */
export function birthYearFromAge(currentAge: number): number {
  return new Date().getFullYear() - currentAge;
}
