import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../../utils/format';
import type { FireScenario } from '../../../models/FireScenario';

interface FireAgeCardProps {
  scenario: FireScenario;
  currency: string;
}

export default function FireAgeCard({ scenario, currency }: FireAgeCardProps) {
  const { t } = useTranslation();

  const statusClass = scenario.isAlreadyFire
    ? 'fire-card--already-fire'
    : scenario.isFeasible
      ? 'fire-card--feasible'
      : 'fire-card--infeasible';

  const badgeClass = scenario.isAlreadyFire
    ? 'fire-badge--already-fire'
    : scenario.isFeasible
      ? 'fire-badge--feasible'
      : 'fire-badge--infeasible';

  const badgeLabel = scenario.isAlreadyFire
    ? t('fire.results.alreadyFire')
    : scenario.isFeasible
      ? t('fire.results.feasible')
      : t('fire.results.infeasible');

  const savingsPercent = scenario.projectedNestEgg > 0
    ? Math.round((scenario.savingsContribution / scenario.projectedNestEgg) * 100)
    : 100;
  const returnsPercent = 100 - savingsPercent;

  return (
    <article
      className={`fire-card ${statusClass}`}
      aria-label={t('fire.results.retireAt', { age: scenario.retirementAge })}
    >
      <div className="fire-card__header">
        <h3 className="fire-card__age">
          {t('fire.results.retireAt', { age: scenario.retirementAge })}
        </h3>
        <span className="fire-card__years-badge">
          {t('fire.results.yearsToGo', { years: scenario.yearsToSave })}
        </span>
      </div>

      <div className="fire-card__nest-egg">
        {formatCurrency(scenario.requiredNestEgg, currency)}
      </div>
      <div className="fire-card__nest-egg-label">
        {t('fire.results.requiredNestEgg')}
      </div>

      <div className="fire-card__divider" />

      <div className="fire-card__stat">
        <span className="fire-card__stat-label">{t('fire.results.monthlySavingsNeeded')}</span>
        <span className="fire-card__stat-value">
          {formatCurrency(scenario.monthlySavingsNeeded, currency)}
        </span>
      </div>

      <div className="fire-card__stat">
        <span className="fire-card__stat-label">{t('fire.results.projected')}</span>
        <span className="fire-card__stat-value">
          {formatCurrency(scenario.projectedNestEgg, currency)}
        </span>
      </div>

      {scenario.shortfall > 0 && (
        <div className="fire-card__stat">
          <span className="fire-card__stat-label">{t('fire.results.shortfall')}</span>
          <span className="fire-card__stat-value fire-card__stat-value--danger">
            {formatCurrency(scenario.shortfall, currency)}
          </span>
        </div>
      )}

      <div className="fire-card__breakdown" role="img" aria-label={`${savingsPercent}% ${t('fire.results.yourContributions')}, ${returnsPercent}% ${t('fire.results.investmentReturns')}`}>
        <div className="fire-card__breakdown-bar">
          <div className="fire-card__breakdown-savings" style={{ width: `${savingsPercent}%` }} />
          <div className="fire-card__breakdown-returns" style={{ width: `${returnsPercent}%` }} />
        </div>
        <div className="fire-card__breakdown-legend">
          <span>
            <span className="fire-card__breakdown-dot fire-card__breakdown-dot--savings" />
            {t('fire.results.yourContributions')} ({savingsPercent}%)
          </span>
          <span>
            <span className="fire-card__breakdown-dot fire-card__breakdown-dot--returns" />
            {t('fire.results.investmentReturns')} ({returnsPercent}%)
          </span>
        </div>
      </div>

      <div className="fire-card__divider" />

      <div className="fire-card__stat">
        <span className={`fire-badge ${badgeClass}`}>{badgeLabel}</span>
      </div>
    </article>
  );
}
