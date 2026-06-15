import { describe, it, expect } from 'vitest';
import { SavingsVsInvestmentCalculator } from '../calculator/SavingsVsInvestmentCalculator';
import { SavingsVsInvestmentInput } from '../models/SavingsVsInvestmentInput';
import { Box3Regime } from '../enums/Box3Regime';
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
  regime: Box3Regime;
  hasFiscalPartner: boolean;
  usedExemption: number;
}> = {}) {
  return new SavingsVsInvestmentInput(
    overrides.initialAmount ?? 100000,
    overrides.years ?? 10,
    overrides.savingsRate ?? 2,
    overrides.investmentReturn ?? 7,
    overrides.regime ?? Box3Regime.Forfaitair2026,
    overrides.hasFiscalPartner ?? false,
    overrides.usedExemption ?? 0,
  );
}

describe('SavingsVsInvestmentCalculator', () => {
  it('produces one projection row per year for both options', () => {
    const result = calculator.calculate(makeInput({ years: 10 }));
    expect(result.savings).toHaveLength(10);
    expect(result.investments).toHaveLength(10);
  });

  describe('forfaitair regime (2026)', () => {
    it('computes the first-year net balance for savings and investments', () => {
      const result = calculator.calculate(makeInput({ years: 1 }));
      const taxableBase = 100000 - BOX3_TAX_FREE_CAPITAL_2026;

      const savingsTax = taxableBase * BOX3_FORFAIT_SAVINGS_2026 * BOX3_TAX_RATE;
      expect(result.savings[0].grossReturn).toBeCloseTo(2000, 6);
      expect(result.savings[0].tax).toBeCloseTo(savingsTax, 6);
      expect(result.savings[0].endBalance).toBeCloseTo(100000 + 2000 - savingsTax, 6);

      const investTax = taxableBase * BOX3_FORFAIT_INVESTMENTS_2026 * BOX3_TAX_RATE;
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
  });

  describe('actual return regime (2028)', () => {
    it('taxes the realised return above the tax-free return', () => {
      const result = calculator.calculate(makeInput({ years: 1, regime: Box3Regime.Actual2028 }));

      const savingsTax = (2000 - BOX3_TAX_FREE_RETURN_2028) * BOX3_TAX_RATE;
      expect(result.savings[0].tax).toBeCloseTo(savingsTax, 6);

      const investTax = (7000 - BOX3_TAX_FREE_RETURN_2028) * BOX3_TAX_RATE;
      expect(result.investments[0].tax).toBeCloseTo(investTax, 6);
    });
  });

  describe('exemptions', () => {
    it('doubles the exemption for a fiscal partner', () => {
      // With a partner the doubled exemption (€118.714) exceeds €100.000, so no tax is due.
      const result = calculator.calculate(makeInput({ years: 1, hasFiscalPartner: true }));
      expect(result.savings[0].tax).toBe(0);
      expect(result.investments[0].tax).toBe(0);
      expect(result.savings[0].endBalance).toBeCloseTo(102000, 6);
    });

    it('reduces the exemption by the already-used portion', () => {
      const full = calculator.calculate(makeInput({ years: 1 }));
      const reduced = calculator.calculate(makeInput({ years: 1, usedExemption: BOX3_TAX_FREE_CAPITAL_2026 }));
      // With the whole exemption used up, the full capital is taxed, so tax is higher.
      expect(reduced.investments[0].tax).toBeGreaterThan(full.investments[0].tax);
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
