import { useContext } from 'react';
import { ReinvestmentContext } from './reinvestmentContextValue';
import type { ReinvestmentContextValue } from './reinvestmentContextValue';

export type { ReinvestmentContextValue };

export function useReinvestment(): ReinvestmentContextValue {
  const ctx = useContext(ReinvestmentContext);
  if (!ctx) throw new Error('useReinvestment must be used within ReinvestmentProvider');
  return ctx;
}
