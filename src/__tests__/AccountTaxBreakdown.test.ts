import { describe, it, expect } from 'vitest';
import { AccountTaxBreakdown, type AccountTaxYear } from '../models/AccountTaxBreakdown';
import { Box3Regime } from '../enums/Box3Regime';

function year(calendarYear: number, grossReturn: number, tax: number): AccountTaxYear {
  return { calendarYear, capital: 0, grossReturn, tax, netReturn: grossReturn - tax, regime: Box3Regime.Forfaitair2026 };
}

describe('AccountTaxBreakdown', () => {
  it('sums gross interest, tax and net over all years', () => {
    const b = new AccountTaxBreakdown([year(2026, 1000, 360), year(2027, 1200, 400)], 0, 0, 2026);
    expect(b.grossTotalInterest).toBe(2200);
    expect(b.totalTax).toBe(760);
    expect(b.netTotalInterest).toBe(1440);
  });

  it('exposes the figures for the current year', () => {
    const b = new AccountTaxBreakdown([year(2026, 1000, 360), year(2027, 1200, 400)], 0, 0, 2027);
    expect(b.grossThisYear).toBe(1200);
    expect(b.taxThisYear).toBe(400);
    expect(b.netThisYear).toBe(800);
  });

  it('returns zero current-year figures when the year is not in the projection', () => {
    const b = new AccountTaxBreakdown([year(2026, 1000, 360)], 0, 0, 2030);
    expect(b.grossThisYear).toBe(0);
    expect(b.taxThisYear).toBe(0);
    expect(b.netThisYear).toBe(0);
  });

  it('spreads the year tax across months by interest share', () => {
    const b = new AccountTaxBreakdown([year(2026, 1000, 360)], 100, 0, 2026);
    expect(b.taxThisMonth).toBeCloseTo(36, 6);
    expect(b.netInterestThisMonth).toBeCloseTo(64, 6);
  });

  it('has no monthly tax when there is no interest in the current year', () => {
    const b = new AccountTaxBreakdown([], 0, 0, 2026);
    expect(b.taxThisMonth).toBe(0);
    expect(b.netInterestThisMonth).toBe(0);
  });

  it('nets the total tax off the end amount', () => {
    const b = new AccountTaxBreakdown([year(2026, 1000, 360), year(2027, 1200, 400)], 0, 105000, 2026);
    expect(b.netEndAmount).toBe(105000 - 760);
  });
});
