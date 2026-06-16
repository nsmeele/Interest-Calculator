import { SavingsVsInvestmentInput } from '../models/SavingsVsInvestmentInput';
import { SavingsVsInvestmentResult, type YearProjection } from '../models/SavingsVsInvestmentResult';
import { Box3TaxStrategyFactory } from '../factories/Box3TaxStrategyFactory';
import { AssetClass } from '../enums/AssetClass';
import { Box3Regime } from '../enums/Box3Regime';
import {
  BOX3_TAX_FREE_CAPITAL_2026,
  BOX3_TAX_FREE_RETURN_2028,
  BOX3_ACTUAL_RETURN_START_YEAR,
  FISCAL_PARTNER_MULTIPLIER,
} from '../constants/box3';

/**
 * Vergelijkt het netto eindbedrag van sparen versus beleggen onder box 3.
 *
 * Voor elke optie wordt jaar voor jaar geprojecteerd: het saldo groeit met het
 * (verwachte) rendement, waarna de box 3-heffing over dat jaar uit het saldo
 * wordt betaald. De peildatum is het saldo aan het begin van elk jaar.
 *
 * Het stelsel wordt per kalenderjaar bepaald: t/m 2027 altijd forfaitair, en
 * vanaf 2028 werkelijk rendement zodra de gebruiker dat heeft aangezet.
 */
export class SavingsVsInvestmentCalculator {
  calculate(input: SavingsVsInvestmentInput): SavingsVsInvestmentResult {
    const savings = this.project(input, AssetClass.Savings, input.savingsRate);
    const investments = this.project(input, AssetClass.Investments, input.investmentReturn);

    return new SavingsVsInvestmentResult(input.initialAmount, savings, investments, input.currency);
  }

  /** Bepaalt het stelsel voor een kalenderjaar op basis van de toggle. */
  private regimeForYear(input: SavingsVsInvestmentInput, calendarYear: number): Box3Regime {
    const useActual = input.useActualReturnFrom2028 && calendarYear >= BOX3_ACTUAL_RETURN_START_YEAR;
    return useActual ? Box3Regime.Actual2028 : Box3Regime.Forfaitair2026;
  }

  /** De toepasselijke vrijstelling voor een stelsel; nul als de vrijstelling niet wordt toegepast. */
  private exemptionForRegime(input: SavingsVsInvestmentInput, regime: Box3Regime): number {
    if (!input.applyExemption) return 0;
    const base =
      regime === Box3Regime.Forfaitair2026 ? BOX3_TAX_FREE_CAPITAL_2026 : BOX3_TAX_FREE_RETURN_2028;
    const multiplier = input.hasFiscalPartner ? FISCAL_PARTNER_MULTIPLIER : 1;
    return base * multiplier;
  }

  private project(
    input: SavingsVsInvestmentInput,
    assetClass: AssetClass,
    ratePercent: number,
  ): YearProjection[] {
    const rate = ratePercent / 100;
    const projections: YearProjection[] = [];
    let balance = input.initialAmount;

    for (let year = 1; year <= input.years; year++) {
      const calendarYear = input.startYear + (year - 1);
      const regime = this.regimeForYear(input, calendarYear);
      const strategy = Box3TaxStrategyFactory.create(regime);
      const exemption = this.exemptionForRegime(input, regime);

      const startBalance = balance;
      const grossReturn = startBalance * rate;
      const tax = strategy.annualTax({
        capital: startBalance,
        actualReturn: grossReturn,
        assetClass,
        exemption,
        savingsForfait: input.savingsForfait,
      });
      const netReturn = grossReturn - tax;
      const endBalance = startBalance + netReturn;

      projections.push({ year, calendarYear, startBalance, grossReturn, tax, netReturn, endBalance });
      balance = endBalance;
    }

    return projections;
  }
}
