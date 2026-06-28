import { useCallback, useState } from 'react';
import type { TaxSettings } from '../context/taxSettingsContextValue';

const STORAGE_KEY = 'tax-settings';

const DEFAULT_SETTINGS: TaxSettings = {
  useActualReturnFrom2028: false,
  hasFiscalPartner: false,
  applyExemption: false,
};

function loadFromStorage(): TaxSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(data) as Partial<TaxSettings>;
    return {
      useActualReturnFrom2028: parsed.useActualReturnFrom2028 ?? DEFAULT_SETTINGS.useActualReturnFrom2028,
      hasFiscalPartner: parsed.hasFiscalPartner ?? DEFAULT_SETTINGS.hasFiscalPartner,
      applyExemption: parsed.applyExemption ?? DEFAULT_SETTINGS.applyExemption,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveToStorage(settings: TaxSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { /* storage unavailable */ }
}

export function useTaxSettingsStorage() {
  const [settings, setSettings] = useState<TaxSettings>(loadFromStorage);

  const update = useCallback((patch: Partial<TaxSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveToStorage(next);
      return next;
    });
  }, []);

  return { settings, update };
}
