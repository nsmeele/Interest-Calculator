import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ReinvestmentContext } from './reinvestmentContextValue';
import { useReinvestmentStorage } from '../hooks/useReinvestmentStorage';
import { useAccountStore } from './useAccountStore';
import type { ReinvestmentAllocation } from '../models/ReinvestmentAllocation';
import type { MaturityEvent } from '../utils/collectMaturities';
import type { CashFlow } from '../models/CashFlow';

export function ReinvestmentProvider({ children }: { children: ReactNode }) {
  const { allocations, addAllocation: addRaw, removeAllocation: removeRaw, updateAllocation: updateRaw } = useReinvestmentStorage();
  const { results, handleUpdateCashFlows } = useAccountStore();

  const addAllocation = useCallback((alloc: Omit<ReinvestmentAllocation, 'id'>): ReinvestmentAllocation => {
    // Create cashflow on target account
    const target = results.find((r) => r.id === alloc.targetAccountId);
    let cashFlowId: string | undefined;

    if (target) {
      cashFlowId = crypto.randomUUID();
      const newCashFlow: CashFlow = {
        id: cashFlowId,
        date: alloc.sourceDate,
        amount: alloc.amount,
        description: `Herbelegging`,
      };
      handleUpdateCashFlows(target.id, [...target.cashFlows, newCashFlow]);
    }

    return addRaw({ ...alloc, targetCashFlowId: cashFlowId });
  }, [results, handleUpdateCashFlows, addRaw]);

  const removeAllocation = useCallback((id: string) => {
    const alloc = allocations.find((a) => a.id === id);
    if (alloc?.targetCashFlowId) {
      const target = results.find((r) => r.id === alloc.targetAccountId);
      if (target) {
        const updatedCashFlows = target.cashFlows.filter((cf) => cf.id !== alloc.targetCashFlowId);
        handleUpdateCashFlows(target.id, updatedCashFlows);
      }
    }
    removeRaw(id);
  }, [allocations, results, handleUpdateCashFlows, removeRaw]);

  const editAllocation = useCallback((id: string, targetAccountId: string, amount: number) => {
    const alloc = allocations.find((a) => a.id === id);
    if (!alloc) return;

    // Remove old cashflow from old target
    if (alloc.targetCashFlowId) {
      const oldTarget = results.find((r) => r.id === alloc.targetAccountId);
      if (oldTarget) {
        handleUpdateCashFlows(oldTarget.id, oldTarget.cashFlows.filter((cf) => cf.id !== alloc.targetCashFlowId));
      }
    }

    // Create new cashflow on new target
    const newTarget = results.find((r) => r.id === targetAccountId);
    let cashFlowId: string | undefined;
    if (newTarget) {
      cashFlowId = crypto.randomUUID();
      const newCashFlow: CashFlow = {
        id: cashFlowId,
        date: alloc.sourceDate,
        amount,
        description: 'Herbelegging',
      };
      handleUpdateCashFlows(newTarget.id, [...newTarget.cashFlows, newCashFlow]);
    }

    updateRaw(id, { targetAccountId, amount, targetCashFlowId: cashFlowId });
  }, [allocations, results, handleUpdateCashFlows, updateRaw]);

  const getAllocationsForEvent = useCallback((accountId: string, date: string) => {
    return allocations.filter((a) => a.sourceAccountId === accountId && a.sourceDate === date);
  }, [allocations]);

  const getRemainingAmount = useCallback((event: MaturityEvent) => {
    const eventAllocations = allocations.filter(
      (a) => a.sourceAccountId === event.accountId && a.sourceDate === event.date && a.sourceType === event.type,
    );
    const allocated = eventAllocations.reduce((sum, a) => sum + a.amount, 0);
    return Math.max(0, event.amount - allocated);
  }, [allocations]);

  const value = useMemo(() => ({
    allocations,
    addAllocation,
    removeAllocation,
    editAllocation,
    getAllocationsForEvent,
    getRemainingAmount,
  }), [allocations, addAllocation, removeAllocation, editAllocation, getAllocationsForEvent, getRemainingAmount]);

  return (
    <ReinvestmentContext.Provider value={value}>
      {children}
    </ReinvestmentContext.Provider>
  );
}
