import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type ChartYearRange, CHART_YEAR_RANGES } from '../../enums/ChartYearRange';
import './ChartRangeSelector.css';

interface ChartRangeSelectorProps {
  startYear: number;
  onStartYearChange: (year: number) => void;
  value: ChartYearRange;
  onChange: (range: ChartYearRange) => void;
  maxRange?: ChartYearRange;
  availableYears?: number[];
  minYear?: number;
}

export default function ChartRangeSelector({ startYear, onStartYearChange, value, onChange, maxRange, availableYears, minYear }: ChartRangeSelectorProps) {
  const { t } = useTranslation();
  const visibleRanges = maxRange ? CHART_YEAR_RANGES.filter((n) => n <= maxRange) : CHART_YEAR_RANGES;
  const [draft, setDraft] = useState(String(startYear));

  useEffect(() => { setDraft(String(startYear)); }, [startYear]);

  return (
    <div className="chart-range">
      {availableYears ? (
        <select
          className="form-input-compact chart-range__year-select"
          value={startYear}
          onChange={(e) => onStartYearChange(Number(e.target.value))}
          aria-label={t('chart.startYearLabel')}
        >
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      ) : (
        <input
          type="number"
          className="form-input-compact chart-range__year-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            const year = Number(draft);
            const min = minYear ?? 2000;
            if (year >= min && year <= 2100) onStartYearChange(year);
            else setDraft(String(startYear));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          min={2000}
          max={2100}
          aria-label={t('chart.startYearLabel')}
        />
      )}
      <div role="radiogroup" aria-label={t('chart.rangeLabel')}>
        {visibleRanges.map((n) => (
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
