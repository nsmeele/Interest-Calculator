import { createContext } from 'react';

export interface TaxSettings {
  useActualReturnFrom2028: boolean;
  hasFiscalPartner: boolean;
  applyExemption: boolean;
}

export interface TaxSettingsContextValue extends TaxSettings {
  setUseActualReturnFrom2028: (value: boolean) => void;
  setHasFiscalPartner: (value: boolean) => void;
  setApplyExemption: (value: boolean) => void;
}

export const TaxSettingsContext = createContext<TaxSettingsContextValue | null>(null);
