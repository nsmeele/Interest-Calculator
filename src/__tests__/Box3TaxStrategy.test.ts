import { describe, it, expect } from 'vitest';
import { ForfaitairTaxStrategy2026 } from '../strategies/ForfaitairTaxStrategy2026';
import { ActualReturnTaxStrategy2028 } from '../strategies/ActualReturnTaxStrategy2028';
import { AssetClass } from '../enums/AssetClass';
import {
  BOX3_TAX_RATE,
  BOX3_FORFAIT_SAVINGS_2026,
  BOX3_FORFAIT_INVESTMENTS_2026,
  BOX3_TAX_FREE_CAPITAL_2026,
  BOX3_TAX_FREE_RETURN_2028,
} from '../constants/box3';

describe('ForfaitairTaxStrategy2026', () => {
  const strategy = new ForfaitairTaxStrategy2026();
  const exemption = BOX3_TAX_FREE_CAPITAL_2026;

  it('taxes savings on the forfait over the capital above the exemption', () => {
    const tax = strategy.annualTax({
      capital: 100000,
      actualReturn: 2000,
      assetClass: AssetClass.Savings,
      exemption,
    });
    const expected = (100000 - exemption) * BOX3_FORFAIT_SAVINGS_2026 * BOX3_TAX_RATE;
    expect(tax).toBeCloseTo(expected, 6);
  });

  it('taxes investments at the higher investment forfait', () => {
    const tax = strategy.annualTax({
      capital: 100000,
      actualReturn: 7000,
      assetClass: AssetClass.Investments,
      exemption,
    });
    const expected = (100000 - exemption) * BOX3_FORFAIT_INVESTMENTS_2026 * BOX3_TAX_RATE;
    expect(tax).toBeCloseTo(expected, 6);
  });

  it('does not depend on the actual return, only on the capital', () => {
    const base = { capital: 100000, assetClass: AssetClass.Savings, exemption };
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
    });
    expect(tax).toBe(0);
  });
});

describe('ActualReturnTaxStrategy2028', () => {
  const strategy = new ActualReturnTaxStrategy2028();
  const exemption = BOX3_TAX_FREE_RETURN_2028;

  it('taxes the actual return above the tax-free return', () => {
    const tax = strategy.annualTax({
      capital: 100000,
      actualReturn: 7000,
      assetClass: AssetClass.Investments,
      exemption,
    });
    expect(tax).toBeCloseTo((7000 - exemption) * BOX3_TAX_RATE, 6);
  });

  it('does not depend on the capital, only on the actual return', () => {
    const base = { actualReturn: 5000, assetClass: AssetClass.Savings, exemption };
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
    });
    expect(tax).toBe(0);
  });
});
