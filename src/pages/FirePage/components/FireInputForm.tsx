import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useLocale } from '../../../context/useLocale';
import { CURRENCY_SYMBOLS, type Currency } from '../../../enums/Currency';
import { formatAmountInput, parseAmountInput } from '../../../utils/format';
import { FireInput } from '../../../models/FireInput';
import {
  FIRE_DEFAULT_RETURN_RATE,
  FIRE_DEFAULT_INFLATION_RATE,
  FIRE_DEFAULT_SWR,
} from '../../../calculator/FireCalculator';

interface FireInputFormProps {
  onSubmit: (input: FireInput) => void;
  initialSavings?: number;
}

interface FormState {
  currentAge: string;
  currentSavings: string;
  monthlyIncome: string;
  monthlyExpenses: string;
  expectedReturn: string;
  inflation: string;
  safeWithdrawalRate: string;
  errors: Record<string, string>;
}

function createInitialForm(currency: Currency, initialSavings?: number): FormState {
  return {
    currentAge: '30',
    currentSavings: formatAmountInput(initialSavings && initialSavings > 0 ? initialSavings : 50000, currency),
    monthlyIncome: formatAmountInput(4000, currency),
    monthlyExpenses: formatAmountInput(2000, currency),
    expectedReturn: FIRE_DEFAULT_RETURN_RATE.toString(),
    inflation: FIRE_DEFAULT_INFLATION_RATE.toString(),
    safeWithdrawalRate: FIRE_DEFAULT_SWR.toString(),
    errors: {},
  };
}

export default function FireInputForm({ onSubmit, initialSavings }: FireInputFormProps) {
  const { t } = useTranslation();
  const { currency } = useLocale();
  const [form, setForm] = useState(() => createInitialForm(currency, initialSavings));
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currencySymbol = CURRENCY_SYMBOLS[currency];

  function updateForm(patch: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function clearError(key: string) {
    setForm((prev) => {
      const { [key]: _, ...rest } = prev.errors;
      return { ...prev, errors: rest };
    });
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    const age = parseInt(form.currentAge);

    if (!form.currentAge.trim() || isNaN(age)) {
      next.currentAge = t('fire.form.errorAgeRequired');
    } else if (age < 18 || age > 80) {
      next.currentAge = t('fire.form.errorAgeRange');
    }

    const savings = parseAmountInput(form.currentSavings, currency);
    if (!form.currentSavings.trim() || isNaN(savings)) {
      next.currentSavings = t('fire.form.errorSavingsRequired');
    } else if (savings < 0) {
      next.currentSavings = t('fire.form.errorSavingsNegative');
    }

    const income = parseAmountInput(form.monthlyIncome, currency);
    if (!form.monthlyIncome.trim() || isNaN(income)) {
      next.monthlyIncome = t('fire.form.errorIncomeRequired');
    } else if (income <= 0) {
      next.monthlyIncome = t('fire.form.errorIncomePositive');
    }

    const expenses = parseAmountInput(form.monthlyExpenses, currency);
    if (!form.monthlyExpenses.trim() || isNaN(expenses)) {
      next.monthlyExpenses = t('fire.form.errorExpensesRequired');
    } else if (expenses <= 0) {
      next.monthlyExpenses = t('fire.form.errorExpensesPositive');
    } else if (income > 0 && expenses >= income) {
      next.monthlyExpenses = t('fire.form.errorExpensesExceedIncome');
    }

    return next;
  }

  function handleAmountBlur(field: 'currentSavings' | 'monthlyIncome' | 'monthlyExpenses') {
    const parsed = parseAmountInput(form[field], currency);
    if (!isNaN(parsed) && parsed >= 0) {
      updateForm({ [field]: formatAmountInput(form[field], currency) });
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationErrors = validate();
    updateForm({ errors: validationErrors });
    if (Object.keys(validationErrors).length > 0) return;

    const input = new FireInput(
      parseInt(form.currentAge),
      parseAmountInput(form.currentSavings, currency),
      parseAmountInput(form.monthlyIncome, currency),
      parseAmountInput(form.monthlyExpenses, currency),
      parseFloat(form.expectedReturn.replace(',', '.')) || FIRE_DEFAULT_RETURN_RATE,
      parseFloat(form.inflation.replace(',', '.')) || FIRE_DEFAULT_INFLATION_RATE,
      parseFloat(form.safeWithdrawalRate.replace(',', '.')) || FIRE_DEFAULT_SWR,
    );
    onSubmit(input);
  }

  return (
    <div className="fire-form">
      <h2 className="fire-form__title">{t('fire.subtitle')}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="fire-age">{t('fire.form.currentAge')}</label>
          <input
            id="fire-age"
            type="number"
            min="18"
            max="80"
            className={`form-input${form.errors.currentAge ? ' form-input--error' : ''}`}
            value={form.currentAge}
            onChange={(e) => { updateForm({ currentAge: e.target.value }); clearError('currentAge'); }}
          />
          {form.errors.currentAge && <span className="form-error">{form.errors.currentAge}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="fire-savings">{t('fire.form.currentSavings')}</label>
          <div className="form-input-affix form-input-affix--prefix">
            <span className="affix">{currencySymbol}</span>
            <input
              id="fire-savings"
              type="text"
              inputMode="decimal"
              className={`form-input${form.errors.currentSavings ? ' form-input--error' : ''}`}
              value={form.currentSavings}
              onChange={(e) => { updateForm({ currentSavings: e.target.value }); clearError('currentSavings'); }}
              onBlur={() => handleAmountBlur('currentSavings')}
            />
          </div>
          {form.errors.currentSavings && <span className="form-error">{form.errors.currentSavings}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="fire-income">{t('fire.form.monthlyIncome')}</label>
          <div className="form-input-affix form-input-affix--prefix">
            <span className="affix">{currencySymbol}</span>
            <input
              id="fire-income"
              type="text"
              inputMode="decimal"
              className={`form-input${form.errors.monthlyIncome ? ' form-input--error' : ''}`}
              value={form.monthlyIncome}
              onChange={(e) => { updateForm({ monthlyIncome: e.target.value }); clearError('monthlyIncome'); }}
              onBlur={() => handleAmountBlur('monthlyIncome')}
            />
          </div>
          {form.errors.monthlyIncome && <span className="form-error">{form.errors.monthlyIncome}</span>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="fire-expenses">{t('fire.form.monthlyExpenses')}</label>
          <div className="form-input-affix form-input-affix--prefix">
            <span className="affix">{currencySymbol}</span>
            <input
              id="fire-expenses"
              type="text"
              inputMode="decimal"
              className={`form-input${form.errors.monthlyExpenses ? ' form-input--error' : ''}`}
              value={form.monthlyExpenses}
              onChange={(e) => { updateForm({ monthlyExpenses: e.target.value }); clearError('monthlyExpenses'); }}
              onBlur={() => handleAmountBlur('monthlyExpenses')}
            />
          </div>
          {form.errors.monthlyExpenses && <span className="form-error">{form.errors.monthlyExpenses}</span>}
        </div>

        <button
          type="button"
          className="advanced-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
          aria-expanded={showAdvanced}
          aria-controls="fire-advanced-section"
        >
          <ChevronDownIcon className={`advanced-toggle__icon${showAdvanced ? ' advanced-toggle__icon--open' : ''}`} />
          {t('fire.form.advanced')}
        </button>

        {showAdvanced && (
          <div id="fire-advanced-section" className="advanced-section">
            <div className="form-group">
              <label className="form-label" htmlFor="fire-return">
                {t('fire.form.expectedReturn')}
                <span className="form-hint">{t('fire.form.expectedReturnHint')}</span>
              </label>
              <div className="form-input-affix form-input-affix--suffix">
                <input
                  id="fire-return"
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  value={form.expectedReturn}
                  onChange={(e) => updateForm({ expectedReturn: e.target.value })}
                  placeholder="7"
                />
                <span className="affix">%</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fire-inflation">
                {t('fire.form.inflation')}
                <span className="form-hint">{t('fire.form.inflationHint')}</span>
              </label>
              <div className="form-input-affix form-input-affix--suffix">
                <input
                  id="fire-inflation"
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  value={form.inflation}
                  onChange={(e) => updateForm({ inflation: e.target.value })}
                  placeholder="2"
                />
                <span className="affix">%</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fire-swr">
                {t('fire.form.safeWithdrawalRate')}
                <span className="form-hint">{t('fire.form.safeWithdrawalRateHint')}</span>
              </label>
              <div className="form-input-affix form-input-affix--suffix">
                <input
                  id="fire-swr"
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  value={form.safeWithdrawalRate}
                  onChange={(e) => updateForm({ safeWithdrawalRate: e.target.value })}
                  placeholder="4"
                />
                <span className="affix">%</span>
              </div>
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary">
          {t('fire.form.calculate')}
        </button>
      </form>
    </div>
  );
}
