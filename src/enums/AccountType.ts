import i18n from '../i18n';

export enum AccountType {
  Savings = 'savings',
  Deposit = 'deposit',
  Investment = 'investment',
}

const ACCOUNT_TYPE_KEYS: Record<AccountType, string> = {
  [AccountType.Savings]: 'accountType.savings',
  [AccountType.Deposit]: 'accountType.deposit',
  [AccountType.Investment]: 'accountType.investment',
};

export function getAccountTypeLabel(type: AccountType): string {
  return i18n.t(ACCOUNT_TYPE_KEYS[type]);
}
