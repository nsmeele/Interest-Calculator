import { AccountType } from './AccountType';

/** Vermogenscategorie die in box 3 verschillend behandeld kan worden. */
export enum AssetClass {
  Savings = 'savings',
  Investments = 'investments',
}

export function toAssetClass(accountType?: AccountType): AssetClass {
  return accountType === AccountType.Investment ? AssetClass.Investments : AssetClass.Savings;
}
