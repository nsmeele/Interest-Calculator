import { DEFAULT_CURRENCY } from '../enums/Currency';

/** Invoer voor de "sparen vs beleggen"-vergelijking onder box 3. */
export class SavingsVsInvestmentInput {
  constructor(
    /** Startbedrag dat wordt gespaard of belegd. */
    public readonly initialAmount: number,
    /** Looptijd van de projectie in hele jaren. */
    public readonly years: number,
    /** Verwachte spaarrente in procenten per jaar. */
    public readonly savingsRate: number,
    /** Verwacht beleggingsrendement in procenten per jaar. */
    public readonly investmentReturn: number,
    /** Kalenderjaar waarin de projectie begint (jaar 1). */
    public readonly startYear: number,
    /**
     * Of vanaf 2028 met werkelijk rendement gerekend wordt. Staat dit uit, dan
     * wordt elk jaar forfaitair belast; staat het aan, dan geldt forfaitair t/m
     * 2027 en werkelijk rendement vanaf 2028.
     */
    public readonly useActualReturnFrom2028: boolean = false,
    /** Of er een fiscaal partner is (verdubbelt de vrijstelling). */
    public readonly hasFiscalPartner: boolean = false,
    /**
     * Reeds elders benut deel van de vrijstelling, in de eenheid van het stelsel
     * (heffingvrij vermogen bij forfaitair, heffingvrij rendement vanaf 2028).
     */
    public readonly usedExemption: number = 0,
    public readonly currency: string = DEFAULT_CURRENCY,
  ) {}
}
