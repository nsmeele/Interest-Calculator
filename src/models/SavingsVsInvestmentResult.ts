import { AssetClass } from '../enums/AssetClass';

/** Eén jaar uit een meerjarige projectie. */
export interface YearProjection {
  /** 1-based jaarnummer. */
  year: number;
  /** Het kalenderjaar dat dit projectiejaar vertegenwoordigt. */
  calendarYear: number;
  /** Saldo aan het begin van het jaar (peildatum 1 januari). */
  startBalance: number;
  /** Brutorendement over het jaar (vóór belasting). */
  grossReturn: number;
  /** Box 3-heffing over het jaar. */
  tax: number;
  /** Nettorendement over het jaar (bruto − heffing). */
  netReturn: number;
  /** Saldo aan het einde van het jaar. */
  endBalance: number;
}

/** Uitslag wanneer sparen en beleggen netto evenveel opleveren. */
export const WINNER_TIE = 'tie';

/** Uitslag die de beste keuze ("winnaar") aanduidt. */
export type ComparisonWinner = AssetClass | typeof WINNER_TIE;

/** Resultaat van de "sparen vs beleggen"-vergelijking. */
export class SavingsVsInvestmentResult {
  constructor(
    public readonly initialAmount: number,
    public readonly savings: YearProjection[],
    public readonly investments: YearProjection[],
    public readonly currency: string,
  ) {}

  /** Netto eindbedrag bij sparen. */
  get netSavingsEnd(): number {
    return this.endBalance(this.savings);
  }

  /** Netto eindbedrag bij beleggen. */
  get netInvestmentsEnd(): number {
    return this.endBalance(this.investments);
  }

  /** Verschil tussen beleggen en sparen (positief = beleggen levert meer op). */
  get difference(): number {
    return this.netInvestmentsEnd - this.netSavingsEnd;
  }

  /** Welke optie netto het meeste oplevert. */
  get winner(): ComparisonWinner {
    if (this.netInvestmentsEnd > this.netSavingsEnd) return AssetClass.Investments;
    if (this.netSavingsEnd > this.netInvestmentsEnd) return AssetClass.Savings;
    return WINNER_TIE;
  }

  /** Totale box 3-heffing over de hele looptijd bij sparen. */
  get totalSavingsTax(): number {
    return this.totalTax(this.savings);
  }

  /** Totale box 3-heffing over de hele looptijd bij beleggen. */
  get totalInvestmentsTax(): number {
    return this.totalTax(this.investments);
  }

  private endBalance(projections: YearProjection[]): number {
    return projections.length > 0 ? projections[projections.length - 1].endBalance : this.initialAmount;
  }

  private totalTax(projections: YearProjection[]): number {
    return projections.reduce((sum, p) => sum + p.tax, 0);
  }
}
