import type { IBox3TaxStrategy, Box3TaxContext } from '../interfaces/IBox3TaxStrategy';
import { AssetClass } from '../enums/AssetClass';
import {
  BOX3_TAX_RATE,
  BOX3_FORFAIT_INVESTMENTS_2026,
} from '../constants/box3';

/**
 * Forfaitair stelsel (peiljaar 2026): de heffing hangt níet af van het werkelijke
 * rendement, maar van een fictief rendement over het vermogen op de peildatum,
 * verminderd met het heffingvrije vermogen.
 *
 * heffing = tarief × forfait[categorie] × max(0, vermogen − heffingvrij vermogen)
 */
export class ForfaitairTaxStrategy2026 implements IBox3TaxStrategy {
  annualTax({ capital, assetClass, exemption, savingsForfait }: Box3TaxContext): number {
    const forfait =
      assetClass === AssetClass.Savings
        ? savingsForfait
        : BOX3_FORFAIT_INVESTMENTS_2026;

    const taxableBase = Math.max(0, capital - exemption);
    const deemedReturn = taxableBase * forfait;
    return deemedReturn * BOX3_TAX_RATE;
  }
}
