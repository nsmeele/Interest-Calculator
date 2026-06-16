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

/**
 * Standaard box 3-spaarforfait, in procenten. Voorlopig cijfer voor peiljaar
 * 2026; het definitieve percentage wordt pas na afloop van het jaar
 * vastgesteld. Daarom is deze waarde in de UI instelbaar via een slider — de
 * gebruiker kiest zelf zijn aanname. Ter referentie de definitieve cijfers:
 * 2024 = 1,44%, 2025 = 1,37%.
 */
export const BOX3_FORFAIT_SAVINGS_DEFAULT_PERCENT = 1.28;

/** Standaard box 3-spaarforfait als fractie (afgeleid van het percentage). */
export const BOX3_FORFAIT_SAVINGS_DEFAULT = BOX3_FORFAIT_SAVINGS_DEFAULT_PERCENT / 100;

/** Grenzen en stapgrootte voor de instelbare spaarforfait-slider (in procenten). */
export const BOX3_FORFAIT_SAVINGS_MIN_PERCENT = 0;
export const BOX3_FORFAIT_SAVINGS_MAX_PERCENT = 3;
export const BOX3_FORFAIT_SAVINGS_STEP_PERCENT = 0.01;

/** Forfaitair rendement op beleggingen / overige bezittingen (2026, definitief). */
export const BOX3_FORFAIT_INVESTMENTS_2026 = 0.06;

/** Heffingvrij vermogen per persoon (2026). */
export const BOX3_TAX_FREE_CAPITAL_2026 = 59357;

/* ─── Wet werkelijk rendement (vanaf 2028) ─── */

/** Heffingvrij rendement per persoon (vanaf 2028). */
export const BOX3_TAX_FREE_RETURN_2028 = 1800;

/** Eerste kalenderjaar waarin met werkelijk rendement gerekend kan worden. */
export const BOX3_ACTUAL_RETURN_START_YEAR = 2028;

/** Vermenigvuldigingsfactor van de vrijstelling bij fiscaal partnerschap. */
export const FISCAL_PARTNER_MULTIPLIER = 2;
