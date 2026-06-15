import { SavingsVsInvestmentInput } from '../models/SavingsVsInvestmentInput';
import { SavingsVsInvestmentResult, type YearProjection } from '../models/SavingsVsInvestmentResult';
import { Box3TaxStrategyFactory } from '../factories/Box3TaxStrategyFactory';
import type { IBox3TaxStrategy } from '../interfaces/IBox3TaxStrategy';
import { AssetClass } from '../enums/AssetClass';
import { Box3Regime } from '../enums/Box3Regime';
import {
  BOX3_TAX_FREE_CAPITAL_2026,
  BOX3_TAX_FREE_RETURN_2028,
  FISCAL_PARTNER_MULTIPLIER,
} from '../constants/box3';

/**
 * Vergelijkt het netto eindbedrag van sparen versus beleggen onder box 3.
 *
 * Voor elke optie wordt jaar voor jaar geprojecteerd: het saldo groeit met het
 * (verwachte) rendement, waarna de box 3-heffing over dat jaar uit het saldo
 * wordt betaald. De peildatum is het saldo aan het begin van elk jaar.
 */
export class SavingsVsInvestmentCalculator {
  calculate(input: SavingsVsInvestmentInput): SavingsVsInvestmentResult {
    const strategy = Box3TaxStrategyFactory.create(input.regime);
    const exemption = this.applicableExemption(input);

    const savings = this.project(input, strategy, exemption, AssetClass.Savings, input.savingsRate);
    const investments = this.project(input, strategy, exemption, AssetClass.Investments, input.investmentReturn);

    return new SavingsVsInvestmentResult(input.initialAmount, savings, investments, input.regime, input.currency);
  }

  /** De toepasselijke vrijstelling, gecorrigeerd voor partnerschap en reeds benut deel. */
  private applicableExemption(input: SavingsVsInvestmentInput): number {
    const base =
      input.regime === Box3Regime.Forfaitair2026
        ? BOX3_TAX_FREE_CAPITAL_2026
        : BOX3_TAX_FREE_RETURN_2028;
    const multiplier = input.hasFiscalPartner ? FISCAL_PARTNER_MULTIPLIER : 1;
    return Math.max(0, base * multiplier - input.usedExemption);
  }

  private project(
    input: SavingsVsInvestmentInput,
    strategy: IBox3TaxStrategy,
    exemption: number,
    assetClass: AssetClass,
    ratePercent: number,
  ): YearProjection[] {
    const rate = ratePercent / 100;
    const projections: YearProjection[] = [];
    let balance = input.initialAmount;

    for (let year = 1; year <= input.years; year++) {
      const startBalance = balance;
      const grossReturn = startBalance * rate;
      const tax = strategy.annualTax({ capital: startBalance, actualReturn: grossReturn, assetClass, exemption });
      const netReturn = grossReturn - tax;
      const endBalance = startBalance + netReturn;

      projections.push({ year, startBalance, grossReturn, tax, netReturn, endBalance });
      balance = endBalance;
    }

    return projections;
  }
}
