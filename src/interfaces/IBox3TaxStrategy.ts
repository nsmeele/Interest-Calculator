import type { AssetClass } from '../enums/AssetClass';

/** Context voor de jaarlijkse box 3-heffing van één vermogenscategorie. */
export interface Box3TaxContext {
  /** Vermogen op de peildatum (1 januari) van het belastingjaar. */
  capital: number;
  /** Werkelijk behaald rendement (rente/aanwas) in het belastingjaar. */
  actualReturn: number;
  /** De vermogenscategorie waarop de heffing van toepassing is. */
  assetClass: AssetClass;
  /**
   * De toepasselijke vrijstelling in de eenheid van het stelsel:
   * heffingvrij vermogen (forfaitair) of heffingvrij rendement (werkelijk rendement).
   */
  exemption: number;
}

/** Berekent de box 3-belasting over één belastingjaar volgens een specifiek stelsel. */
export interface IBox3TaxStrategy {
  annualTax(context: Box3TaxContext): number;
}
