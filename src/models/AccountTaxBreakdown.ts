import type { Box3Regime } from '../enums/Box3Regime';

export interface AccountTaxYear {
  calendarYear: number;
  capital: number;
  grossReturn: number;
  tax: number;
  netReturn: number;
  regime: Box3Regime;
}

export class AccountTaxBreakdown {
  constructor(
    public readonly years: AccountTaxYear[],
    public readonly grossInterestThisMonth: number,
    public readonly grossEndAmount: number,
    private readonly currentYear: number,
  ) {}

  get grossTotalInterest(): number {
    return this.years.reduce((sum, y) => sum + y.grossReturn, 0);
  }

  get totalTax(): number {
    return this.years.reduce((sum, y) => sum + y.tax, 0);
  }

  get netTotalInterest(): number {
    return this.grossTotalInterest - this.totalTax;
  }

  get grossThisYear(): number {
    return this.currentYearRow?.grossReturn ?? 0;
  }

  get taxThisYear(): number {
    return this.currentYearRow?.tax ?? 0;
  }

  get netThisYear(): number {
    return this.grossThisYear - this.taxThisYear;
  }

  // The forfaitair regime taxes capital, not return, so the year's tax is spread
  // across months by each month's share of that year's interest.
  get taxThisMonth(): number {
    if (this.grossThisYear === 0) return 0;
    return this.taxThisYear * (this.grossInterestThisMonth / this.grossThisYear);
  }

  get netInterestThisMonth(): number {
    return this.grossInterestThisMonth - this.taxThisMonth;
  }

  get netEndAmount(): number {
    return this.grossEndAmount - this.totalTax;
  }

  private get currentYearRow(): AccountTaxYear | undefined {
    return this.years.find((y) => y.calendarYear === this.currentYear);
  }
}
