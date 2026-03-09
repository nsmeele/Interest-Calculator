import { useTranslation } from 'react-i18next';
import FireAgeCard from './FireAgeCard';
import type { FireScenario } from '../../../models/FireScenario';

interface FireResultsGridProps {
  scenarios: FireScenario[];
  currency: string;
}

export default function FireResultsGrid({ scenarios, currency }: FireResultsGridProps) {
  const { t } = useTranslation();

  return (
    <section aria-label={t('fire.results.title')}>
      <h2 className="sr-only">{t('fire.results.title')}</h2>
      <div className="fire-results-grid">
        {scenarios.map((scenario) => (
          <FireAgeCard key={scenario.retirementAge} scenario={scenario} currency={currency} />
        ))}
      </div>
    </section>
  );
}
