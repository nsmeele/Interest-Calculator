import { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { CashFlow } from '../../models/CashFlow';
import { formatCurrency, formatDate } from '../../utils/format';
import './CashFlowEditor.css';

const RECURRING_OPTIONS = [
  { value: 1, label: 'Maandelijks' },
  { value: 3, label: 'Per kwartaal' },
  { value: 6, label: 'Per half jaar' },
  { value: 12, label: 'Per jaar' },
];

interface CashFlowEditorProps {
  cashFlows: CashFlow[];
  onUpdate: (cashFlows: CashFlow[]) => void;
}

export default function CashFlowEditor({ cashFlows, onUpdate }: CashFlowEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isWithdrawal, setIsWithdrawal] = useState(false);
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [intervalMonths, setIntervalMonths] = useState(1);

  function resetForm() {
    setDate('');
    setAmount('');
    setDescription('');
    setIsRecurring(false);
    setIntervalMonths(1);
    setIsWithdrawal(false);
  }

  function handleAdd() {
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!date || isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newCashFlow: CashFlow = {
      id: crypto.randomUUID(),
      date,
      amount: isWithdrawal ? -parsedAmount : parsedAmount,
      description: description || (isWithdrawal ? 'Opname' : 'Storting'),
      ...(isRecurring ? { recurring: { intervalMonths } } : {}),
    };

    onUpdate([...cashFlows, newCashFlow].sort((a, b) => a.date.localeCompare(b.date)));
    resetForm();
    setIsAdding(false);
  }

  function handleRemove(id: string) {
    onUpdate(cashFlows.filter((cf) => cf.id !== id));
  }

  const sorted = [...cashFlows].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="cashflow-editor">
      <div className="cashflow-editor__header">
        <h3>Transacties</h3>
        <button
          className={`cashflow-editor__add-btn${isAdding ? ' cashflow-editor__add-btn--active' : ''}`}
          onClick={() => { setIsAdding(!isAdding); if (isAdding) resetForm(); }}
        >
          {isAdding ? 'Annuleren' : <><PlusIcon aria-hidden="true" /> Toevoegen</>}
        </button>
      </div>

      {isAdding && (
        <div className="cashflow-editor__form">
          <div className="cashflow-editor__type-toggle">
            <button
              type="button"
              className={`cashflow-type${!isWithdrawal ? ' cashflow-type--active cashflow-type--deposit' : ''}`}
              onClick={() => setIsWithdrawal(false)}
            >
              Storting
            </button>
            <button
              type="button"
              className={`cashflow-type${isWithdrawal ? ' cashflow-type--active cashflow-type--withdrawal' : ''}`}
              onClick={() => setIsWithdrawal(true)}
            >
              Opname
            </button>
          </div>

          <div className="cashflow-editor__fields">
            <div>
              <label className="form-label" htmlFor="cf-date">Datum</label>
              <input
                id="cf-date"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="cf-amount">Bedrag</label>
              <div className="form-input-prefix">
                <span className="prefix">&euro;</span>
                <input
                  id="cf-amount"
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div>
              <label className="form-label" htmlFor="cf-desc">Omschrijving</label>
              <input
                id="cf-desc"
                type="text"
                className="form-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isWithdrawal ? 'Opname' : 'Storting'}
              />
            </div>
          </div>

          <div className="cashflow-editor__recurring">
            <label className="cashflow-editor__recurring-label">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              Terugkerend
            </label>
            {isRecurring && (
              <select
                className="cashflow-editor__recurring-select"
                value={intervalMonths}
                onChange={(e) => setIntervalMonths(Number(e.target.value))}
              >
                {RECURRING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
          </div>

          <div className="cashflow-editor__actions">
            <button
              type="button"
              className="cashflow-editor__submit"
              onClick={handleAdd}
            >
              Toevoegen
            </button>
          </div>
        </div>
      )}

      {sorted.length === 0 && !isAdding && (
        <div className="cashflow-editor__empty">Nog geen transacties</div>
      )}

      {sorted.length > 0 && (
        <div className="cashflow-editor__list">
          {sorted.map((cf) => (
            <div key={cf.id} className="cashflow-item">
              <span className="cashflow-item__date">{formatDate(cf.date)}</span>
              <span className="cashflow-item__desc">
                {cf.description}
                {cf.recurring && (
                  <span className="cashflow-item__badge">
                    {RECURRING_OPTIONS.find((o) => o.value === cf.recurring!.intervalMonths)?.label ?? 'Terugkerend'}
                  </span>
                )}
              </span>
              <span className={`cashflow-item__amount${cf.amount >= 0 ? ' cashflow-item__amount--deposit' : ' cashflow-item__amount--withdrawal'}`}>
                {cf.amount >= 0 ? '+' : '\u2212'}{formatCurrency(Math.abs(cf.amount))}
              </span>
              <button
                className="btn-icon"
                title="Verwijderen"
                onClick={() => handleRemove(cf.id)}
                aria-label={`Verwijder transactie ${cf.description}`}
              >
                <XMarkIcon aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
