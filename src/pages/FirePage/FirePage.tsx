import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useLocale } from '../../context/useLocale';
import { useAccountStore } from '../../context/useAccountStore';
import { useReinvestment } from '../../context/useReinvestment';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { FireCalculator } from '../../calculator/FireCalculator';
import { buildDistributionData } from '../../utils/distributionChart';
import { collectMaturities } from '../../utils/collectMaturities';
import { toMonthKey, todayISO } from '../../utils/date';
import { currentYear } from '../../utils/chartRange';
import { APP_NAME } from '../../constants/app';
import FireInputForm from './components/FireInputForm';
import FireResultsGrid from './components/FireResultsGrid';
import { FIRE_DEFAULT_LIFE_EXPECTANCY, type FireInput } from '../../models/FireInput';
import type { FireAgeGroup } from '../../models/FireAgeGroup';
import './FirePage.css';

const calculator = new FireCalculator();

export default function FirePage() {
  useDocumentMeta();
  const { t } = useTranslation();
  const { lang } = useParams();
  const { currency } = useLocale();
  const { results, portfolioIds } = useAccountStore();
  const { allocations } = useReinvestment();
  const [groups, setGroups] = useState<FireAgeGroup[]>([]);
  const [lifeExpectancy, setLifeExpectancy] = useState(FIRE_DEFAULT_LIFE_EXPECTANCY);

  const portfolioItems = useMemo(
    () => results.filter((r) => portfolioIds.has(r.id)),
    [results, portfolioIds],
  );

  const totalBalance = useMemo(() => {
    if (portfolioItems.length === 0) return 0;
    const year = currentYear();
    const events = collectMaturities(results, portfolioIds);
    const data = buildDistributionData(portfolioItems, year, year, events, allocations);
    const monthKey = toMonthKey(todayISO());
    const point = data.find((p) => p.monthKey === monthKey);
    return point ? point.variable + point.fixed : 0;
  }, [portfolioItems, results, portfolioIds, allocations]);

  const weightedReturn = useMemo(() => {
    if (portfolioItems.length === 0) return undefined;
    let totalWeight = 0;
    let weightedSum = 0;
    for (const account of portfolioItems) {
      const balance = account.currentBalance;
      if (balance <= 0) continue;
      weightedSum += account.currentRate * balance;
      totalWeight += balance;
    }
    return totalWeight > 0 ? weightedSum / totalWeight : undefined;
  }, [portfolioItems]);

  const handleSubmit = useCallback((input: FireInput) => {
    setGroups(calculator.calculateAll(input));
    setLifeExpectancy(input.lifeExpectancy);
  }, []);

  return (
    <div className="app-background">
      <div className="app-container">
        <header className="detail-header">
          <div className="detail-header__nav">
            <Link to={`/${lang}`} className="detail-back">
              <ArrowLeftIcon aria-hidden="true" />
              <span>{t('fire.backToOverview')}</span>
            </Link>
            <Link to={`/${lang}`} className="detail-header__logo">{APP_NAME}</Link>
          </div>
        </header>

        <main className="fire-page">
          <div className="fire-page__hero">
            <div className="header-accent" />
            <h1>{t('fire.title')}</h1>
            <p>{t('fire.description')}</p>
          </div>

          <div className="fire-page__layout">
            <div className="fire-page__form-panel">
              <FireInputForm onSubmit={handleSubmit} initialSavings={totalBalance} initialReturn={weightedReturn} />
            </div>

            {groups.length > 0 && (
              <div className="fire-page__results-panel">
                <FireResultsGrid groups={groups} currency={currency} lifeExpectancy={lifeExpectancy} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
