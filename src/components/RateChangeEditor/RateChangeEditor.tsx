import { useState } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { RateChange } from '../../models/RateChange';
import { formatDate } from '../../utils/format';
import './RateChangeEditor.css';

interface RateChangeEditorProps {
  rateChanges: RateChange[];
  onUpdate: (rateChanges: RateChange[]) => void;
}

export default function RateChangeEditor({ rateChanges, onUpdate }: RateChangeEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [date, setDate] = useState('');
  const [rate, setRate] = useState('');

  function resetForm() {
    setDate('');
    setRate('');
  }

  function handleAdd() {
    const parsedRate = parseFloat(rate.replace(',', '.'));
    if (!date || isNaN(parsedRate) || parsedRate < 0) return;

    const newRateChange: RateChange = {
      id: crypto.randomUUID(),
      date,
      annualInterestRate: parsedRate,
    };

    onUpdate([...rateChanges, newRateChange].sort((a, b) => a.date.localeCompare(b.date)));
    resetForm();
    setIsAdding(false);
  }

  function handleRemove(id: string) {
    onUpdate(rateChanges.filter((rc) => rc.id !== id));
  }

  const sorted = [...rateChanges].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="rate-change-editor">
      <div className="rate-change-editor__header">
        <h3>Rentewijzigingen</h3>
        <button
          className={`rate-change-editor__add-btn${isAdding ? ' rate-change-editor__add-btn--active' : ''}`}
          onClick={() => { setIsAdding(!isAdding); if (isAdding) resetForm(); }}
        >
          {isAdding ? 'Annuleren' : <><PlusIcon aria-hidden="true" /> Toevoegen</>}
        </button>
      </div>

      {isAdding && (
        <div className="rate-change-editor__form">
          <div className="rate-change-editor__fields">
            <div>
              <label className="form-label" htmlFor="rc-date">Ingangsdatum</label>
              <input
                id="rc-date"
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label" htmlFor="rc-rate">Nieuw rentepercentage</label>
              <div className="form-input-suffix">
                <input
                  id="rc-rate"
                  type="text"
                  inputMode="decimal"
                  className="form-input"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="3,5"
                />
                <span className="suffix">%</span>
              </div>
            </div>
          </div>

          <div className="rate-change-editor__actions">
            <button
              type="button"
              className="rate-change-editor__submit"
              onClick={handleAdd}
            >
              Toevoegen
            </button>
          </div>
        </div>
      )}

      {sorted.length === 0 && !isAdding && (
        <div className="rate-change-editor__empty">Nog geen rentewijzigingen</div>
      )}

      {sorted.length > 0 && (
        <div className="rate-change-editor__list">
          {sorted.map((rc) => (
            <div key={rc.id} className="rate-change-item">
              <span className="rate-change-item__date">{formatDate(rc.date)}</span>
              <span className="rate-change-item__rate">{rc.annualInterestRate.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}%</span>
              <button
                className="btn-icon"
                title="Verwijderen"
                onClick={() => handleRemove(rc.id)}
                aria-label={`Verwijder rentewijziging ${formatDate(rc.date)}`}
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
