import { createContext } from 'react';
import type { ReinvestmentAllocation } from '../models/ReinvestmentAllocation';
import type { MaturityEvent } from '../utils/collectMaturities';

export interface ReinvestmentContextValue {
  allocations: ReinvestmentAllocation[];
  addAllocation: (alloc: Omit<ReinvestmentAllocation, 'id'>) => ReinvestmentAllocation;
  removeAllocation: (id: string) => void;
  editAllocation: (id: string, targetAccountId: string, amount: number) => void;
  getAllocationsForEvent: (accountId: string, date: string) => ReinvestmentAllocation[];
  getRemainingAmount: (event: MaturityEvent) => number;
}

export const ReinvestmentContext = createContext<ReinvestmentContextValue | null>(null);
