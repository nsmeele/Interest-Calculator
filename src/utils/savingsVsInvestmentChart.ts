import type { SavingsVsInvestmentResult } from '../models/SavingsVsInvestmentResult';

/** Eén punt op de vergelijkingsgrafiek: netto saldo per jaar voor beide opties. */
export interface ComparisonChartPoint {
  /** Jaarnummer; 0 = startpunt (nu). */
  year: number;
  /** Netto saldo bij sparen. */
  savings: number;
  /** Netto saldo bij beleggen. */
  investments: number;
}

/**
 * Bouwt de datapunten voor de vergelijkingsgrafiek. Begint met het startbedrag
 * (jaar 0) en voegt voor elk jaar de netto eindsaldi van beide opties toe.
 */
export function buildComparisonChartData(result: SavingsVsInvestmentResult): ComparisonChartPoint[] {
  const points: ComparisonChartPoint[] = [
    { year: 0, savings: result.initialAmount, investments: result.initialAmount },
  ];

  const length = Math.max(result.savings.length, result.investments.length);
  for (let i = 0; i < length; i++) {
    points.push({
      year: i + 1,
      savings: result.savings[i]?.endBalance ?? result.initialAmount,
      investments: result.investments[i]?.endBalance ?? result.initialAmount,
    });
  }

  return points;
}
