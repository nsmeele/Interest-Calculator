/** Het box 3-belastingstelsel waarmee een specifiek jaar berekend wordt. */
export enum Box3Regime {
  /** Huidig forfaitair stelsel (belasting over fictief rendement), peiljaar 2026. */
  Forfaitair2026 = 'forfaitair2026',
  /** Wet werkelijk rendement box 3 (vanaf 2028). */
  Actual2028 = 'actual2028',
}
