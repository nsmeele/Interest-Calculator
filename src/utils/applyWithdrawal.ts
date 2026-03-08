export interface WithdrawalResult {
  newBalance: number;
  applied: number;
  skipped: boolean;
}

export function applyWithdrawal(balance: number, amount: number): WithdrawalResult {
  if (amount >= 0) {
    return { newBalance: balance + amount, applied: amount, skipped: false };
  }

  if (Math.abs(amount) > balance) {
    return { newBalance: balance, applied: 0, skipped: true };
  }

  return { newBalance: balance + amount, applied: amount, skipped: false };
}
