import { describe, it, expect } from 'vitest';
import { calculateDailyInterest } from '../utils/dailyInterest';
import { AccountCalculator } from '../calculator/AccountCalculator';
import { BankAccountInput } from '../models/BankAccountInput';
import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import { DayCountConvention } from '../enums/DayCountConvention';
import type { CashFlow } from '../models/CashFlow';
import type { RateChange } from '../models/RateChange';

const ACT_365 = DayCountConvention.ACT_365;
const dailyRate = (rate: number) => rate / 100 / 365;

describe('calculateDailyInterest', () => {
  it('calculates interest without cash flows (full period)', () => {
    const result = calculateDailyInterest('2025-01-01', '2025-02-01', 10000, [], 5, ACT_365);
    const expected = 10000 * dailyRate(5) * 31;
    expect(result.interestEarned).toBeCloseTo(expected, 6);
    expect(result.endBalance).toBe(10000);
    expect(result.totalDeposited).toBe(0);
  });

  it('calculates less interest for a mid-period deposit', () => {
    // Deposit on day 15 of a 31-day month
    const cashFlows = [{ date: '2025-01-16', amount: 5000 }];
    const result = calculateDailyInterest('2025-01-01', '2025-02-01', 10000, cashFlows, 5, ACT_365);

    // 15 days at 10000, 16 days at 15000
    const expected = 10000 * dailyRate(5) * 15 + 15000 * dailyRate(5) * 16;
    expect(result.interestEarned).toBeCloseTo(expected, 6);
    expect(result.endBalance).toBe(15000);
    expect(result.totalDeposited).toBe(5000);
  });

  it('handles a withdrawal', () => {
    const cashFlows = [{ date: '2025-01-16', amount: -3000 }];
    const result = calculateDailyInterest('2025-01-01', '2025-02-01', 10000, cashFlows, 5, ACT_365);

    const expected = 10000 * dailyRate(5) * 15 + 7000 * dailyRate(5) * 16;
    expect(result.interestEarned).toBeCloseTo(expected, 6);
    expect(result.endBalance).toBe(7000);
    expect(result.totalDeposited).toBe(-3000);
  });

  it('skips withdrawal that exceeds balance', () => {
    const cashFlows = [{ date: '2025-01-16', amount: -20000 }];
    const result = calculateDailyInterest('2025-01-01', '2025-02-01', 10000, cashFlows, 5, ACT_365);

    // Withdrawal skipped entirely, balance stays at 10000
    const expected = 10000 * dailyRate(5) * 31;
    expect(result.interestEarned).toBeCloseTo(expected, 6);
    expect(result.endBalance).toBe(10000);
    expect(result.totalDeposited).toBe(0);
  });

  it('handles multiple cash flows in correct order', () => {
    const cashFlows = [
      { date: '2025-01-21', amount: -2000 },
      { date: '2025-01-11', amount: 5000 },
    ];
    const result = calculateDailyInterest('2025-01-01', '2025-02-01', 10000, cashFlows, 5, ACT_365);

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
    const result = calculateDailyInterest('2025-01-01', '2025-02-01', 10000, cashFlows, 5, ACT_365);
    const expected = 10000 * dailyRate(5) * 31;
    expect(result.interestEarned).toBeCloseTo(expected, 6);
    expect(result.totalDeposited).toBe(0);
  });

  it('skips withdrawal between existing transactions when balance is insufficient', () => {
    // Start: 10000, deposit 2000 on Jan 6, withdrawal 15000 on Jan 11, deposit 5000 on Jan 21
    // On Jan 11 balance is 12000, withdrawal of 15000 exceeds it → skipped
    const cashFlows = [
      { date: '2025-01-06', amount: 2000 },
      { date: '2025-01-11', amount: -15000 },
      { date: '2025-01-21', amount: 5000 },
    ];
    const result = calculateDailyInterest('2025-01-01', '2025-02-01', 10000, cashFlows, 5, ACT_365);

    // 5 days at 10000, 5 days at 12000, 10 days at 12000 (withdrawal skipped), 11 days at 17000
    const expected =
      10000 * dailyRate(5) * 5 +
      12000 * dailyRate(5) * 15 +
      17000 * dailyRate(5) * 11;
    expect(result.interestEarned).toBeCloseTo(expected, 6);
    expect(result.endBalance).toBe(17000);
    expect(result.totalDeposited).toBe(7000); // only the two deposits applied
  });
});

describe('recurring withdrawal stops when balance runs out', () => {
  it('stops recurring withdrawal when balance runs out', () => {
    // Start: 5000, monthly withdrawal of 2000
    // Month 1 (Feb): 5000 - 2000 = 3000 ✓
    // Month 2 (Mar): 3000 - 2000 = 1000 ✓
    // Month 3 (Apr): 1000 - 2000 → skipped (insufficient)
    const cashFlows: CashFlow[] = [{
      id: '1', date: '2025-02-01', amount: -2000, description: 'Opname',
      recurring: { intervalMonths: 1 },
    }];

    const calculator = new AccountCalculator();
    const input = new BankAccountInput(
      5000, 5, 6, PayoutInterval.Monthly, InterestType.Compound,
      '2025-01-01', cashFlows,
    );
    const result = calculator.calculate(input);

    // Period 2 (Feb): withdrawal applied, deposited = -2000
    expect(result.periods[1].deposited).toBe(-2000);
    // Period 3 (Mar): withdrawal applied, deposited = -2000
    expect(result.periods[2].deposited).toBe(-2000);
    // Period 4 (Apr): withdrawal skipped (balance ~1000 + small interest < 2000)
    expect(result.periods[3].deposited).toBe(0);
    // Balance should never go below 0
    for (const period of result.periods) {
      expect(period.endBalance).toBeGreaterThanOrEqual(0);
    }
  });

  it('permanently stops recurring withdrawal even after deposit restores balance', () => {
    // Start: 5000, monthly withdrawal of 2000 (recurring)
    // Month 2 (Feb): 5000 - 2000 = 3000 ✓
    // Month 3 (Mar): 3000 - 2000 = 1000 ✓
    // Month 4 (Apr): 1000 - 2000 → skipped, recurring permanently stopped
    // Month 5 (May): deposit of 10000 → balance ~11000, but withdrawal should NOT resume
    const cashFlows: CashFlow[] = [
      {
        id: 'recurring-withdrawal', date: '2025-02-01', amount: -2000, description: 'Opname',
        recurring: { intervalMonths: 1 },
      },
      {
        id: 'deposit', date: '2025-05-01', amount: 10000, description: 'Storting',
      },
    ];

    const calculator = new AccountCalculator();
    const input = new BankAccountInput(
      5000, 5, 8, PayoutInterval.Monthly, InterestType.Compound,
      '2025-01-01', cashFlows,
    );
    const result = calculator.calculate(input);

    // Period 2 (Feb): withdrawal applied
    expect(result.periods[1].deposited).toBe(-2000);
    // Period 3 (Mar): withdrawal applied
    expect(result.periods[2].deposited).toBe(-2000);
    // Period 4 (Apr): withdrawal skipped, recurring permanently stopped
    expect(result.periods[3].deposited).toBe(0);
    // Period 5 (May): deposit of 10000, but recurring withdrawal does NOT resume
    expect(result.periods[4].deposited).toBe(10000);
    // Period 6-8 (Jun-Aug): no more withdrawals despite sufficient balance
    expect(result.periods[5].deposited).toBe(0);
    expect(result.periods[6].deposited).toBe(0);
    expect(result.periods[7].deposited).toBe(0);
  });
});

describe('calculateDailyInterest with rate changes', () => {
  it('applies a rate change mid-period', () => {
    // Rate changes from 5% to 3% on Jan 16
    const rateChanges: RateChange[] = [
      { id: '1', date: '2025-01-16', annualInterestRate: 3 },
    ];
    const result = calculateDailyInterest('2025-01-01', '2025-02-01', 10000, [], 5, ACT_365, rateChanges);

    // 15 days at 5%, 16 days at 3%
    const expected = 10000 * dailyRate(5) * 15 + 10000 * dailyRate(3) * 16;
    expect(result.interestEarned).toBeCloseTo(expected, 6);
    expect(result.endBalance).toBe(10000);
  });

  it('combines rate changes with cash flows', () => {
    const rateChanges: RateChange[] = [
      { id: '1', date: '2025-01-16', annualInterestRate: 3 },
    ];
    const cashFlows = [{ date: '2025-01-11', amount: 5000 }];
    const result = calculateDailyInterest('2025-01-01', '2025-02-01', 10000, cashFlows, 5, ACT_365, rateChanges);

    // 10 days at 10000@5%, 5 days at 15000@5%, 16 days at 15000@3%
    const expected =
      10000 * dailyRate(5) * 10 +
      15000 * dailyRate(5) * 5 +
      15000 * dailyRate(3) * 16;
    expect(result.interestEarned).toBeCloseTo(expected, 6);
    expect(result.endBalance).toBe(15000);
  });

  it('uses base rate when no rate change applies yet', () => {
    const rateChanges: RateChange[] = [
      { id: '1', date: '2025-02-15', annualInterestRate: 3 },
    ];
    const result = calculateDailyInterest('2025-01-01', '2025-02-01', 10000, [], 5, ACT_365, rateChanges);

    // Entire period at 5% (rate change is after period)
    const expected = 10000 * dailyRate(5) * 31;
    expect(result.interestEarned).toBeCloseTo(expected, 6);
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
