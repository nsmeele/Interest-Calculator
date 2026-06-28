import type { BankAccount } from '../models/BankAccount';
import type { TaxSettings } from '../context/taxSettingsContextValue';
import { AccountTaxBreakdown, type AccountTaxYear } from '../models/AccountTaxBreakdown';
import { Box3TaxStrategyFactory } from '../factories/Box3TaxStrategyFactory';
import { Box3Regime } from '../enums/Box3Regime';
import { toAssetClass } from '../enums/AssetClass';
import { BOX3_ACTUAL_RETURN_START_YEAR } from '../constants/box3';
import { projectedBalanceAt } from '../utils/projectedBalance';

// The statutory exemption applies once across a person's whole box 3 wealth, not
// per account, so a single account is always computed without it.
const PER_ACCOUNT_EXEMPTION = 0;

export class AccountTaxCalculator {
  calculate(account: BankAccount, settings: TaxSettings, currentYear: number): AccountTaxBreakdown {
    const grossByYear = new Map<number, number>();
    for (const [monthKey, interest] of account.calendarMonthProjection) {
      const year = Number(monthKey.slice(0, 4));
      grossByYear.set(year, (grossByYear.get(year) ?? 0) + interest);
    }

    const assetClass = toAssetClass(account.accountType);

    const years: AccountTaxYear[] = [...grossByYear.keys()]
      .sort((a, b) => a - b)
      .map((calendarYear) => {
        const grossReturn = grossByYear.get(calendarYear)!;
        const regime = this.regimeForYear(settings, calendarYear);
        const capital = this.capitalAtPeildatum(account, calendarYear);
        const tax = Box3TaxStrategyFactory.create(regime).annualTax({
          capital,
          actualReturn: grossReturn,
          assetClass,
          exemption: PER_ACCOUNT_EXEMPTION,
        });
        return { calendarYear, capital, grossReturn, tax, netReturn: grossReturn - tax, regime };
      });

    return new AccountTaxBreakdown(years, account.interestThisMonth, account.endAmount, currentYear);
  }

  private regimeForYear(settings: TaxSettings, calendarYear: number): Box3Regime {
    const useActual = settings.useActualReturnFrom2028 && calendarYear >= BOX3_ACTUAL_RETURN_START_YEAR;
    return useActual ? Box3Regime.Actual2028 : Box3Regime.Forfaitair2026;
  }

  // Box 3 measures capital on 1 January; an account not yet opened on that date
  // contributes nothing to the taxable base for that year.
  private capitalAtPeildatum(account: BankAccount, calendarYear: number): number {
    const peildatum = `${calendarYear}-01-01`;
    if (!account.startDate || peildatum < account.startDate) return 0;
    return projectedBalanceAt(account, peildatum);
  }
}
