import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { MaturityEvent } from '../../utils/collectMaturities';
import { useReinvestment } from '../../context/useReinvestment';
import { useLocale } from '../../context/useLocale';
import { formatCurrency } from '../../utils/format';
import { parseDate } from '../../utils/date';
import './ReinvestmentTimeline.css';

interface ReinvestmentTimelineProps {
  events: MaturityEvent[];
  selectedMonthKey: string | null;
  onSelectMonth: (monthKey: string) => void;
}

interface MonthGroup {
  monthKey: string;
  label: string;
  events: MaturityEvent[];
  total: number;
}

export default function ReinvestmentTimeline({ events, selectedMonthKey, onSelectMonth }: ReinvestmentTimelineProps) {
  const { t } = useTranslation();
  const { currency } = useLocale();
  const { getRemainingAmount } = useReinvestment();

  const months = useMemo((): MonthGroup[] => {
    const grouped = new Map<string, MaturityEvent[]>();
    for (const event of events) {
      const existing = grouped.get(event.monthKey) ?? [];
      existing.push(event);
      grouped.set(event.monthKey, existing);
    }

    return Array.from(grouped.entries()).map(([monthKey, monthEvents]) => {
      const date = parseDate(`${monthKey}-01`);
      const label = date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      const total = monthEvents.reduce((sum, e) => sum + e.amount, 0);
      return { monthKey, label, events: monthEvents, total };
    });
  }, [events]);

  if (months.length === 0) {
    return (
      <div className="reinvest-timeline__empty">
        <h3>{t('reinvest.emptyTitle')}</h3>
        <p>{t('reinvest.emptyDescription')}</p>
      </div>
    );
  }

  return (
    <div className="reinvest-timeline" role="tablist" aria-label={t('reinvest.timelineTitle')}>
      {months.map((month) => {
        const isActive = selectedMonthKey === month.monthKey;
        const allFullyAllocated = month.events.every((e) => getRemainingAmount(e) <= 0);

        return (
          <button
            key={month.monthKey}
            className={`reinvest-timeline__month${isActive ? ' reinvest-timeline__month--active' : ''}${allFullyAllocated ? ' reinvest-timeline__month--allocated' : ''}`}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectMonth(month.monthKey)}
          >
            <span className="reinvest-timeline__month-label">{month.label}</span>
            <span className="reinvest-timeline__month-amount">{formatCurrency(month.total, currency)}</span>
            <span className="reinvest-timeline__month-count">
              {t('reinvest.events', { count: month.events.length })}
            </span>
            {allFullyAllocated && (
              <span className="reinvest-timeline__month-badge">{t('reinvest.fullyAllocated')}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export type { MonthGroup };
