import { useTranslation } from 'react-i18next';
import { CURRENCY_SYMBOLS, Currency } from '../../enums/Currency';
import { useLocale } from '../../context/useLocale';
import { formatAmountInput, parseAmountInput, formatCurrency } from '../../utils/format';
import {
  BOX3_TAX_FREE_CAPITAL_2026,
  BOX3_TAX_FREE_RETURN_2028,
  BOX3_FORFAIT_SAVINGS_MIN_PERCENT,
  BOX3_FORFAIT_SAVINGS_MAX_PERCENT,
  BOX3_FORFAIT_SAVINGS_STEP_PERCENT,
} from '../../constants/box3';
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

  const reformatInitialAmount = () => {
    const raw = values.initialAmount;
    if (raw.trim() === '') return;
    const parsed = parseAmountInput(raw, activeCurrency);
    onChange({ initialAmount: isNaN(parsed) ? '' : formatAmountInput(parsed, activeCurrency) });
  };

  // The box 3 exemptions are statutory euro figures, so format them in EUR regardless of display currency.
  const exemptionHint = t('savingsVsInvesting.form.applyExemptionHint', {
    capital: formatCurrency(BOX3_TAX_FREE_CAPITAL_2026, Currency.EUR),
    returns: formatCurrency(BOX3_TAX_FREE_RETURN_2028, Currency.EUR),
  });

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
            onBlur={reformatInitialAmount}
            placeholder="100.000"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="svi-startYear">{t('savingsVsInvesting.form.startYear')}</label>
          <input
            id="svi-startYear"
            type="number"
            min="2001"
            max="2100"
            step="1"
            className="form-input"
            value={values.startYear}
            onChange={(e) => onChange({ startYear: e.target.value })}
            placeholder="2026"
          />
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
        <div className="form-slider__header">
          <label className="form-label" htmlFor="svi-savingsForfait">{t('savingsVsInvesting.form.savingsForfait')}</label>
          <span className="form-slider__value">{values.savingsForfait.replace('.', ',')}%</span>
        </div>
        <input
          id="svi-savingsForfait"
          type="range"
          className="form-slider"
          min={BOX3_FORFAIT_SAVINGS_MIN_PERCENT}
          max={BOX3_FORFAIT_SAVINGS_MAX_PERCENT}
          step={BOX3_FORFAIT_SAVINGS_STEP_PERCENT}
          value={values.savingsForfait}
          onChange={(e) => onChange({ savingsForfait: e.target.value })}
          aria-describedby="svi-savingsForfait-hint"
        />
        <span id="svi-savingsForfait-hint" className="form-hint">{t('savingsVsInvesting.form.savingsForfaitHint')}</span>
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
            id="svi-applyExemption"
            checked={values.applyExemption}
            onChange={(e) => onChange({
              applyExemption: e.target.checked,
              ...(e.target.checked ? {} : { hasFiscalPartner: false }),
            })}
            aria-describedby="svi-applyExemption-hint"
          />
          <label htmlFor="svi-applyExemption">{t('savingsVsInvesting.form.applyExemption')}</label>
        </div>
        <span id="svi-applyExemption-hint" className="form-hint">{exemptionHint}</span>
      </div>

      <div className="form-group">
        <div className="form-checkbox">
          <input
            type="checkbox"
            id="svi-fiscalPartner"
            checked={values.hasFiscalPartner}
            disabled={!values.applyExemption}
            onChange={(e) => onChange({ hasFiscalPartner: e.target.checked })}
            aria-describedby="svi-fiscalPartner-hint"
          />
          <label htmlFor="svi-fiscalPartner">{t('savingsVsInvesting.form.fiscalPartner')}</label>
        </div>
        <span id="svi-fiscalPartner-hint" className="form-hint">{t('savingsVsInvesting.form.fiscalPartnerHint')}</span>
      </div>
    </form>
  );
}
