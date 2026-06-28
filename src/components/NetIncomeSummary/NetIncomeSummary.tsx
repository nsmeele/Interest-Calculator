import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { BankAccount } from '../../models/BankAccount';
import type { Currency } from '../../enums/Currency';
import { AccountTaxCalculator } from '../../calculator/AccountTaxCalculator';
import { useTaxSettings } from '../../context/useTaxSettings';
import { formatCurrency } from '../../utils/format';
import { currentYear } from '../../utils/chartRange';
import InfoPopover from '../InfoPopover';
import './NetIncomeSummary.css';

const calculator = new AccountTaxCalculator();

interface NetIncomeSummaryProps {
  account: BankAccount;
  currency: Currency;
}

export default function NetIncomeSummary({ account, currency }: NetIncomeSummaryProps) {
  const { t } = useTranslation();
  const { useActualReturnFrom2028, setUseActualReturnFrom2028, hasFiscalPartner, applyExemption } = useTaxSettings();

  const breakdown = useMemo(
    () => calculator.calculate(account, { useActualReturnFrom2028, hasFiscalPartner, applyExemption }, currentYear()),
    [account, useActualReturnFrom2028, hasFiscalPartner, applyExemption],
  );

  const items = [
    { key: 'thisYear', label: t('netIncome.interestThisYear'), gross: breakdown.grossThisYear, net: breakdown.netThisYear },
    { key: 'thisMonth', label: t('netIncome.interestThisMonth'), gross: breakdown.grossInterestThisMonth, net: breakdown.netInterestThisMonth },
  ];
  if (!account.isOngoing) {
    items.push({ key: 'total', label: t('netIncome.totalInterest'), gross: breakdown.grossTotalInterest, net: breakdown.netTotalInterest });
    items.push({ key: 'endAmount', label: t('netIncome.endAmount'), gross: breakdown.grossEndAmount, net: breakdown.netEndAmount });
  }

  return (
    <section className="card net-income" aria-label={t('netIncome.label')}>
      <header className="net-income__header">
        <h2 className="card-title net-income__title">
          {t('netIncome.label')}
          <InfoPopover label={t('accounts.infoAbout', { label: t('netIncome.label') })}>{t('netIncome.info')}</InfoPopover>
        </h2>
        <div className="net-income__regime" role="group" aria-label={t('netIncome.regimeLabel')}>
          <button
            type="button"
            className={`net-income__regime-option${!useActualReturnFrom2028 ? ' net-income__regime-option--active' : ''}`}
            aria-pressed={!useActualReturnFrom2028}
            onClick={() => setUseActualReturnFrom2028(false)}
          >
            {t('netIncome.regimeForfaitair')}
          </button>
          <button
            type="button"
            className={`net-income__regime-option${useActualReturnFrom2028 ? ' net-income__regime-option--active' : ''}`}
            aria-pressed={useActualReturnFrom2028}
            onClick={() => setUseActualReturnFrom2028(true)}
          >
            {t('netIncome.regimeActual')}
          </button>
        </div>
      </header>

      <dl className="net-income__grid">
        {items.map(({ key, label, gross, net }) => (
          <div key={key} className="net-income__item">
            <dt className="net-income__item-label">{label}</dt>
            <dd className="net-income__values">
              <span className="net-income__value">
                <span className="net-income__value-tag">{t('netIncome.gross')}</span>
                <span className="net-income__value-amount">{formatCurrency(gross, currency)}</span>
              </span>
              <span className="net-income__value net-income__value--net">
                <span className="net-income__value-tag">{t('netIncome.net')}</span>
                <span className="net-income__value-amount">{formatCurrency(net, currency)}</span>
              </span>
            </dd>
          </div>
        ))}
      </dl>

      <p className="net-income__note">
        {t('netIncome.totalTaxNote', { amount: formatCurrency(breakdown.totalTax, currency) })} {t('netIncome.exemptionNote')}
      </p>
    </section>
  );
}
