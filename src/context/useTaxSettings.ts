import { useContext } from 'react';
import { TaxSettingsContext } from './taxSettingsContextValue';
import type { TaxSettingsContextValue } from './taxSettingsContextValue';

export type { TaxSettingsContextValue };

export function useTaxSettings(): TaxSettingsContextValue {
  const ctx = useContext(TaxSettingsContext);
  if (!ctx) throw new Error('useTaxSettings must be used within TaxSettingsProvider');
  return ctx;
}
