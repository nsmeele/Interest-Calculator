import { describe, it, expect } from 'vitest';
import { projectedBalanceAt } from '../utils/projectedBalance';
import { AccountCalculator } from '../calculator/AccountCalculator';
import { BankAccountInput } from '../models/BankAccountInput';
import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';

const calc = new AccountCalculator();

function makeAccount() {
  return calc.calculate(new BankAccountInput(
    100000, 5, 12,
    PayoutInterval.Annually, InterestType.Compound, '2026-01-01',
  ));
}

describe('projectedBalanceAt', () => {
  it('returns the start amount on the start date', () => {
    expect(projectedBalanceAt(makeAccount(), '2026-01-01')).toBeCloseTo(100000, 6);
  });

  it('returns the start amount for a date before the account starts', () => {
    expect(projectedBalanceAt(makeAccount(), '2025-06-01')).toBeCloseTo(100000, 6);
  });

  it('grows the balance with credited interest partway through', () => {
    const monthlyCompound = calc.calculate(new BankAccountInput(
      100000, 5, 12,
      PayoutInterval.Monthly, InterestType.Compound, '2026-01-01',
    ));
    const balance = projectedBalanceAt(monthlyCompound, '2026-07-01');
    expect(balance).toBeGreaterThan(100000);
    expect(balance).toBeLessThan(105000);
  });

  it('returns the final balance at the end of the term', () => {
    expect(projectedBalanceAt(makeAccount(), '2027-01-01')).toBeCloseTo(105000, 0);
  });

  it('returns the start amount when there is no projection', () => {
    const account = calc.calculate(new BankAccountInput(
      5000, 3, 12, PayoutInterval.Annually, InterestType.Compound, undefined,
    ));
    expect(projectedBalanceAt(account, '2026-01-01')).toBe(5000);
  });
});
