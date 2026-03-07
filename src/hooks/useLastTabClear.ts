import { useEffect, useRef, useCallback } from 'react';
import { TabTracker } from '../utils/tabTracker';

const CHANNEL_NAME = 'moneygrip-tab-sync';
const CLEAR_PENDING_KEY = 'moneygrip-clear-pending';
const QUICK_RELOAD_MS = 5_000;

interface UseLastTabClearOptions {
  hasData: boolean;
  clearResults: () => void;
  clearPortfolio: () => void;
}

export function useLastTabClear({ hasData, clearResults, clearPortfolio }: UseLastTabClearOptions) {
  const hasDataRef = useRef(hasData);

  useEffect(() => {
    hasDataRef.current = hasData;
  }, [hasData]);

  useEffect(() => {
    const tracker = new TabTracker(CHANNEL_NAME);

    // Check if a previous last-tab close flagged pending clear.
    // A timestamp is stored to distinguish a quick same-tab reload
    // (URL re-entry / refresh) from actually closing the tab and
    // returning later.
    const pendingTimestamp = localStorage.getItem(CLEAR_PENDING_KEY);

    if (pendingTimestamp) {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const navType = navEntry?.type;
      const elapsed = Date.now() - Number(pendingTimestamp);
      const isQuickReload = elapsed < QUICK_RELOAD_MS;

      // Keep data when:
      // - reload/back_forward: user refreshed or restored a closed tab
      // - navigate + quick: user re-entered the URL in the address bar
      const keepData = navType === 'reload' || navType === 'back_forward' || isQuickReload;

      if (keepData) {
        localStorage.removeItem(CLEAR_PENDING_KEY);
      } else {
        localStorage.clear();
        clearResults();
        clearPortfolio();
      }
    }

    function handlePageHide(event: PageTransitionEvent) {
      if (!event.persisted && tracker.isLastTab() && hasDataRef.current) {
        localStorage.setItem(CLEAR_PENDING_KEY, String(Date.now()));
      }
    }

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      tracker.destroy();
    };
  }, [clearResults, clearPortfolio]);

  const clearAllData = useCallback(() => {
    localStorage.clear();
    clearResults();
    clearPortfolio();
  }, [clearResults, clearPortfolio]);

  return { clearAllData };
}
