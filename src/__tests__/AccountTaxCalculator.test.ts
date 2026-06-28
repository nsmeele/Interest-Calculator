import { describe, it, expect } from 'vitest';
import { AccountTaxCalculator } from '../calculator/AccountTaxCalculator';
import { AccountCalculator } from '../calculator/AccountCalculator';
import { BankAccountInput } from '../models/BankAccountInput';
import { PayoutInterval } from '../enums/PayoutInterval';
import { InterestType } from '../enums/InterestType';
import { AccountType } from '../enums/AccountType';
import { Box3Regime } from '../enums/Box3Regime';
import { projectedBalanceAt } from '../utils/projectedBalance';
import {
  BOX3_TAX_RATE,
  BOX3_FORFAIT_SAVINGS_2026,
  BOX3_FORFAIT_INVESTMENTS_2026,
} from '../constants/box3';
import type { TaxSettings } from '../context/taxSettingsContextValue';

const accountCalc = new AccountCalculator();
const taxCalc = new AccountTaxCalculator();

const FORFAITAIR: TaxSettings = { useActualReturnFrom2028: false, hasFiscalPartner: false, applyExemption: false };
const ACTUAL: TaxSettings = { useActualReturnFrom2028: true, hasFiscalPartner: false, applyExemption: false };

function makeAccount(overrides: Partial<{
  startAmount: number;
  rate: number;
  durationMonths: number;
  startDate: string;
  accountType: AccountType;
}> = {}) {
  return accountCalc.calculate(new BankAccountInput(
    overrides.startAmount ?? 100000,
    overrides.rate ?? 5,
    overrides.durationMonths ?? 12,
    PayoutInterval.Annually,
    InterestType.Compound,
    overrides.startDate ?? '2026-01-01',
    [], false, undefined, [], false,
    undefined,
    overrides.accountType,
  ));
}

function forfaitairTax(capital: number, forfait: number): number {
  return capital * forfait * BOX3_TAX_RATE;
}

describe('AccountTaxCalculator', () => {
  it('produces one row per calendar year of the projection', () => {
    const breakdown = taxCalc.calculate(makeAccount({ durationMonths: 36 }), FORFAITAIR, 2026);
    expect(breakdown.years.map((y) => y.calendarYear)).toEqual([2026, 2027, 2028]);
  });

  it('keeps the gross total interest equal to the account total interest', () => {
    const account = makeAccount({ durationMonths: 36 });
    const breakdown = taxCalc.calculate(account, FORFAITAIR, 2026);
    expect(breakdown.grossTotalInterest).toBeCloseTo(account.totalInterest, 6);
  });

  describe('forfaitair regime', () => {
    it('taxes the peildatum capital with the savings forfait', () => {
      const account = makeAccount({ durationMonths: 36, accountType: AccountType.Savings });
      const breakdown = taxCalc.calculate(account, FORFAITAIR, 2026);

      for (const row of breakdown.years) {
        const capital = projectedBalanceAt(account, `${row.calendarYear}-01-01`);
        expect(row.capital).toBeCloseTo(capital, 6);
        expect(row.tax).toBeCloseTo(forfaitairTax(capital, BOX3_FORFAIT_SAVINGS_2026), 6);
        expect(row.regime).toBe(Box3Regime.Forfaitair2026);
      }
    });

    it('uses the higher investment forfait for investment accounts', () => {
      const savings = taxCalc.calculate(makeAccount({ accountType: AccountType.Savings }), FORFAITAIR, 2026);
      const investments = taxCalc.calculate(makeAccount({ accountType: AccountType.Investment }), FORFAITAIR, 2026);
      expect(investments.years[0].tax).toBeCloseTo(forfaitairTax(savings.years[0].capital, BOX3_FORFAIT_INVESTMENTS_2026), 6);
      expect(investments.years[0].tax).toBeGreaterThan(savings.years[0].tax);
    });

    it('ignores the exemption per account: even small capital is taxed', () => {
      const breakdown = taxCalc.calculate(makeAccount({ startAmount: 1000 }), FORFAITAIR, 2026);
      expect(breakdown.years[0].tax).toBeGreaterThan(0);
      expect(breakdown.years[0].tax).toBeCloseTo(forfaitairTax(1000, BOX3_FORFAIT_SAVINGS_2026), 6);
    });

    it('charges no tax for the year before the account exists on the peildatum', () => {
      const account = makeAccount({ startDate: '2026-06-01', durationMonths: 18 });
      const breakdown = taxCalc.calculate(account, FORFAITAIR, 2026);
      const firstYear = breakdown.years.find((y) => y.calendarYear === 2026)!;
      expect(firstYear.capital).toBe(0);
      expect(firstYear.tax).toBe(0);
    });
  });

  describe('actual return regime', () => {
    it('taxes the realised return from 2028 when the toggle is on', () => {
      const breakdown = taxCalc.calculate(makeAccount({ durationMonths: 36 }), ACTUAL, 2026);
      const y2028 = breakdown.years.find((y) => y.calendarYear === 2028)!;
      expect(y2028.regime).toBe(Box3Regime.Actual2028);
      expect(y2028.tax).toBeCloseTo(y2028.grossReturn * BOX3_TAX_RATE, 6);
      expect(y2028.netReturn).toBeCloseTo(y2028.grossReturn * (1 - BOX3_TAX_RATE), 6);
    });

    it('still applies forfaitair before 2028', () => {
      const account = makeAccount({ durationMonths: 36 });
      const breakdown = taxCalc.calculate(account, ACTUAL, 2026);
      const y2026 = breakdown.years.find((y) => y.calendarYear === 2026)!;
      expect(y2026.regime).toBe(Box3Regime.Forfaitair2026);
      expect(y2026.tax).toBeCloseTo(forfaitairTax(y2026.capital, BOX3_FORFAIT_SAVINGS_2026), 6);
    });

    it('keeps forfaitair in 2028 when the toggle is off', () => {
      const account = makeAccount({ startDate: '2028-01-01' });
      const breakdown = taxCalc.calculate(account, FORFAITAIR, 2028);
      const y2028 = breakdown.years.find((y) => y.calendarYear === 2028)!;
      expect(y2028.regime).toBe(Box3Regime.Forfaitair2026);
      expect(y2028.tax).toBeCloseTo(forfaitairTax(y2028.capital, BOX3_FORFAIT_SAVINGS_2026), 6);
    });
  });
});
