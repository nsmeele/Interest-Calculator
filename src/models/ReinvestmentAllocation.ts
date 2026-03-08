export interface ReinvestmentAllocation {
  id: string;
  sourceAccountId: string;
  sourceDate: string;
  sourceType: 'maturity' | 'disbursement';
  amount: number;
  targetAccountId: string;
  targetCashFlowId?: string;
}
