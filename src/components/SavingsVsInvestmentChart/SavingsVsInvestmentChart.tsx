import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { SavingsVsInvestmentResult } from '../../models/SavingsVsInvestmentResult';
import { buildComparisonChartData, type ComparisonChartPoint } from '../../utils/savingsVsInvestmentChart';
import { formatCurrency } from '../../utils/format';
import { useLocale } from '../../context/useLocale';
import { DEFAULT_CURRENCY } from '../../enums/Currency';
import { useTheme } from '../../hooks/useTheme';
import { useContainerWidth } from '../../hooks/useContainerWidth';
import { getChartColors } from '../../utils/chartColors';
import { getTickInterval, formatCompactCurrency } from '../../utils/chartAxis';
import './SavingsVsInvestmentChart.css';

const seriesColors = {
  light: { savings: '#2a5494', investments: '#c8956c' },
  dark: { savings: '#7ba3db', investments: '#d4a87e' },
};

const SERIES_KEYS = ['savings', 'investments'] as const;

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ComparisonChartPoint; value: number; dataKey: string }>;
  currency?: string;
  yearLabel: (year: number) => string;
}

function ChartTooltip({ active, payload, currency = DEFAULT_CURRENCY, yearLabel }: ChartTooltipProps) {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip__label">{yearLabel(point.year)}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="chart-tooltip__row">
          <span className="chart-tooltip__row-label">
            {t(`savingsVsInvesting.assetClass.${entry.dataKey}`)}
          </span>
          <span className="chart-tooltip__value">{formatCurrency(entry.value, currency)}</span>
        </div>
      ))}
    </div>
  );
}

interface SavingsVsInvestmentChartProps {
  result: SavingsVsInvestmentResult;
}

export default function SavingsVsInvestmentChart({ result }: SavingsVsInvestmentChartProps) {
  const { t } = useTranslation();
  const { currency: globalCurrency } = useLocale();
  const { theme } = useTheme();
  const base = getChartColors();
  const colors = seriesColors[theme];
  const [containerRef, containerWidth] = useContainerWidth();

  const data = useMemo(() => buildComparisonChartData(result), [result]);

  // X-axis ticks are calendar years (peildatum 1 januari). Index 0 = startYear (het huidige jaar),
  // elk volgend punt is het saldo per 1 januari van het jaar daarna.
  const startYear = result.savings[0]?.calendarYear;
  const yearLabel = (index: number) =>
    startYear != null ? String(startYear + index) : String(index);

  if (data.length <= 1) return null;

  const tickInterval = getTickInterval(data.length, containerWidth, 3);

  return (
    <section className="comparison-chart" aria-label={t('savingsVsInvesting.chart.ariaLabel')}>
      <h2 className="comparison-chart__title">{t('savingsVsInvesting.chart.title')}</h2>
      <div className="chart-container" ref={containerRef}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={base.grid} vertical={false} />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 10, fill: base.tick }}
              tickLine={false}
              axisLine={{ stroke: base.axis }}
              interval={tickInterval}
              tickFormatter={yearLabel}
            />
            <YAxis
              tick={{ fontSize: 10, fill: base.tick }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatCompactCurrency(v, globalCurrency)}
            />
            <Tooltip content={<ChartTooltip currency={globalCurrency} yearLabel={yearLabel} />} />
            <Legend
              formatter={(value: string) => t(`savingsVsInvesting.assetClass.${value}`)}
              wrapperStyle={{ fontSize: 12 }}
            />
            {SERIES_KEYS.map((key) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[key]}
                strokeWidth={2}
                dot={false}
                animationDuration={600}
                animationEasing="ease-out"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
