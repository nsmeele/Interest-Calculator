import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { useLocale } from '../../context/useLocale';
import { APP_NAME } from '../../constants/app';
import { SavingsVsInvestmentCalculator } from '../../calculator/SavingsVsInvestmentCalculator';
import { SavingsVsInvestmentInput } from '../../models/SavingsVsInvestmentInput';
import { WINNER_TIE } from '../../models/SavingsVsInvestmentResult';
import { AssetClass } from '../../enums/AssetClass';
import { parseAmountInput, parseDecimalInput, formatCurrency } from '../../utils/format';
import { currentYear } from '../../utils/chartRange';
import {
  BOX3_FORFAIT_SAVINGS_MIN_PERCENT,
  BOX3_FORFAIT_SAVINGS_MAX_PERCENT,
} from '../../constants/box3';
import type { Currency } from '../../enums/Currency';
import SavingsVsInvestmentForm, {
  createDefaultFormValues,
  type SavingsVsInvestmentFormValues,
} from '../../components/SavingsVsInvestmentForm';
import SavingsVsInvestmentChart from '../../components/SavingsVsInvestmentChart';
import ProjectionTable from '../../components/ProjectionTable';
import './SavingsVsInvestmentPage.css';

const calculator = new SavingsVsInvestmentCalculator();

const MIN_YEARS = 0;
const MAX_YEARS = 50;
const MIN_START_YEAR = 2001;
const MAX_START_YEAR = 2100;

/** Parseert het looptijdveld naar een geheel aantal jaren binnen [MIN_YEARS, MAX_YEARS]. */
function parseYears(value: string): number {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return MIN_YEARS;
  return Math.min(MAX_YEARS, Math.max(MIN_YEARS, parsed));
}

/** Parseert het startjaarveld; valt terug op het huidige jaar en klemt op [MIN_START_YEAR, MAX_START_YEAR]. */
function parseStartYear(value: string): number {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) return currentYear();
  return Math.min(MAX_START_YEAR, Math.max(MIN_START_YEAR, parsed));
}

/** Parseert het spaarforfait-veld (procenten), klemt op het slider-bereik en geeft een fractie terug. */
function parseSavingsForfait(value: string): number {
  const percent = parseDecimalInput(value);
  const clamped = Math.min(BOX3_FORFAIT_SAVINGS_MAX_PERCENT, Math.max(BOX3_FORFAIT_SAVINGS_MIN_PERCENT, percent));
  return clamped / 100;
}

export default function SavingsVsInvestmentPage() {
  useDocumentMeta({
    titleKey: 'savingsVsInvesting.meta.title',
    descriptionKey: 'savingsVsInvesting.meta.description',
    keywordsKey: 'savingsVsInvesting.meta.keywords',
  });
  const { t } = useTranslation();
  const { lang } = useParams();
  const { currency } = useLocale();
  const [values, setValues] = useState<SavingsVsInvestmentFormValues>(() =>
    createDefaultFormValues(currency as Currency),
  );

  const handleChange = useCallback((patch: Partial<SavingsVsInvestmentFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }));
  }, []);

  const result = useMemo(() => {
    const activeCurrency = currency as Currency;
    const input = new SavingsVsInvestmentInput(
      parseAmountInput(values.initialAmount, activeCurrency),
      parseYears(values.years),
      parseDecimalInput(values.savingsRate),
      parseDecimalInput(values.investmentReturn),
      parseStartYear(values.startYear),
      values.useActualReturnFrom2028,
      values.hasFiscalPartner,
      values.applyExemption,
      parseSavingsForfait(values.savingsForfait),
      currency,
    );
    return calculator.calculate(input);
  }, [values, currency]);

  const years = parseYears(values.years);
  const winnerMessageKey =
    result.winner === WINNER_TIE
      ? 'tie'
      : result.winner === AssetClass.Investments
        ? 'winnerInvestments'
        : 'winnerSavings';

  return (
    <div className="app-background">
      <div className="app-container">
        <header className="detail-header">
          <div className="detail-header__nav">
            <Link to={`/${lang}`} className="detail-back">
              <ArrowLeftIcon aria-hidden="true" />
              <span>{t('savingsVsInvesting.backToOverview')}</span>
            </Link>
            <Link to={`/${lang}`} className="detail-header__logo">{APP_NAME}</Link>
          </div>
        </header>

        <main className="svi-page">
          <div className="svi-page__hero">
            <div className="header-accent" />
            <h1>{t('savingsVsInvesting.title')}</h1>
            <p className="svi-page__intro">{t('savingsVsInvesting.intro')}</p>
            <p className="info-box info-box--copper svi-page__notice">
              {t('savingsVsInvesting.netherlandsOnly')}
            </p>
            <p className="info-box info-box--copper svi-page__notice">
              {t('savingsVsInvesting.investmentRisk')}
            </p>
          </div>

          <div className="svi-page__layout">
            <section className="card svi-page__form" aria-label={t('savingsVsInvesting.form.title')}>
              <SavingsVsInvestmentForm values={values} onChange={handleChange} />
            </section>

            <div className="svi-page__results">
              <section className="svi-result-hero" aria-live="polite">
                <span className="svi-result-hero__verdict">
                  {t(`savingsVsInvesting.result.${winnerMessageKey}`)}
                </span>
                {result.winner !== WINNER_TIE && (
                  <span className="svi-result-hero__difference">
                    {t('savingsVsInvesting.result.differenceLabel')}: {formatCurrency(Math.abs(result.difference), currency)}
                  </span>
                )}
                <span className="svi-result-hero__subtitle">
                  {t('savingsVsInvesting.result.title', { count: years })}
                </span>
              </section>

              <dl className="svi-stats">
                <div className="svi-stats__item">
                  <dt>{t('savingsVsInvesting.result.netSavings')}</dt>
                  <dd>{formatCurrency(result.netSavingsEnd, currency)}</dd>
                </div>
                <div className="svi-stats__item">
                  <dt>{t('savingsVsInvesting.result.netInvestments')}</dt>
                  <dd>{formatCurrency(result.netInvestmentsEnd, currency)}</dd>
                </div>
                <div className="svi-stats__item">
                  <dt>{t('savingsVsInvesting.result.totalTaxSavings')}</dt>
                  <dd>{formatCurrency(result.totalSavingsTax, currency)}</dd>
                </div>
                <div className="svi-stats__item">
                  <dt>{t('savingsVsInvesting.result.totalTaxInvestments')}</dt>
                  <dd>{formatCurrency(result.totalInvestmentsTax, currency)}</dd>
                </div>
              </dl>

              <SavingsVsInvestmentChart result={result} />

              {years > 0 && (
                <section className="svi-tables" aria-label={t('savingsVsInvesting.table.title')}>
                  <h2 className="card-title">{t('savingsVsInvesting.table.title')}</h2>
                  <div className="svi-tables__grid">
                    <ProjectionTable projections={result.savings} assetClass={AssetClass.Savings} currency={currency} />
                    <ProjectionTable projections={result.investments} assetClass={AssetClass.Investments} currency={currency} />
                  </div>
                </section>
              )}
            </div>
          </div>

          <footer className="app-disclaimer svi-page__disclaimer">
            <p>{t('savingsVsInvesting.disclaimer')}</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
