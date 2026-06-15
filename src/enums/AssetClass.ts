import i18n from '../i18n';

/** Vermogenscategorie die in box 3 verschillend behandeld kan worden. */
export enum AssetClass {
  Savings = 'savings',
  Investments = 'investments',
}

const ASSET_CLASS_KEYS: Record<AssetClass, string> = {
  [AssetClass.Savings]: 'savingsVsInvesting.assetClass.savings',
  [AssetClass.Investments]: 'savingsVsInvesting.assetClass.investments',
};

export function getAssetClassLabel(assetClass: AssetClass): string {
  return i18n.t(ASSET_CLASS_KEYS[assetClass]);
}
