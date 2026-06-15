/**
 * Box 3 belastingparameters (Nederlands belastingstelsel).
 *
 * Twee stelsels worden ondersteund:
 *  1. Het huidige forfaitaire stelsel (Overbruggingswet, peiljaar 2026): belasting
 *     over een fictief/forfaitair rendement, met een heffingvrij vermogen.
 *  2. De Wet werkelijk rendement box 3 (vanaf 2028): belasting over het werkelijke
 *     rendement (vermogensaanwasbelasting), met een heffingvrij rendement.
 *
 * Bronnen: rijksoverheid.nl / belastingdienst.nl. Het spaarforfait 2026 is een
 * voorlopig percentage dat na afloop van het jaar definitief wordt vastgesteld.
 */

/** Box 3-tarief (geldt in beide stelsels). */
export const BOX3_TAX_RATE = 0.36;

/* ─── Forfaitair stelsel (peiljaar 2026) ─── */

/** Forfaitair rendement op spaargeld (2026, voorlopig). */
export const BOX3_FORFAIT_SAVINGS_2026 = 0.0144;

/** Forfaitair rendement op beleggingen / overige bezittingen (2026). */
export const BOX3_FORFAIT_INVESTMENTS_2026 = 0.06;

/** Heffingvrij vermogen per persoon (2026). */
export const BOX3_TAX_FREE_CAPITAL_2026 = 59357;

/* ─── Wet werkelijk rendement (vanaf 2028) ─── */

/** Heffingvrij rendement per persoon (vanaf 2028). */
export const BOX3_TAX_FREE_RETURN_2028 = 1800;

/** Vermenigvuldigingsfactor van de vrijstelling bij fiscaal partnerschap. */
export const FISCAL_PARTNER_MULTIPLIER = 2;
