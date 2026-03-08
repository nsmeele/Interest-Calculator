import { useTranslation } from 'react-i18next';
import { type ChartYearRange, CHART_YEAR_RANGES } from '../../enums/ChartYearRange';
import './ChartRangeSelector.css';

interface ChartRangeSelectorProps {
  startYear: number;
  onStartYearChange: (year: number) => void;
  value: ChartYearRange;
  onChange: (range: ChartYearRange) => void;
}

export default function ChartRangeSelector({ startYear, onStartYearChange, value, onChange }: ChartRangeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="chart-range">
      <input
        type="number"
        className="chart-range__year-input"
        value={startYear}
        onChange={(e) => {
          const year = Number(e.target.value);
          if (year >= 2000 && year <= 2100) onStartYearChange(year);
        }}
        min={2000}
        max={2100}
        aria-label={t('chart.startYearLabel')}
      />
      <div role="radiogroup" aria-label={t('chart.rangeLabel')}>
        {CHART_YEAR_RANGES.map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            className={`chart-range__btn${value === n ? ' chart-range__btn--active' : ''}`}
            onClick={() => onChange(n)}
            aria-checked={value === n}
          >
            {n}{t('chart.yearSuffix')}
          </button>
        ))}
      </div>
    </div>
  );
}
