import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScenarioType } from '../../../models/ScenarioType';
import type { FireAgeGroup } from '../../../models/FireAgeGroup';
import FireAgeCard from './FireAgeCard';

interface FireAgeGroupCardProps {
  group: FireAgeGroup;
  currency: string;
  lifeExpectancy: number;
}

const TABS = [ScenarioType.BASE, ScenarioType.PESSIMISTIC, ScenarioType.OPTIMISTIC] as const;

export default function FireAgeGroupCard({ group, currency, lifeExpectancy }: FireAgeGroupCardProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<ScenarioType>(ScenarioType.BASE);
  const tabId = `fire-tabs-${group.retirementAge}`;
  const panelId = `fire-panel-${group.retirementAge}`;

  const scenario = group[activeTab];
  const swrYears = lifeExpectancy - group.retirementAge;
  const swr = swrYears > 0 ? ((1 / swrYears) * 100).toFixed(1) : '—';

  function handleKeyDown(e: React.KeyboardEvent) {
    const idx = TABS.indexOf(activeTab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveTab(TABS[(idx + 1) % TABS.length]);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveTab(TABS[(idx - 1 + TABS.length) % TABS.length]);
    }
  }

  return (
    <div className="fire-group-card">
      <div className="fire-scenario-tabs" role="tablist" aria-label={t('fire.results.scenarioTabs')}>
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            id={`${tabId}-${tab}`}
            aria-selected={activeTab === tab}
            aria-controls={panelId}
            className={`fire-scenario-tab fire-scenario-tab--${tab}${activeTab === tab ? ' fire-scenario-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
            onKeyDown={handleKeyDown}
            tabIndex={activeTab === tab ? 0 : -1}
          >
            {t(`fire.results.scenario${tab.charAt(0).toUpperCase()}${tab.slice(1)}`)}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={panelId} aria-labelledby={`${tabId}-${activeTab}`}>
        <div className="fire-card__swr-hint">
          {t('fire.results.swrHint', { swr, years: swrYears })}
        </div>
        <FireAgeCard scenario={scenario} currency={currency} />
      </div>
    </div>
  );
}
