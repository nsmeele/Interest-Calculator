import type { Currency } from '../../enums/Currency';
import { formatAmountInput } from '../../utils/format';
import { currentYear } from '../../utils/chartRange';
import { BOX3_FORFAIT_SAVINGS_DEFAULT_PERCENT } from '../../constants/box3';

/** Ruwe (string) invoerwaarden; de pagina parseert deze naar een rekenmodel. */
export interface SavingsVsInvestmentFormValues {
  initialAmount: string;
  startYear: string;
  years: string;
  savingsRate: string;
  investmentReturn: string;
  /** Box 3-spaarforfait in procenten (instelbaar via slider). */
  savingsForfait: string;
  useActualReturnFrom2028: boolean;
  hasFiscalPartner: boolean;
  applyExemption: boolean;
}

const DEFAULT_INITIAL_AMOUNT = 100000;
const DEFAULT_YEARS = '10';
const DEFAULT_SAVINGS_RATE = '2';
const DEFAULT_INVESTMENT_RETURN = '7';
const DEFAULT_SAVINGS_FORFAIT = String(BOX3_FORFAIT_SAVINGS_DEFAULT_PERCENT);

/**
 * Bouwt de standaard invoerwaarden. Het startbedrag wordt geformatteerd in de
 * actieve valuta, zodat het ook voor niet-EUR valuta correct wordt geparseerd.
 * Het startjaar valt standaard op het huidige kalenderjaar.
 */
export function createDefaultFormValues(currency: Currency): SavingsVsInvestmentFormValues {
  return {
    initialAmount: formatAmountInput(DEFAULT_INITIAL_AMOUNT, currency),
    startYear: String(currentYear()),
    years: DEFAULT_YEARS,
    savingsRate: DEFAULT_SAVINGS_RATE,
    investmentReturn: DEFAULT_INVESTMENT_RETURN,
    savingsForfait: DEFAULT_SAVINGS_FORFAIT,
    useActualReturnFrom2028: false,
    hasFiscalPartner: false,
    applyExemption: false,
  };
}
