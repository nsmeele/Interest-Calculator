import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { BankAccount } from '../../models/BankAccount';
import { InterestType } from '../../enums/InterestType';
import { formatCurrency } from '../../utils/format';
import { useTheme } from '../../hooks/useTheme';
import './AccountBalanceChart.css';

interface BalanceDataPoint {
  label: string;
  balance: number;
}

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

function formatPeriodLabel(date: string): string {
  const [year, month] = date.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  const label = new Intl.DateTimeFormat('nl-NL', { month: 'short' }).format(d);
  return `${label} '${String(year).slice(2)}`;
}

function buildBalanceData(account: BankAccount): BalanceDataPoint[] {
  if (!account.startDate || account.periods.length === 0) return [];

  const isSimple = account.interestType === InterestType.Simple;
  const points: BalanceDataPoint[] = [
    { label: formatPeriodLabel(account.startDate), balance: account.startAmount },
  ];

  let cumulativeInterest = 0;
  for (const period of account.periods) {
    if (!period.endDate) continue;
    if (isSimple) cumulativeInterest += period.interestEarned;
    points.push({
      label: formatPeriodLabel(period.endDate),
      balance: period.endBalance + (isSimple ? cumulativeInterest : 0),
    });
  }

  return points;
}

interface AccountBalanceChartProps {
  account: BankAccount;
  currency: string;
}

export default function AccountBalanceChart({ account, currency }: AccountBalanceChartProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = chartColors[theme];
  const data = useMemo(() => buildBalanceData(account), [account]);

  if (data.length < 2) return null;

  const minBalance = Math.min(...data.map((d) => d.balance));
  const maxBalance = Math.max(...data.map((d) => d.balance));
  const padding = (maxBalance - minBalance) * 0.1 || maxBalance * 0.02;
  const yMin = Math.floor((minBalance - padding) / 100) * 100;
  const yMax = Math.ceil((maxBalance + padding) / 100) * 100;

  const maxLabelCount = 12;
  const tickInterval = data.length <= maxLabelCount ? 0 : Math.ceil(data.length / maxLabelCount) - 1;

  return (
    <section className="account-chart" aria-label={t('detail.chartLabel')}>
      <h2>{t('detail.chartLabel')}</h2>
      <div className="account-chart__container">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
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
              fill="url(#balanceGradient)"
              animationDuration={600}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
