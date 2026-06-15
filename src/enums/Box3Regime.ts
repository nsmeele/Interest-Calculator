import i18n from '../i18n';

/** Het box 3-belastingstelsel waarmee gerekend wordt. */
export enum Box3Regime {
  /** Huidig forfaitair stelsel (belasting over fictief rendement), peiljaar 2026. */
  Forfaitair2026 = 'forfaitair2026',
  /** Wet werkelijk rendement box 3 (vanaf 2028). */
  Actual2028 = 'actual2028',
}

const REGIME_KEYS: Record<Box3Regime, string> = {
  [Box3Regime.Forfaitair2026]: 'savingsVsInvesting.regime.forfaitair2026',
  [Box3Regime.Actual2028]: 'savingsVsInvesting.regime.actual2028',
};

export function getBox3RegimeLabel(regime: Box3Regime): string {
  return i18n.t(REGIME_KEYS[regime]);
}
