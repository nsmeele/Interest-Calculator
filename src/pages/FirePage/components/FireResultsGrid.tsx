import { useTranslation } from 'react-i18next';
import FireAgeGroupCard from './FireAgeGroupCard';
import type { FireAgeGroup } from '../../../models/FireAgeGroup';

interface FireResultsGridProps {
  groups: FireAgeGroup[];
  currency: string;
  lifeExpectancy: number;
}

export default function FireResultsGrid({ groups, currency, lifeExpectancy }: FireResultsGridProps) {
  const { t } = useTranslation();

  return (
    <section aria-label={t('fire.results.title')}>
      <h2 className="sr-only">{t('fire.results.title')}</h2>
      <div className="fire-results-grid">
        {groups.map((group) => (
          <FireAgeGroupCard key={group.retirementAge} group={group} currency={currency} lifeExpectancy={lifeExpectancy} />
        ))}
      </div>
    </section>
  );
}
