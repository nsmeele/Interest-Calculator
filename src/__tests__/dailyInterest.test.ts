import { describe, it, expect } from 'vitest';
import { calculateDailyInterest } from '../utils/dailyInterest';
import { AccountCalculator } from '../calculator/AccountCalculator';
import { BankAccountInput } from '../models/BankAccountInput';
import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import type { CashFlow } from '../models/CashFlow';

const dailyRate = (rate: number) => rate / 100 / 365;

describe('calculateDailyInterest', () => {
  it('calculates interest without cash flows (full period)', () => {
    const result = calculateDailyInterest('2025-01-01', '2025-02-01', 10000, [], 5);
    const expected = 10000 * dailyRate(5) * 31;
    expect(result.interestEarned).toBeCloseTo(expected, 6);
    expect(result.endBalance).toBe(10000);
    expect(result.totalDeposited).toBe(0);
  });

  it('calculates less interest for a mid-period deposit', () => {
    // Deposit on day 15 of a 31-day month
    const cashFlows = [{ date: '2025-01-16', amount: 5000 }];
    const result = calculateDailyInterest('2025-01-01', '2025-02-01', 10000, cashFlows, 5);

    // 15 days at 10000, 16 days at 15000
    const expected = 10000 * dailyRate(5) * 15 + 15000 * dailyRate(5) * 16;
    expect(result.interestEarned).toBeCloseTo(expected, 6);
    expect(result.endBalance).toBe(15000);
    expect(result.totalDeposited).toBe(5000);
  });

  it('handles a withdrawal', () => {
    const cashFlows = [{ date: '2025-01-16', amount: -3000 }];
    const result = calculateDailyInterest('2025-01-01', '2025-02-01', 10000, cashFlows, 5);

    const expected = 10000 * dailyRate(5) * 15 + 7000 * dailyRate(5) * 16;
    expect(result.interestEarned).toBeCloseTo(expected, 6);
    expect(result.endBalance).toBe(7000);
    expect(result.totalDeposited).toBe(-3000);
  });

  it('clamps withdrawal so balance does not go below 0', () => {
    const cashFlows = [{ date: '2025-01-16', amount: -20000 }];
    const result = calculateDailyInterest('2025-01-01', '2025-02-01', 10000, cashFlows, 5);

    // Clamped to -10000, balance becomes 0
    const expected = 10000 * dailyRate(5) * 15 + 0 * dailyRate(5) * 16;
    expect(result.interestEarned).toBeCloseTo(expected, 6);
    expect(result.endBalance).toBe(0);
    expect(result.totalDeposited).toBe(-10000);
  });

  it('handles multiple cash flows in correct order', () => {
    const cashFlows = [
      { date: '2025-01-21', amount: -2000 },
      { date: '2025-01-11', amount: 5000 },
    ];
    const result = calculateDailyInterest('2025-01-01', '2025-02-01', 10000, cashFlows, 5);

    // 10 days at 10000, 10 days at 15000, 11 days at 13000
    const expected =
      10000 * dailyRate(5) * 10 +
      15000 * dailyRate(5) * 10 +
      13000 * dailyRate(5) * 11;
    expect(result.interestEarned).toBeCloseTo(expected, 6);
    expect(result.endBalance).toBe(13000);
    expect(result.totalDeposited).toBe(3000);
  });

  it('ignores cash flows outside the period', () => {
    const cashFlows = [
      { date: '2024-12-15', amount: 5000 },
      { date: '2025-02-15', amount: 5000 },
    ];
    const result = calculateDailyInterest('2025-01-01', '2025-02-01', 10000, cashFlows, 5);
    const expected = 10000 * dailyRate(5) * 31;
    expect(result.interestEarned).toBeCloseTo(expected, 6);
    expect(result.totalDeposited).toBe(0);
  });
});

describe('daily interest integration', () => {
  const calculator = new AccountCalculator();

  it('mid-period deposit yields less interest than start-of-period deposit', () => {
    const startOfPeriod: CashFlow[] = [{
      id: '1', date: '2025-02-01', amount: 5000, description: 'Storting',
    }];
    const midPeriod: CashFlow[] = [{
      id: '1', date: '2025-02-15', amount: 5000, description: 'Storting',
    }];

    const inputStart = new BankAccountInput(10000, 5, 12, PayoutInterval.Monthly, InterestType.Compound, '2025-01-01', startOfPeriod);
    const inputMid = new BankAccountInput(10000, 5, 12, PayoutInterval.Monthly, InterestType.Compound, '2025-01-01', midPeriod);

    const resultStart = calculator.calculate(inputStart);
    const resultMid = calculator.calculate(inputMid);

    // Mid-period deposit should earn less total interest (deposit earns for fewer days in Feb)
    expect(resultMid.totalInterest).toBeLessThan(resultStart.totalInterest);
  });

  it('deposit on day 1 of period still earns full period interest', () => {
    const cashFlows: CashFlow[] = [{
      id: '1', date: '2025-02-01', amount: 5000, description: 'Storting',
    }];

    const inputWithCf = new BankAccountInput(10000, 5, 12, PayoutInterval.Monthly, InterestType.Compound, '2025-01-01', cashFlows);
    const result = inputWithCf ? calculator.calculate(inputWithCf) : null;

    // Period 2 (Feb): deposit on Feb 1 means 15000 for the whole month
    // The daily calculation should give very close to the full-period result
    expect(result!.periods[1].deposited).toBe(5000);
    expect(result!.periods[1].interestEarned).toBeGreaterThan(0);
  });

  it('works with simple interest and mid-period deposit', () => {
    const startOfPeriod: CashFlow[] = [{
      id: '1', date: '2025-02-01', amount: 5000, description: 'Storting',
    }];
    const midPeriod: CashFlow[] = [{
      id: '1', date: '2025-02-15', amount: 5000, description: 'Storting',
    }];

    const inputStart = new BankAccountInput(10000, 5, 12, PayoutInterval.Monthly, InterestType.Simple, '2025-01-01', startOfPeriod);
    const inputMid = new BankAccountInput(10000, 5, 12, PayoutInterval.Monthly, InterestType.Simple, '2025-01-01', midPeriod);

    const resultStart = calculator.calculate(inputStart);
    const resultMid = calculator.calculate(inputMid);

    expect(resultMid.totalInterest).toBeLessThan(resultStart.totalInterest);
  });
});
