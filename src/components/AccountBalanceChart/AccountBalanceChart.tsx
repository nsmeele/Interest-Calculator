import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { BankAccount } from '../../models/BankAccount';
import type { ChartYearRange } from '../../enums/ChartYearRange';
import { formatCurrency } from '../../utils/format';
import { useTheme } from '../../hooks/useTheme';
import { buildBalanceData } from '../../utils/balanceChart';
import { getRangeEndYear } from '../../utils/chartRange';
import ChartRangeSelector from '../ChartRangeSelector';
import './AccountBalanceChart.css';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  currency: string;
  balanceLabel: string;
}

function ChartTooltip({ active, payload, label, currency, balanceLabel }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="account-chart__tooltip">
      <div className="account-chart__tooltip-label">{label}</div>
      <div className="account-chart__tooltip-row">
        <span className="account-chart__tooltip-dot account-chart__tooltip-dot--balance" />
        <span className="account-chart__tooltip-name">{balanceLabel}</span>
        <span className="account-chart__tooltip-value">{formatCurrency(payload[0].value, currency)}</span>
      </div>
    </div>
  );
}

const chartColors = {
  light: { grid: '#dce6f5', tick: '#4a7cc4', axis: '#dce6f5', balance: '#2a5494' },
  dark:  { grid: '#163058', tick: '#7ba3db', axis: '#163058', balance: '#7ba3db' },
};

interface AccountBalanceChartProps {
  account: BankAccount;
  currency: string;
  startYear: number;
  onStartYearChange: (year: number) => void;
  yearRange: ChartYearRange;
  onRangeChange: (range: ChartYearRange) => void;
  maxRange?: ChartYearRange;
  availableYears?: number[];
  minYear?: number;
}

export default function AccountBalanceChart({ account, currency, startYear, onStartYearChange, yearRange, onRangeChange, maxRange, availableYears, minYear }: AccountBalanceChartProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const gradientId = useId();
  const colors = chartColors[theme];
  const endYear = getRangeEndYear(startYear, yearRange);
  const data = useMemo(() => buildBalanceData(account, startYear, endYear), [account, startYear, endYear]);

  if (data.length < 2) return null;

  const numericBalances = data.map((d) => d.balance).filter((b): b is number => b !== null);
  const minBalance = Math.min(...numericBalances);
  const maxBalance = Math.max(...numericBalances);
  const padding = (maxBalance - minBalance) * 0.1 || maxBalance * 0.02;
  const yMin = Math.floor((minBalance - padding) / 100) * 100;
  const yMax = Math.ceil((maxBalance + padding) / 100) * 100;

  const maxLabelCount = 12;
  const tickInterval = data.length <= maxLabelCount ? 0 : Math.ceil(data.length / maxLabelCount) - 1;

  return (
    <section className="account-chart" aria-label={t('detail.chartLabel')}>
      <h2>{t('detail.chartLabel')}</h2>
      <ChartRangeSelector startYear={startYear} onStartYearChange={onStartYearChange} value={yearRange} onChange={onRangeChange} maxRange={maxRange} availableYears={availableYears} minYear={minYear} />
      <div className="account-chart__container" key={`${yMin}-${yMax}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.balance} stopOpacity={0.25} />
                <stop offset="100%" stopColor={colors.balance} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: colors.tick }}
              tickLine={false}
              axisLine={{ stroke: colors.axis }}
              interval={tickInterval}
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fontSize: 10, fill: colors.tick }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => formatCurrency(Math.round(v), currency)}
            />
            <Tooltip content={
              <ChartTooltip
                currency={currency}
                balanceLabel={t('accounts.balance')}
              />
            } />
            <Area
              type="monotone"
              dataKey="balance"
              stroke={colors.balance}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
