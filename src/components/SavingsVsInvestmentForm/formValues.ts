import type { Currency } from '../../enums/Currency';
import { formatAmountInput } from '../../utils/format';

/** Ruwe (string) invoerwaarden; de pagina parseert deze naar een rekenmodel. */
export interface SavingsVsInvestmentFormValues {
  initialAmount: string;
  years: string;
  savingsRate: string;
  investmentReturn: string;
  useActualReturnFrom2028: boolean;
  hasFiscalPartner: boolean;
  applyExemption: boolean;
}

const DEFAULT_INITIAL_AMOUNT = 100000;
const DEFAULT_YEARS = '10';
const DEFAULT_SAVINGS_RATE = '2';
const DEFAULT_INVESTMENT_RETURN = '7';

/**
 * Bouwt de standaard invoerwaarden. Het startbedrag wordt geformatteerd in de
 * actieve valuta, zodat het ook voor niet-EUR valuta correct wordt geparseerd.
 */
export function createDefaultFormValues(currency: Currency): SavingsVsInvestmentFormValues {
  return {
    initialAmount: formatAmountInput(DEFAULT_INITIAL_AMOUNT, currency),
    years: DEFAULT_YEARS,
    savingsRate: DEFAULT_SAVINGS_RATE,
    investmentReturn: DEFAULT_INVESTMENT_RETURN,
    useActualReturnFrom2028: false,
    hasFiscalPartner: false,
    applyExemption: false,
  };
}
