import { useState, useCallback } from 'react';
import { InterestCalculationResult } from '../models/InterestCalculationResult';
import type { ExportedResult } from '../models/ExportFile';
import { toExportedResult } from '../transfer/dataSerializer';
import { InterestCalculationInput } from '../models/InterestCalculationInput';
import { InterestCalculator } from '../calculator/InterestCalculator';

const STORAGE_KEY = 'interest-calculator-results';

const calc = new InterestCalculator();

function reconstructResult(item: ExportedResult): InterestCalculationResult {
  const cashFlows = item.cashFlows ?? [];
  const isOngoing = item.isOngoing ?? false;
  let result: InterestCalculationResult;

  if (cashFlows.length > 0 && item.startDate) {
    const input = new InterestCalculationInput(
      item.startAmount, item.annualInterestRate, item.durationMonths,
      item.interval, item.interestType, item.startDate, cashFlows, isOngoing,
    );
    result = calc.calculate(input);
  } else {
    result = new InterestCalculationResult(
      item.startAmount, item.annualInterestRate, item.durationMonths,
      item.interval, item.interestType, item.startDate, item.periods,
      cashFlows, isOngoing,
    );
  }

  Object.assign(result, { id: item.id, timestamp: item.timestamp });
  return result;
}

function loadFromStorage(): InterestCalculationResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed: ExportedResult[] = JSON.parse(data);
    return parsed.map(reconstructResult);
  } catch {
    return [];
  }
}

function saveToStorage(results: InterestCalculationResult[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(results.map(toExportedResult)));
}

export function useResultStorage() {
  const [results, setResults] = useState<InterestCalculationResult[]>(loadFromStorage);

  const addResult = useCallback((result: InterestCalculationResult) => {
    setResults((prev) => {
      const updated = [result, ...prev];
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const updateResult = useCallback((id: string, result: InterestCalculationResult) => {
    setResults((prev) => {
      const updated = prev.map((r) => {
        if (r.id !== id) return r;
        Object.assign(result, { id: r.id, timestamp: r.timestamp });
        return result;
      });
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const removeResult = useCallback((id: string) => {
    setResults((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const clearResults = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setResults([]);
  }, []);

  const replaceResults = useCallback((incoming: ExportedResult[]) => {
    const reconstructed = incoming.map(reconstructResult);
    saveToStorage(reconstructed);
    setResults(reconstructed);
  }, []);

  const mergeResults = useCallback((incoming: ExportedResult[]) => {
    setResults((prev) => {
      const existingIds = new Set(prev.map((r) => r.id));
      const newItems = incoming.filter((r) => !existingIds.has(r.id)).map(reconstructResult);
      const merged = [...prev, ...newItems];
      saveToStorage(merged);
      return merged;
    });
  }, []);

  return { results, addResult, updateResult, removeResult, clearResults, replaceResults, mergeResults };
}
