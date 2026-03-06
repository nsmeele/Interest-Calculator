import { describe, it, expect } from 'vitest';
import { expandCashFlows } from '../models/CashFlow';
import type { CashFlow } from '../models/CashFlow';

describe('expandCashFlows', () => {
  it('returns a single entry for a one-time cash flow', () => {
    const flows: CashFlow[] = [{
      id: '1', date: '2025-03-01', amount: 500, description: 'Storting',
    }];
    const result = expandCashFlows(flows, '2025-12-31');
    expect(result).toEqual([{ date: '2025-03-01', amount: 500 }]);
  });

  it('expands a monthly recurring cash flow until end date', () => {
    const flows: CashFlow[] = [{
      id: '1', date: '2025-01-01', amount: 100, description: 'Maandelijks',
      recurring: { intervalMonths: 1 },
    }];
    const result = expandCashFlows(flows, '2025-04-01');
    expect(result).toHaveLength(4);
    expect(result[0].date).toBe('2025-01-01');
    expect(result[3].date).toBe('2025-04-01');
    expect(result.every((r) => r.amount === 100)).toBe(true);
  });

  it('expands a quarterly recurring cash flow', () => {
    const flows: CashFlow[] = [{
      id: '1', date: '2025-01-15', amount: 1000, description: 'Kwartaal',
      recurring: { intervalMonths: 3 },
    }];
    const result = expandCashFlows(flows, '2025-12-31');
    expect(result).toHaveLength(4);
    expect(result.map((r) => r.date)).toEqual([
      '2025-01-15', '2025-04-15', '2025-07-15', '2025-10-15',
    ]);
  });

  it('sorts expanded flows chronologically across multiple sources', () => {
    const flows: CashFlow[] = [
      { id: '1', date: '2025-06-01', amount: 500, description: 'Eenmalig' },
      { id: '2', date: '2025-01-01', amount: 100, description: 'Maandelijks', recurring: { intervalMonths: 3 } },
    ];
    const result = expandCashFlows(flows, '2025-06-30');
    expect(result[0].date).toBe('2025-01-01');
    expect(result[1].date).toBe('2025-04-01');
    expect(result[2].date).toBe('2025-06-01');
  });

  it('returns empty array for empty input', () => {
    expect(expandCashFlows([], '2025-12-31')).toEqual([]);
  });
});
