import { useState, useMemo } from 'react';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { BankAccount } from '../../models/BankAccount';
import { INTERVAL_LABELS } from '../../enums/PayoutInterval';
import { formatCurrency } from '../../utils/format';
import { toMonthKey, addMonthsToISO, todayISO, getNextMonthStart } from '../../utils/date';
import PortfolioChart from '../PortfolioChart';
import './PortfolioSummary.css';

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric' }).format(d);
}

import { itemStatusForMonth } from '../../utils/portfolioStatus';

interface PortfolioSummaryProps {
  results: BankAccount[];
  portfolioIds: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
}

export default function PortfolioSummary({ results, portfolioIds, onToggle, onClear }: PortfolioSummaryProps) {
  const items = results.filter((r) => portfolioIds.has(r.id));
  const currentMonthKey = toMonthKey(todayISO());
  const [monthOffset, setMonthOffset] = useState(0);

  const selectedMonthKey = useMemo(() => {
    if (monthOffset === 0) return currentMonthKey;
    const shifted = addMonthsToISO(`${currentMonthKey}-01`, monthOffset);
    return toMonthKey(shifted);
  }, [currentMonthKey, monthOffset]);

  const monthBounds = useMemo(() => {
    let min = '';
    let max = '';
    for (const r of items) {
      for (const key of r.calendarMonthProjection.keys()) {
        if (!min || key < min) min = key;
        if (!max || key > max) max = key;
      }
    }
    return { min, max };
  }, [items]);

  if (items.length === 0) return null;

  const atStart = monthBounds.min !== '' && selectedMonthKey <= monthBounds.min;
  const atEnd = monthBounds.max !== '' && selectedMonthKey >= monthBounds.max;

  const totalInterest = items.reduce((sum, r) => sum + r.totalInterest, 0);

  const totalForMonth = items.reduce((sum, r) => {
    return sum + (r.calendarMonthProjection.get(selectedMonthKey) ?? 0);
  }, 0);

  const monthEnd = getNextMonthStart(`${selectedMonthKey}-01`);

  const activeForMonth = items.filter((r) => itemStatusForMonth(r, selectedMonthKey) === 'active');

  const totalInvested = activeForMonth.reduce((sum, r) => {
    const deposited = r.periods
      .filter((p) => p.endDate && p.endDate <= monthEnd)
      .reduce((s, p) => s + (p.deposited ?? 0), 0);
    return sum + r.startAmount + deposited;
  }, 0);

  const isCurrentMonth = monthOffset === 0;

  return (
    <section className="portfolio-section" aria-label="Portefeuille">
      <div className="section-header">
        <div className="section-header__title">
          <h2>
            Portefeuille
            <span className="results-count">{items.length}</span>
          </h2>
        </div>
        <div className="section-header__actions">
          <button className="btn-action btn-action--danger" onClick={onClear}>
            Leegmaken
          </button>
        </div>
      </div>

      <div className="portfolio-stats">
        <div className="portfolio-stat">
          <div className="portfolio-stat-label">Totaal ingelegd</div>
          <div className="portfolio-stat-value">{formatCurrency(totalInvested)}</div>
        </div>
        <div className="portfolio-stat">
          <div className="portfolio-stat-label">Totale rente</div>
          <div className="portfolio-stat-value">{formatCurrency(totalInterest)}</div>
        </div>
        <div className="portfolio-stat portfolio-stat--highlight">
          <div className="month-nav">
            <button
              className="month-nav__btn"
              onClick={() => setMonthOffset((o) => o - 1)}
              disabled={atStart}
              aria-label="Vorige maand"
            >
              <ChevronLeftIcon aria-hidden="true" />
            </button>
            <div className="month-nav__label">
              <span className="portfolio-stat-label">{formatMonthLabel(selectedMonthKey)}</span>
              {isCurrentMonth && <span className="month-nav__current">nu</span>}
            </div>
            <button
              className="month-nav__btn"
              onClick={() => setMonthOffset((o) => o + 1)}
              disabled={atEnd}
              aria-label="Volgende maand"
            >
              <ChevronRightIcon aria-hidden="true" />
            </button>
          </div>
          <div className="portfolio-stat-value">{formatCurrency(totalForMonth)}</div>
        </div>
      </div>

      <PortfolioChart items={activeForMonth} />

      <div className="portfolio-items">
        {items.map((r) => {
          const status = itemStatusForMonth(r, selectedMonthKey);
          return (
          <div key={r.id} className={`portfolio-item${status === 'expired' ? ' portfolio-item--expired' : ''}${status === 'upcoming' ? ' portfolio-item--upcoming' : ''}`}>
            <div className="portfolio-item-info">
              <span className="portfolio-item-label">
                {r.label}
                {status === 'active' && r.isOngoing && <span className="badge-ongoing">Lopend</span>}
                {status === 'expired' && <span className="badge-expired">Verlopen</span>}
                {status === 'upcoming' && <span className="badge-upcoming">Toekomstig</span>}
              </span>
              <span className="portfolio-item-meta">
                {INTERVAL_LABELS[r.interval]}
                {r.startDate && <> &middot; {r.startDate}</>}
                {r.cashFlows.length > 0 && <> &middot; {r.cashFlows.length} transactie{r.cashFlows.length !== 1 ? 's' : ''}</>}
              </span>
            </div>
            <div className="portfolio-item-amount">
              {formatCurrency(r.calendarMonthProjection.get(selectedMonthKey) ?? 0)}
            </div>
            <button
              className="btn-icon"
              title="Verwijder uit portefeuille"
              onClick={() => onToggle(r.id)}
              aria-label="Verwijder uit portefeuille"
            >
              <XMarkIcon aria-hidden="true" />
            </button>
          </div>
          );
        })}
      </div>
    </section>
  );
}
