import type { IBox3TaxStrategy, Box3TaxContext } from '../interfaces/IBox3TaxStrategy';
import { BOX3_TAX_RATE } from '../constants/box3';

/**
 * Wet werkelijk rendement box 3 (vanaf 2028): belasting over het werkelijke
 * rendement (rente/aanwas), verminderd met het heffingvrije rendement.
 *
 * heffing = tarief × max(0, werkelijk rendement − heffingvrij rendement)
 *
 * Verliezen worden hier niet doorgeschoven; alleen positief belastbaar
 * rendement levert heffing op.
 */
export class ActualReturnTaxStrategy2028 implements IBox3TaxStrategy {
  annualTax({ actualReturn, exemption }: Box3TaxContext): number {
    const taxableReturn = Math.max(0, actualReturn - exemption);
    return taxableReturn * BOX3_TAX_RATE;
  }
}
