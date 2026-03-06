import type { InterestCalculationResult } from '../models/InterestCalculationResult';
import type { ExportFile, ExportedResult } from '../models/ExportFile';
import { EXPORT_FORMAT_VERSION } from '../models/ExportFile';

export function toExportedResult(r: InterestCalculationResult): ExportedResult {
  return {
    id: r.id,
    timestamp: r.timestamp,
    startAmount: r.startAmount,
    annualInterestRate: r.annualInterestRate,
    durationMonths: r.durationMonths,
    interval: r.interval,
    interestType: r.interestType,
    startDate: r.startDate,
    periods: r.periods,
    cashFlows: r.cashFlows,
    isOngoing: r.isOngoing,
  };
}

export function serializeToExportFile(
  results: InterestCalculationResult[],
  portfolioIds: Set<string>,
): ExportFile {
  return {
    version: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    results: results.map(toExportedResult),
    portfolioIds: [...portfolioIds],
  };
}
