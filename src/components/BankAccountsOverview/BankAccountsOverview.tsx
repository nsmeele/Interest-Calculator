import { Fragment, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { InformationCircleIcon, PlusIcon, ChevronDownIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';
import type { BankAccount } from '../../models/BankAccount';
import type { CashFlow } from '../../models/CashFlow';
import type { RateChange } from '../../models/RateChange';
import { INTERVAL_LABELS } from '../../enums/PayoutInterval';
import { INTEREST_TYPE_LABELS } from '../../enums/InterestType';
import { formatCurrency, formatDurationShort, formatDate } from '../../utils/format';
import CashFlowEditor from '../CashFlowEditor';
import RateChangeEditor from '../RateChangeEditor';
import './BankAccountsOverview.css';

interface BankAccountsOverviewProps {
  results: BankAccount[];
  onRemove: (id: string) => void;
  onClear: () => void;
  portfolioIds: Set<string>;
  onTogglePortfolio: (id: string) => void;
  onEdit: (result: BankAccount) => void;
  onNewAccount: () => void;
  onUpdateCashFlows: (id: string, cashFlows: CashFlow[]) => void;
  onUpdateRateChanges: (id: string, rateChanges: RateChange[]) => void;
  onExport: () => void;
  onImportFile: (file: File) => Promise<void>;
  importError: string | null;
}

function ColumnInfo({ label, info }: { label: string; info: string }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const show = useCallback((e: React.MouseEvent | React.FocusEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPos({ top: rect.top - 8, left: rect.left + rect.width / 2 });
  }, []);

  const hide = useCallback(() => setPos(null), []);

  return (
    <>
      {label}
      <span
        className="popover-anchor popover-anchor--th"
        tabIndex={0}
        role="button"
        aria-label={`Info over ${label}`}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <InformationCircleIcon className="popover-anchor__icon" aria-hidden="true" />
      </span>
      {pos && createPortal(
        <span
          className="column-info__popover"
          style={{ top: pos.top, left: pos.left }}
        >
          {info}
        </span>,
        document.body,
      )}
    </>
  );
}

export default function BankAccountsOverview({ results, onRemove, onClear, portfolioIds, onTogglePortfolio, onEdit, onNewAccount, onUpdateCashFlows, onUpdateRateChanges, onExport, onImportFile, importError }: BankAccountsOverviewProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
      e.target.value = '';
    }
  }

  if (results.length === 0) {
    return (
      <div className="empty-state">
        <PlusIcon className="empty-state__icon" aria-hidden="true" />
        <h3>Nog geen rekeningen</h3>
        <p>Voeg je eerste rekening toe en vergelijk meerdere rekeningen naast elkaar.</p>
        <button className="btn-primary empty-state__btn" onClick={onNewAccount}>
          Nieuwe rekening
        </button>
      </div>
    );
  }

  const sorted = [...results].sort((a, b) => {
    if (!a.endDate && !b.endDate) return 0;
    if (!a.endDate) return 1;
    if (!b.endDate) return -1;
    return a.endDate.localeCompare(b.endDate);
  });


  return (
    <div className="results-section">
      <div className="card">
        <div className="card-header">
          <div className="results-header">
            <div>
              <h2>
                Rekeningen
                <span className="results-count">{results.length}</span>
              </h2>
              <p className="results-hint">Vergelijk je rekeningen en zie welke het meest oplevert. Klik op een rij voor periodedetails, of op het potlood om te bewerken. Met de ster voeg je een rekening toe aan je portefeuille — daar zie je je totale inleg, rente-opbrengst en maandelijkse rente-inkomsten bij elkaar.</p>
            </div>
            <div className="results-header__actions">
              <button className="btn-new-account" onClick={onNewAccount}>
                <PlusIcon aria-hidden="true" />
                Nieuwe rekening
              </button>
              <button className="btn-transfer" onClick={onExport} aria-label="Exporteren">
                Exporteren
              </button>
              <button className="btn-transfer" onClick={() => fileInputRef.current?.click()} aria-label="Importeren">
                Importeren
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="sr-only"
                onChange={handleFileChange}
                aria-hidden="true"
                tabIndex={-1}
              />
              <button className="btn-danger" onClick={onClear}>
                Alles wissen
              </button>
            </div>
          </div>
          {importError && (
            <p className="data-transfer__error" role="alert">{importError}</p>
          )}
        </div>

        <div className="comparison-table-wrapper-inner">
          <table className="comparison-table">
          <thead>
            <tr>
              <th></th>
              <th>Rente</th>
              <th>Type</th>
              <th>Uitbetaling</th>
              <th>Looptijd</th>
              <th>Van</th>
              <th>Tot</th>
              <th><ColumnInfo label="Saldo" info="Je huidige inleg: het startbedrag plus alle stortingen en min alle opnames. Rente is hier niet in meegenomen." /></th>
              <th><ColumnInfo label="Uitbetaald" info="Rente die al daadwerkelijk is uitbetaald op de uitbetalingsdatums tot en met vandaag." /></th>
              <th><ColumnInfo label="Opgebouwd" info="Rente die is opgebouwd sinds de laatste uitbetaling, maar nog niet is uitbetaald. Dit bedrag groeit dagelijks." /></th>
              <th><ColumnInfo label="Rente-opbrengst" info="De totale rente over de gehele looptijd van de rekening, inclusief toekomstige periodes." /></th>
              <th><ColumnInfo label="Totaal" info="Je eindbedrag na de volledige looptijd: inleg + alle stortingen/opnames + totale rente-opbrengst." /></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const isOpen = openId === r.id;
              return (
                <Fragment key={r.id}>
                  <tr
                    className="comparison-row"
                    onClick={() => setOpenId(isOpen ? null : r.id)}
                  >
                    <td>
                      <ChevronDownIcon className={`comparison-chevron${isOpen ? ' comparison-chevron--open' : ''}`} aria-hidden="true" />
                    </td>
                    <td>{r.annualInterestRate}%</td>
                    <td>{INTEREST_TYPE_LABELS[r.interestType]}</td>
                    <td>{INTERVAL_LABELS[r.interval]}</td>
                    <td>{r.isOngoing ? 'Lopend' : formatDurationShort(r.durationMonths)}</td>
                    <td>{r.startDate ? formatDate(r.startDate) : '—'}</td>
                    <td>{r.endDate ? formatDate(r.endDate) : '—'}</td>
                    <td className="amount">
                      {formatCurrency(r.currentBalance)}
                    </td>
                    <td className="amount">
                      {formatCurrency(r.disbursedToDate)}
                    </td>
                    <td className="amount">
                      {formatCurrency(r.accruedInterest)}
                    </td>
                    <td className="amount">
                      {formatCurrency(r.totalInterest)}
                      {r.nextPayoutDate && (
                        <span className="next-payout">{formatDate(r.nextPayoutDate)}</span>
                      )}
                    </td>
                    <td className="amount">{formatCurrency(r.endAmount)}</td>
                    <td className="comparison-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-icon"
                        title="Bewerken"
                        onClick={() => onEdit(r)}
                        aria-label="Bewerken"
                      >
                        <PencilIcon aria-hidden="true" />
                      </button>
                      <button
                        className={`btn-portfolio${portfolioIds.has(r.id) ? ' btn-portfolio--active' : ''}`}
                        title={portfolioIds.has(r.id) ? 'Verwijder uit portefeuille' : 'Toevoegen aan portefeuille'}
                        onClick={() => onTogglePortfolio(r.id)}
                        aria-label={portfolioIds.has(r.id) ? 'Verwijder uit portefeuille' : 'Toevoegen aan portefeuille'}
                      >
                        {portfolioIds.has(r.id) ? <StarIconSolid aria-hidden="true" /> : <StarIconOutline aria-hidden="true" />}
                      </button>
                      <button
                        className="btn-icon"
                        title="Verwijderen"
                        onClick={() => onRemove(r.id)}
                        aria-label="Verwijderen"
                      >
                        <XMarkIcon aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="period-detail-row">
                      <td colSpan={13}>
                        <div className="period-table-wrapper">
                          <table className="period-table">
                            <thead>
                              <tr>
                                <th>Periode</th>
                                <th>Beginsaldo</th>
                                {r.totalDeposited !== 0 && <th>Gestort</th>}
                                <th>Rente</th>
                                <th>Uitbetaald</th>
                                <th>Eindsaldo</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.periods.map((p, idx) => {
                                const periodStart = idx === 0 ? r.startDate : r.periods[idx - 1].endDate;
                                return (
                                <tr key={p.period}>
                                  <td>
                                    {p.periodLabel}
                                    {periodStart && p.endDate && (
                                      <span className="period-table__date">{formatDate(periodStart)} – {formatDate(p.endDate)}</span>
                                    )}
                                  </td>
                                  <td>{formatCurrency(p.startBalance)}</td>
                                  {r.totalDeposited !== 0 && (
                                    <td className={p.deposited > 0 ? 'text-success' : p.deposited < 0 ? 'text-danger' : ''}>
                                      {p.deposited !== 0 ? formatCurrency(p.deposited) : '—'}
                                    </td>
                                  )}
                                  <td>{formatCurrency(p.interestEarned)}</td>
                                  <td>{formatCurrency(p.disbursed)}</td>
                                  <td>{formatCurrency(p.endBalance)}</td>
                                </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="period-editors">
                          <CashFlowEditor
                            cashFlows={r.cashFlows}
                            onUpdate={(cfs) => onUpdateCashFlows(r.id, cfs)}
                          />
                          {r.isVariableRate && (
                            <RateChangeEditor
                              rateChanges={r.rateChanges}
                              onUpdate={(rcs) => onUpdateRateChanges(r.id, rcs)}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
