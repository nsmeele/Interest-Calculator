import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useAccountStore } from '../../context/useAccountStore';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { collectMaturities } from '../../utils/collectMaturities';
import ReinvestmentTimeline from '../../components/ReinvestmentTimeline';
import ReinvestmentDetail from '../../components/ReinvestmentDetail';
import { APP_NAME } from '../../constants/app';
import './ReinvestmentPage.css';

export default function ReinvestmentPage() {
  useDocumentMeta();
  const { t } = useTranslation();
  const { lang } = useParams();
  const { results, portfolioIds } = useAccountStore();

  const events = useMemo(() => collectMaturities(results, portfolioIds), [results, portfolioIds]);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(() => {
    if (events.length === 0) return null;
    return events[0].monthKey;
  });

  const selectedEvents = useMemo(() => {
    if (!selectedMonthKey) return [];
    return events.filter((e) => e.monthKey === selectedMonthKey);
  }, [events, selectedMonthKey]);

  return (
    <div className="app-background">
      <div className="app-container">
        <header className="detail-header">
          <div className="detail-header__nav">
            <Link to={`/${lang}`} className="detail-back">
              <ArrowLeftIcon aria-hidden="true" />
              <span>{t('reinvest.backToOverview')}</span>
            </Link>
            <Link to={`/${lang}`} className="detail-header__logo">{APP_NAME}</Link>
          </div>
        </header>

        <main className="reinvest-page">
          <div className="reinvest-page__hero">
            <div className="header-accent" />
            <h1>{t('reinvest.title')}</h1>
          </div>

          <section className="reinvest-page__timeline" aria-label={t('reinvest.timelineTitle')}>
            <ReinvestmentTimeline
              events={events}
              selectedMonthKey={selectedMonthKey}
              onSelectMonth={setSelectedMonthKey}
            />
          </section>

          {selectedMonthKey && selectedEvents.length > 0 && (
            <section className="reinvest-page__detail" aria-label={t('reinvest.allocations')}>
              <ReinvestmentDetail key={selectedMonthKey} events={selectedEvents} />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
