import { useTranslation } from 'react-i18next';
import type { YearProjection } from '../../models/SavingsVsInvestmentResult';
import { AssetClass } from '../../enums/AssetClass';
import { formatCurrency } from '../../utils/format';
import './ProjectionTable.css';

interface ProjectionTableProps {
  projections: YearProjection[];
  assetClass: AssetClass;
  currency: string;
}

/** Jaartabel met per jaar het brutorendement, de box 3-heffing en het eindsaldo. */
export default function ProjectionTable({ projections, assetClass, currency }: ProjectionTableProps) {
  const { t } = useTranslation();
  const titleId = `projection-table-${assetClass}`;

  return (
    <div className="projection-table">
      <h3 className="projection-table__title" id={titleId}>
        {t(`savingsVsInvesting.assetClass.${assetClass}`)}
      </h3>
      <div className="projection-table__scroll">
        <table aria-labelledby={titleId}>
          <thead>
            <tr>
              <th scope="col">{t('savingsVsInvesting.table.year')}</th>
              <th scope="col">{t('savingsVsInvesting.table.grossReturn')}</th>
              <th scope="col">{t('savingsVsInvesting.table.tax')}</th>
              <th scope="col">{t('savingsVsInvesting.table.endBalance')}</th>
            </tr>
          </thead>
          <tbody>
            {projections.map((p) => (
              <tr key={p.year}>
                <td>{p.calendarYear}</td>
                <td>{formatCurrency(p.grossReturn, currency)}</td>
                <td>{formatCurrency(p.tax, currency)}</td>
                <td>{formatCurrency(p.endBalance, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
