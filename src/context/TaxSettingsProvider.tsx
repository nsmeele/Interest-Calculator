import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { TaxSettingsContext } from './taxSettingsContextValue';
import { useTaxSettingsStorage } from '../hooks/useTaxSettingsStorage';

export function TaxSettingsProvider({ children }: { children: ReactNode }) {
  const { settings, update } = useTaxSettingsStorage();

  const setUseActualReturnFrom2028 = useCallback(
    (value: boolean) => update({ useActualReturnFrom2028: value }),
    [update],
  );

  const setHasFiscalPartner = useCallback(
    (value: boolean) => update({ hasFiscalPartner: value }),
    [update],
  );

  const setApplyExemption = useCallback(
    (value: boolean) => update(value ? { applyExemption: true } : { applyExemption: false, hasFiscalPartner: false }),
    [update],
  );

  const value = useMemo(() => ({
    ...settings,
    setUseActualReturnFrom2028,
    setHasFiscalPartner,
    setApplyExemption,
  }), [settings, setUseActualReturnFrom2028, setHasFiscalPartner, setApplyExemption]);

  return (
    <TaxSettingsContext.Provider value={value}>
      {children}
    </TaxSettingsContext.Provider>
  );
}
