import { describe, it, expect } from 'vitest';
import { ForfaitairTaxStrategy2026 } from '../strategies/ForfaitairTaxStrategy2026';
import { ActualReturnTaxStrategy2028 } from '../strategies/ActualReturnTaxStrategy2028';
import { AssetClass } from '../enums/AssetClass';
import {
  BOX3_TAX_RATE,
  BOX3_FORFAIT_SAVINGS_DEFAULT,
  BOX3_FORFAIT_INVESTMENTS_2026,
  BOX3_TAX_FREE_CAPITAL_2026,
  BOX3_TAX_FREE_RETURN_2028,
} from '../constants/box3';

describe('ForfaitairTaxStrategy2026', () => {
  const strategy = new ForfaitairTaxStrategy2026();
  const exemption = BOX3_TAX_FREE_CAPITAL_2026;
  const savingsForfait = BOX3_FORFAIT_SAVINGS_DEFAULT;

  it('taxes savings on the savings forfait from the context, above the exemption', () => {
    const tax = strategy.annualTax({
      capital: 100000,
      actualReturn: 2000,
      assetClass: AssetClass.Savings,
      exemption,
      savingsForfait,
    });
    const expected = (100000 - exemption) * savingsForfait * BOX3_TAX_RATE;
    expect(tax).toBeCloseTo(expected, 6);
  });

  it('uses the savings forfait supplied in the context (slider value)', () => {
    const customForfait = 0.02;
    const tax = strategy.annualTax({
      capital: 100000,
      actualReturn: 2000,
      assetClass: AssetClass.Savings,
      exemption,
      savingsForfait: customForfait,
    });
    const expected = (100000 - exemption) * customForfait * BOX3_TAX_RATE;
    expect(tax).toBeCloseTo(expected, 6);
  });

  it('taxes investments at the fixed investment forfait, ignoring the savings forfait', () => {
    const tax = strategy.annualTax({
      capital: 100000,
      actualReturn: 7000,
      assetClass: AssetClass.Investments,
      exemption,
      savingsForfait: 0.02,
    });
    const expected = (100000 - exemption) * BOX3_FORFAIT_INVESTMENTS_2026 * BOX3_TAX_RATE;
    expect(tax).toBeCloseTo(expected, 6);
  });

  it('does not depend on the actual return, only on the capital', () => {
    const base = { capital: 100000, assetClass: AssetClass.Savings, exemption, savingsForfait };
    const lowReturn = strategy.annualTax({ ...base, actualReturn: 0 });
    const highReturn = strategy.annualTax({ ...base, actualReturn: 50000 });
    expect(lowReturn).toBe(highReturn);
  });

  it('levies no tax when the capital is below the exemption', () => {
    const tax = strategy.annualTax({
      capital: 40000,
      actualReturn: 800,
      assetClass: AssetClass.Investments,
      exemption,
      savingsForfait,
    });
    expect(tax).toBe(0);
  });
});

describe('ActualReturnTaxStrategy2028', () => {
  const strategy = new ActualReturnTaxStrategy2028();
  const exemption = BOX3_TAX_FREE_RETURN_2028;
  const savingsForfait = BOX3_FORFAIT_SAVINGS_DEFAULT;

  it('taxes the actual return above the tax-free return', () => {
    const tax = strategy.annualTax({
      capital: 100000,
      actualReturn: 7000,
      assetClass: AssetClass.Investments,
      exemption,
      savingsForfait,
    });
    expect(tax).toBeCloseTo((7000 - exemption) * BOX3_TAX_RATE, 6);
  });

  it('does not depend on the capital, only on the actual return', () => {
    const base = { actualReturn: 5000, assetClass: AssetClass.Savings, exemption, savingsForfait };
    const lowCapital = strategy.annualTax({ ...base, capital: 1000 });
    const highCapital = strategy.annualTax({ ...base, capital: 9_000_000 });
    expect(lowCapital).toBe(highCapital);
  });

  it('levies no tax when the return is below the exemption', () => {
    const tax = strategy.annualTax({
      capital: 100000,
      actualReturn: 1000,
      assetClass: AssetClass.Savings,
      exemption,
      savingsForfait,
    });
    expect(tax).toBe(0);
  });
});
