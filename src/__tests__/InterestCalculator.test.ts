import { describe, it, expect } from 'vitest';
import { InterestCalculator } from '../calculator/InterestCalculator';
import { InterestCalculationInput } from '../models/InterestCalculationInput';
import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import type { CashFlow } from '../models/CashFlow';

const calculator = new InterestCalculator();

describe('InterestCalculator', () => {
  it('returns a result with correct input fields', () => {
    const input = new InterestCalculationInput(10000, 5, 12, PayoutInterval.Monthly, InterestType.Compound, '2025-01-01');
    const result = calculator.calculate(input);

    expect(result.startAmount).toBe(10000);
    expect(result.annualInterestRate).toBe(5);
    expect(result.durationMonths).toBe(12);
    expect(result.interval).toBe(PayoutInterval.Monthly);
    expect(result.interestType).toBe(InterestType.Compound);
    expect(result.startDate).toBe('2025-01-01');
    expect(result.id).toBeTruthy();
  });

  it('passes cash flows through to the result', () => {
    const cashFlows: CashFlow[] = [{
      id: '1', date: '2025-06-01', amount: 1000, description: 'Storting',
    }];
    const input = new InterestCalculationInput(10000, 5, 12, PayoutInterval.Monthly, InterestType.Compound, '2025-01-01', cashFlows);
    const result = calculator.calculate(input);

    expect(result.cashFlows).toEqual(cashFlows);
  });

  it('maps a cash flow to the correct period', () => {
    const cashFlows: CashFlow[] = [{
      id: '1', date: '2025-04-15', amount: 5000, description: 'Storting',
    }];
    const input = new InterestCalculationInput(10000, 5, 12, PayoutInterval.Monthly, InterestType.Compound, '2025-01-01', cashFlows);
    const result = calculator.calculate(input);

    // April = month offset 3 from January, so period 4
    expect(result.periods[3].deposited).toBe(5000);
    // Other periods should have no deposits
    expect(result.periods[0].deposited).toBe(0);
    expect(result.periods[1].deposited).toBe(0);
    expect(result.periods[2].deposited).toBe(0);
  });

  it('maps a quarterly cash flow to the correct period', () => {
    const cashFlows: CashFlow[] = [{
      id: '1', date: '2025-07-01', amount: 2000, description: 'Storting',
    }];
    const input = new InterestCalculationInput(10000, 5, 12, PayoutInterval.Quarterly, InterestType.Compound, '2025-01-01', cashFlows);
    const result = calculator.calculate(input);

    // July = month offset 6, quarterly monthsPerPeriod = 3, so period = floor(6/3)+1 = 3
    expect(result.periods[2].deposited).toBe(2000);
  });

  it('ignores cash flows outside the duration', () => {
    const cashFlows: CashFlow[] = [
      { id: '1', date: '2024-06-01', amount: 1000, description: 'Te vroeg' },
      { id: '2', date: '2026-06-01', amount: 1000, description: 'Te laat' },
    ];
    const input = new InterestCalculationInput(10000, 5, 12, PayoutInterval.Monthly, InterestType.Compound, '2025-01-01', cashFlows);
    const result = calculator.calculate(input);

    const totalDeposited = result.periods.reduce((sum, p) => sum + p.deposited, 0);
    expect(totalDeposited).toBe(0);
  });

  it('expands recurring cash flows and maps them to periods', () => {
    const cashFlows: CashFlow[] = [{
      id: '1', date: '2025-01-01', amount: 100, description: 'Maandelijks',
      recurring: { intervalMonths: 1 },
    }];
    const input = new InterestCalculationInput(10000, 5, 12, PayoutInterval.Monthly, InterestType.Compound, '2025-01-01', cashFlows);
    const result = calculator.calculate(input);

    // Each month should have a deposit of 100
    for (const p of result.periods) {
      expect(p.deposited).toBe(100);
    }
  });

  it('ignores cash flows when no startDate', () => {
    const cashFlows: CashFlow[] = [{
      id: '1', date: '2025-06-01', amount: 5000, description: 'Storting',
    }];
    const input = new InterestCalculationInput(10000, 5, 12, PayoutInterval.Monthly, InterestType.Compound, undefined, cashFlows);
    const result = calculator.calculate(input);

    const totalDeposited = result.periods.reduce((sum, p) => sum + p.deposited, 0);
    expect(totalDeposited).toBe(0);
  });

  describe('ongoing account with cash flow', () => {
    it('applies a deposit to the correct period', () => {
      const cashFlows: CashFlow[] = [{
        id: '1', date: '2025-04-01', amount: 3000, description: 'Extra storting',
      }];
      const input = new InterestCalculationInput(
        10000, 4, 6, PayoutInterval.Monthly, InterestType.Compound,
        '2025-01-01', cashFlows, true,
      );
      const result = calculator.calculate(input);

      expect(result.isOngoing).toBe(true);
      // April = month offset 3 → period 4
      expect(result.periods[3].deposited).toBe(3000);
      // Other periods should have no deposits
      expect(result.periods[0].deposited).toBe(0);
      expect(result.periods[1].deposited).toBe(0);
      expect(result.periods[2].deposited).toBe(0);
      expect(result.periods[4].deposited).toBe(0);
      expect(result.periods[5].deposited).toBe(0);
    });

    it('increases interest after a deposit', () => {
      const withoutCashFlow = new InterestCalculationInput(
        10000, 4, 6, PayoutInterval.Monthly, InterestType.Compound,
        '2025-01-01', [], true,
      );
      const cashFlows: CashFlow[] = [{
        id: '1', date: '2025-02-01', amount: 5000, description: 'Storting',
      }];
      const withCashFlow = new InterestCalculationInput(
        10000, 4, 6, PayoutInterval.Monthly, InterestType.Compound,
        '2025-01-01', cashFlows, true,
      );

      const resultWithout = calculator.calculate(withoutCashFlow);
      const resultWith = calculator.calculate(withCashFlow);

      // After the deposit, interest in later periods should be higher
      expect(resultWith.periods[2].interestEarned).toBeGreaterThan(resultWithout.periods[2].interestEarned);
      expect(resultWith.totalInterest).toBeGreaterThan(resultWithout.totalInterest);
    });

    it('has no endDate and is never expired', () => {
      const cashFlows: CashFlow[] = [{
        id: '1', date: '2024-06-01', amount: 1000, description: 'Storting',
      }];
      const input = new InterestCalculationInput(
        10000, 3, 18, PayoutInterval.Monthly, InterestType.Compound,
        '2024-01-01', cashFlows, true,
      );
      const result = calculator.calculate(input);

      expect(result.endDate).toBeUndefined();
      expect(result.hasExpired).toBe(false);
    });

    it('preserves isOngoing when recalculating with new cash flows', () => {
      // Simulate initial ongoing calculation without cash flows
      const initial = new InterestCalculationInput(
        10000, 4, 6, PayoutInterval.Monthly, InterestType.Compound,
        '2025-01-01', [], true,
      );
      const initialResult = calculator.calculate(initial);
      expect(initialResult.isOngoing).toBe(true);

      // Simulate handleUpdateCashFlows: recalculate with a new cash flow,
      // reusing properties from the existing result (including isOngoing)
      const newCashFlows: CashFlow[] = [{
        id: '1', date: '2025-03-01', amount: 2000, description: 'Storting',
      }];
      const recalcInput = new InterestCalculationInput(
        initialResult.startAmount,
        initialResult.annualInterestRate,
        initialResult.durationMonths,
        initialResult.interval,
        initialResult.interestType,
        initialResult.startDate,
        newCashFlows,
        initialResult.isOngoing,
      );
      const recalcResult = calculator.calculate(recalcInput);

      expect(recalcResult.isOngoing).toBe(true);
      expect(recalcResult.endDate).toBeUndefined();
      expect(recalcResult.hasExpired).toBe(false);
      // March = month offset 2 → period 3
      expect(recalcResult.periods[2].deposited).toBe(2000);
      expect(recalcResult.totalInterest).toBeGreaterThan(initialResult.totalInterest);
    });

    it('currentBalance reflects deposits and withdrawals correctly', () => {
      // Real scenario: ongoing account opened 2026-01-10, 1.92%, inleg 5000
      // 2026-01-14: +6908, +27000
      // 2026-03-03: -10000
      // 2026-03-05: -25000
      // Duration: Jan 10 to Mar 6 = 2 months
      // Expected currentBalance: 5000 + 6908 + 27000 - 10000 - 25000 = 3908
      const cashFlows: CashFlow[] = [
        { id: '1', date: '2026-01-14', amount: 6908, description: 'Storting' },
        { id: '2', date: '2026-01-14', amount: 27000, description: 'Storting' },
        { id: '3', date: '2026-03-03', amount: -10000, description: 'Opname' },
        { id: '4', date: '2026-03-05', amount: -25000, description: 'Opname' },
      ];
      const input = new InterestCalculationInput(
        5000, 1.92, 2, PayoutInterval.Monthly, InterestType.Compound,
        '2026-01-10', cashFlows, true,
      );
      const result = calculator.calculate(input);

      expect(result.currentBalance).toBe(3908);
      expect(result.currentBalance).not.toBe(result.startAmount);
    });

    it('applies a recurring cash flow across all matching periods', () => {
      const cashFlows: CashFlow[] = [{
        id: '1', date: '2025-01-01', amount: 200, description: 'Maandelijks',
        recurring: { intervalMonths: 1 },
      }];
      const input = new InterestCalculationInput(
        5000, 4, 6, PayoutInterval.Monthly, InterestType.Compound,
        '2025-01-01', cashFlows, true,
      );
      const result = calculator.calculate(input);

      for (const p of result.periods) {
        expect(p.deposited).toBe(200);
      }
    });
  });
});
