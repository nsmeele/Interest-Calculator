import { useState, useCallback } from 'react';
import type { ReinvestmentAllocation } from '../models/ReinvestmentAllocation';

const STORAGE_KEY = 'reinvestment-allocations';

function loadFromStorage(): ReinvestmentAllocation[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as ReinvestmentAllocation[];
  } catch {
    return [];
  }
}

function saveToStorage(allocations: ReinvestmentAllocation[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allocations));
}

export function useReinvestmentStorage() {
  const [allocations, setAllocations] = useState<ReinvestmentAllocation[]>(loadFromStorage);

  const addAllocation = useCallback((alloc: Omit<ReinvestmentAllocation, 'id'>) => {
    const newAlloc: ReinvestmentAllocation = { ...alloc, id: crypto.randomUUID() };
    setAllocations((prev) => {
      const updated = [...prev, newAlloc];
      saveToStorage(updated);
      return updated;
    });
    return newAlloc;
  }, []);

  const removeAllocation = useCallback((id: string) => {
    setAllocations((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const updateAllocation = useCallback((id: string, patch: Partial<ReinvestmentAllocation>) => {
    setAllocations((prev) => {
      const updated = prev.map((a) => a.id === id ? { ...a, ...patch } : a);
      saveToStorage(updated);
      return updated;
    });
  }, []);

  const clearAllocations = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAllocations([]);
  }, []);

  return { allocations, addAllocation, removeAllocation, updateAllocation, clearAllocations };
}
