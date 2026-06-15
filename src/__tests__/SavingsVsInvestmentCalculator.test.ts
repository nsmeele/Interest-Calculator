import { describe, it, expect } from 'vitest';
import { SavingsVsInvestmentCalculator } from '../calculator/SavingsVsInvestmentCalculator';
import { SavingsVsInvestmentInput } from '../models/SavingsVsInvestmentInput';
import { AssetClass } from '../enums/AssetClass';
import {
  BOX3_TAX_RATE,
  BOX3_FORFAIT_SAVINGS_2026,
  BOX3_FORFAIT_INVESTMENTS_2026,
  BOX3_TAX_FREE_CAPITAL_2026,
  BOX3_TAX_FREE_RETURN_2028,
} from '../constants/box3';

const calculator = new SavingsVsInvestmentCalculator();

function makeInput(overrides: Partial<{
  initialAmount: number;
  years: number;
  savingsRate: number;
  investmentReturn: number;
  startYear: number;
  useActualReturnFrom2028: boolean;
  hasFiscalPartner: boolean;
  applyExemption: boolean;
}> = {}) {
  return new SavingsVsInvestmentInput(
    overrides.initialAmount ?? 100000,
    overrides.years ?? 10,
    overrides.savingsRate ?? 2,
    overrides.investmentReturn ?? 7,
    overrides.startYear ?? 2026,
    overrides.useActualReturnFrom2028 ?? false,
    overrides.hasFiscalPartner ?? false,
    overrides.applyExemption ?? true,
  );
}

/** Verwachte forfaitaire heffing over een peildatum-vermogen. */
function forfaitairTax(capital: number, forfait: number, exemption = BOX3_TAX_FREE_CAPITAL_2026): number {
  return Math.max(0, capital - exemption) * forfait * BOX3_TAX_RATE;
}

/** Verwachte heffing over werkelijk rendement. */
function actualTax(grossReturn: number, exemption = BOX3_TAX_FREE_RETURN_2028): number {
  return Math.max(0, grossReturn - exemption) * BOX3_TAX_RATE;
}

describe('SavingsVsInvestmentCalculator', () => {
  it('produces one projection row per year for both options', () => {
    const result = calculator.calculate(makeInput({ years: 10 }));
    expect(result.savings).toHaveLength(10);
    expect(result.investments).toHaveLength(10);
  });

  it('anchors each projection year to a calendar year starting at startYear', () => {
    const result = calculator.calculate(makeInput({ years: 3, startYear: 2026 }));
    expect(result.savings.map((p) => p.calendarYear)).toEqual([2026, 2027, 2028]);
    expect(result.investments.map((p) => p.calendarYear)).toEqual([2026, 2027, 2028]);
  });

  describe('forfaitair years (up to 2027 / toggle off)', () => {
    it('computes the first-year net balance for savings and investments', () => {
      const result = calculator.calculate(makeInput({ years: 1 }));

      const savingsTax = forfaitairTax(100000, BOX3_FORFAIT_SAVINGS_2026);
      expect(result.savings[0].grossReturn).toBeCloseTo(2000, 6);
      expect(result.savings[0].tax).toBeCloseTo(savingsTax, 6);
      expect(result.savings[0].endBalance).toBeCloseTo(100000 + 2000 - savingsTax, 6);

      const investTax = forfaitairTax(100000, BOX3_FORFAIT_INVESTMENTS_2026);
      expect(result.investments[0].grossReturn).toBeCloseTo(7000, 6);
      expect(result.investments[0].tax).toBeCloseTo(investTax, 6);
      expect(result.investments[0].endBalance).toBeCloseTo(100000 + 7000 - investTax, 6);
    });

    it('favours investing when the return clearly exceeds the savings rate', () => {
      const result = calculator.calculate(makeInput({ years: 10 }));
      expect(result.winner).toBe(AssetClass.Investments);
      expect(result.difference).toBeGreaterThan(0);
    });

    it('favours saving when both yield the same return, because investments are taxed at a higher forfait', () => {
      const result = calculator.calculate(makeInput({ years: 10, savingsRate: 4, investmentReturn: 4 }));
      expect(result.winner).toBe(AssetClass.Savings);
      expect(result.totalInvestmentsTax).toBeGreaterThan(result.totalSavingsTax);
    });

    it('keeps using the forfaitair regime in 2028+ when the toggle is off', () => {
      const result = calculator.calculate(makeInput({ years: 1, startYear: 2028, useActualReturnFrom2028: false }));
      // Capital-based forfait, NOT the actual-return formula.
      expect(result.savings[0].tax).toBeCloseTo(forfaitairTax(100000, BOX3_FORFAIT_SAVINGS_2026), 6);
      expect(result.savings[0].tax).not.toBeCloseTo(actualTax(2000), 6);
    });
  });

  describe('actual return years (2028+ with toggle on)', () => {
    it('taxes the realised return above the tax-free return from 2028', () => {
      const result = calculator.calculate(makeInput({ years: 1, startYear: 2028, useActualReturnFrom2028: true }));
      expect(result.savings[0].tax).toBeCloseTo(actualTax(2000), 6);
      expect(result.investments[0].tax).toBeCloseTo(actualTax(7000), 6);
    });

    it('applies forfaitair up to 2027 and actual return from 2028 within the same projection', () => {
      const result = calculator.calculate(makeInput({ years: 3, startYear: 2026, useActualReturnFrom2028: true }));

      // 2026 + 2027: forfaitair (capital-based).
      expect(result.savings[0].calendarYear).toBe(2026);
      expect(result.savings[0].tax).toBeCloseTo(forfaitairTax(result.savings[0].startBalance, BOX3_FORFAIT_SAVINGS_2026), 6);
      expect(result.savings[1].calendarYear).toBe(2027);
      expect(result.savings[1].tax).toBeCloseTo(forfaitairTax(result.savings[1].startBalance, BOX3_FORFAIT_SAVINGS_2026), 6);

      // 2028: actual return (return-based).
      expect(result.savings[2].calendarYear).toBe(2028);
      expect(result.savings[2].tax).toBeCloseTo(actualTax(result.savings[2].grossReturn), 6);
    });
  });

  describe('exemptions', () => {
    it('doubles the exemption for a fiscal partner', () => {
      // With a partner the doubled exemption (€118.714) exceeds €100.000, so no tax is due.
      const result = calculator.calculate(makeInput({ years: 1, applyExemption: true, hasFiscalPartner: true }));
      expect(result.savings[0].tax).toBe(0);
      expect(result.investments[0].tax).toBe(0);
      expect(result.savings[0].endBalance).toBeCloseTo(102000, 6);
    });

    it('taxes the full base when the exemption is not applied', () => {
      const withExemption = calculator.calculate(makeInput({ years: 1, applyExemption: true }));
      const withoutExemption = calculator.calculate(makeInput({ years: 1, applyExemption: false }));

      // No exemption → the whole capital is the taxable base.
      expect(withoutExemption.investments[0].tax).toBeCloseTo(forfaitairTax(100000, BOX3_FORFAIT_INVESTMENTS_2026, 0), 6);
      expect(withoutExemption.investments[0].tax).toBeGreaterThan(withExemption.investments[0].tax);
    });

    it('applies the regime-specific exemption: capital for forfaitair, return for actual', () => {
      const forfaitair = calculator.calculate(makeInput({ years: 1, startYear: 2026, applyExemption: true }));
      expect(forfaitair.savings[0].tax).toBeCloseTo(forfaitairTax(100000, BOX3_FORFAIT_SAVINGS_2026, BOX3_TAX_FREE_CAPITAL_2026), 6);

      const actual = calculator.calculate(makeInput({ years: 1, startYear: 2028, useActualReturnFrom2028: true, applyExemption: true }));
      expect(actual.savings[0].tax).toBeCloseTo(actualTax(2000, BOX3_TAX_FREE_RETURN_2028), 6);
    });
  });

  it('compounds year over year (each year builds on the previous net balance)', () => {
    const result = calculator.calculate(makeInput({ years: 3 }));
    expect(result.savings[1].startBalance).toBeCloseTo(result.savings[0].endBalance, 6);
    expect(result.savings[2].startBalance).toBeCloseTo(result.savings[1].endBalance, 6);
  });

  it('returns the initial amount as the net end balance when the horizon is zero years', () => {
    const result = calculator.calculate(makeInput({ years: 0 }));
    expect(result.netSavingsEnd).toBe(100000);
    expect(result.netInvestmentsEnd).toBe(100000);
    expect(result.winner).toBe('tie');
  });
});
