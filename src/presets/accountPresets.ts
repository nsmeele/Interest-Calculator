import { AccountType } from '../enums/AccountType';
import { InterestType } from '../enums/InterestType';
import { PayoutInterval } from '../enums/PayoutInterval';

export interface AccountPreset {
  interestType: InterestType;
  interval: PayoutInterval;
  isOngoing: boolean;
  isVariableRate: boolean;
  hasCashFlows: boolean;
}

export const ACCOUNT_PRESETS: Record<AccountType, AccountPreset> = {
  [AccountType.Savings]: {
    interestType: InterestType.Compound,
    interval: PayoutInterval.Monthly,
    isOngoing: true,
    isVariableRate: true,
    hasCashFlows: true,
  },
  [AccountType.Deposit]: {
    interestType: InterestType.Simple,
    interval: PayoutInterval.AtMaturity,
    isOngoing: false,
    isVariableRate: false,
    hasCashFlows: false,
  },
  [AccountType.Investment]: {
    interestType: InterestType.Simple,
    interval: PayoutInterval.Monthly,
    isOngoing: true,
    isVariableRate: false,
    hasCashFlows: false,
  },
};

export interface AccountTypeRestrictions {
  allowVariableRate: boolean;
  allowCashFlows: boolean;
}

export const ACCOUNT_RESTRICTIONS: Record<AccountType, AccountTypeRestrictions> = {
  [AccountType.Savings]: { allowVariableRate: true, allowCashFlows: true },
  [AccountType.Deposit]: { allowVariableRate: false, allowCashFlows: false },
  [AccountType.Investment]: { allowVariableRate: true, allowCashFlows: true },
};
