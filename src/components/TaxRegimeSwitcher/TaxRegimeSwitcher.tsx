import { useTranslation } from 'react-i18next';
import { useTaxSettings } from '../../context/useTaxSettings';
import './TaxRegimeSwitcher.css';

const FORFAITAIR = 'forfaitair';
const ACTUAL = 'actual';

export default function TaxRegimeSwitcher() {
  const { t } = useTranslation();
  const { useActualReturnFrom2028, setUseActualReturnFrom2028 } = useTaxSettings();

  return (
    <div className="tax-regime-switcher">
      <select
        className="toolbar-select tax-regime-switcher__select"
        value={useActualReturnFrom2028 ? ACTUAL : FORFAITAIR}
        onChange={(e) => setUseActualReturnFrom2028(e.target.value === ACTUAL)}
        aria-label={t('netIncome.regimeLabel')}
      >
        <option value={FORFAITAIR}>{t('netIncome.regimeForfaitair')}</option>
        <option value={ACTUAL}>{t('netIncome.regimeActual')}</option>
      </select>
    </div>
  );
}
