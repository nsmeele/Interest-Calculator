import { useTranslation } from 'react-i18next';
import { CURRENCY_SYMBOLS, type Currency } from '../../enums/Currency';
import { useLocale } from '../../context/useLocale';
import { formatAmountInput, parseAmountInput } from '../../utils/format';
import type { SavingsVsInvestmentFormValues } from './formValues';
import './SavingsVsInvestmentForm.css';

interface SavingsVsInvestmentFormProps {
  values: SavingsVsInvestmentFormValues;
  onChange: (patch: Partial<SavingsVsInvestmentFormValues>) => void;
}

export default function SavingsVsInvestmentForm({ values, onChange }: SavingsVsInvestmentFormProps) {
  const { t } = useTranslation();
  const { currency: globalCurrency } = useLocale();
  const activeCurrency = globalCurrency as Currency;
  const symbol = CURRENCY_SYMBOLS[activeCurrency];

  const reformatAmount = (field: 'initialAmount' | 'usedExemption') => {
    const raw = values[field];
    if (raw.trim() === '') return;
    const parsed = parseAmountInput(raw, activeCurrency);
    onChange({ [field]: isNaN(parsed) ? '' : formatAmountInput(parsed, activeCurrency) });
  };

  return (
    <form className="comparison-form" onSubmit={(e) => e.preventDefault()}>
      <h2 className="card-title">{t('savingsVsInvesting.form.title')}</h2>

      <div className="form-group">
        <label className="form-label" htmlFor="svi-initialAmount">{t('savingsVsInvesting.form.initialAmount')}</label>
        <div className="form-input-affix form-input-affix--prefix">
          <span className="affix">{symbol}</span>
          <input
            id="svi-initialAmount"
            type="text"
            inputMode="decimal"
            className="form-input"
            value={values.initialAmount}
            onChange={(e) => onChange({ initialAmount: e.target.value })}
            onBlur={() => reformatAmount('initialAmount')}
            placeholder="100.000"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="svi-years">{t('savingsVsInvesting.form.years')}</label>
        <input
          id="svi-years"
          type="number"
          min="0"
          max="50"
          className="form-input"
          value={values.years}
          onChange={(e) => onChange({ years: e.target.value })}
          placeholder="10"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="svi-savingsRate">{t('savingsVsInvesting.form.savingsRate')}</label>
          <div className="form-input-affix form-input-affix--suffix">
            <input
              id="svi-savingsRate"
              type="text"
              inputMode="decimal"
              className="form-input"
              value={values.savingsRate}
              onChange={(e) => onChange({ savingsRate: e.target.value })}
              placeholder="2"
            />
            <span className="affix">%</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="svi-investmentReturn">{t('savingsVsInvesting.form.investmentReturn')}</label>
          <div className="form-input-affix form-input-affix--suffix">
            <input
              id="svi-investmentReturn"
              type="text"
              inputMode="decimal"
              className="form-input"
              value={values.investmentReturn}
              onChange={(e) => onChange({ investmentReturn: e.target.value })}
              placeholder="7"
            />
            <span className="affix">%</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <div className="form-checkbox">
          <input
            type="checkbox"
            id="svi-useActualReturn"
            checked={values.useActualReturnFrom2028}
            onChange={(e) => onChange({ useActualReturnFrom2028: e.target.checked })}
            aria-describedby="svi-useActualReturn-hint"
          />
          <label htmlFor="svi-useActualReturn">{t('savingsVsInvesting.form.useActualReturnFrom2028')}</label>
        </div>
        <span id="svi-useActualReturn-hint" className="form-hint">{t('savingsVsInvesting.form.useActualReturnFrom2028Hint')}</span>
      </div>

      <div className="form-group">
        <div className="form-checkbox">
          <input
            type="checkbox"
            id="svi-fiscalPartner"
            checked={values.hasFiscalPartner}
            onChange={(e) => onChange({ hasFiscalPartner: e.target.checked })}
            aria-describedby="svi-fiscalPartner-hint"
          />
          <label htmlFor="svi-fiscalPartner">{t('savingsVsInvesting.form.fiscalPartner')}</label>
        </div>
        <span id="svi-fiscalPartner-hint" className="form-hint">{t('savingsVsInvesting.form.fiscalPartnerHint')}</span>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="svi-usedExemption">{t('savingsVsInvesting.form.usedExemption')}</label>
        <div className="form-input-affix form-input-affix--prefix">
          <span className="affix">{symbol}</span>
          <input
            id="svi-usedExemption"
            type="text"
            inputMode="decimal"
            className="form-input"
            value={values.usedExemption}
            onChange={(e) => onChange({ usedExemption: e.target.value })}
            onBlur={() => reformatAmount('usedExemption')}
            placeholder="0"
            aria-describedby="svi-usedExemption-hint"
          />
        </div>
        <span id="svi-usedExemption-hint" className="form-hint">{t('savingsVsInvesting.form.usedExemptionHint')}</span>
      </div>
    </form>
  );
}
