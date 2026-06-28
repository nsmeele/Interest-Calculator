import { describe, it, expect } from 'vitest';
import { toAssetClass, AssetClass } from '../enums/AssetClass';
import { AccountType } from '../enums/AccountType';

describe('toAssetClass', () => {
  it('maps savings and deposits to the savings asset class', () => {
    expect(toAssetClass(AccountType.Savings)).toBe(AssetClass.Savings);
    expect(toAssetClass(AccountType.Deposit)).toBe(AssetClass.Savings);
  });

  it('maps investments to the investments asset class', () => {
    expect(toAssetClass(AccountType.Investment)).toBe(AssetClass.Investments);
  });

  it('falls back to savings when the account type is unknown', () => {
    expect(toAssetClass(undefined)).toBe(AssetClass.Savings);
  });
});
