import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import type { MaturityEvent } from '../../utils/collectMaturities';
import { useReinvestment } from '../../context/useReinvestment';
import { useAccountStore } from '../../context/useAccountStore';
import { useLocale } from '../../context/useLocale';
import { useModal } from '../../context/useModal';
import { formatCurrency, formatDate, formatAccountLabel, parseAmountInput, formatAmountInput } from '../../utils/format';
import type { Currency } from '../../enums/Currency';
import './ReinvestmentDetail.css';

interface ReinvestmentDetailProps {
  events: MaturityEvent[];
}

interface AllocationFormState {
  targetAccountId: string;
  amount: string;
  errors: Record<string, string>;
}

const INITIAL_FORM: AllocationFormState = {
  targetAccountId: '',
  amount: '',
  errors: {},
};

export default function ReinvestmentDetail({ events }: ReinvestmentDetailProps) {
  const { t } = useTranslation();
  const { currency } = useLocale();
  const { results, addResult } = useAccountStore();
  const { addAllocation, removeAllocation, editAllocation, getAllocationsForEvent, getRemainingAmount } = useReinvestment();
  const { openModal } = useModal();

  const [activeEventIndex, setActiveEventIndex] = useState<number | null>(null);
  const [form, setForm] = useState<AllocationFormState>(INITIAL_FORM);
  const [showForm, setShowForm] = useState(false);
  const [editingAllocationId, setEditingAllocationId] = useState<string | null>(null);

  function handleShowForm(eventIndex: number) {
    setActiveEventIndex(eventIndex);
    const event = events[eventIndex];
    const remaining = getRemainingAmount(event);
    setForm({
      ...INITIAL_FORM,
      amount: formatAmountInput(remaining, currency as Currency),
    });
    setShowForm(true);
  }

  function handleEditAllocation(allocationId: string, eventIndex: number) {
    const alloc = getAllocationsForEvent(events[eventIndex].accountId, events[eventIndex].date)
      .find((a) => a.id === allocationId);
    if (!alloc) return;
    setActiveEventIndex(eventIndex);
    setEditingAllocationId(allocationId);
    setForm({
      targetAccountId: alloc.targetAccountId,
      amount: formatAmountInput(alloc.amount, currency as Currency),
      errors: {},
    });
    setShowForm(true);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingAllocationId(null);
    setForm(INITIAL_FORM);
  }

  function handleSubmit(event: MaturityEvent) {
    const errors: Record<string, string> = {};

    if (!form.targetAccountId) {
      errors.targetAccountId = t('reinvest.errorSelectAccount');
    }

    if (form.targetAccountId === event.accountId) {
      errors.targetAccountId = t('reinvest.errorSameAccount');
    }

    const amount = parseAmountInput(form.amount, currency as Currency);
    if (!amount || amount <= 0) {
      errors.amount = t('reinvest.errorAmountRequired');
    }

    // When editing, the current allocation's amount is still available
    const remaining = getRemainingAmount(event);
    const editingAlloc = editingAllocationId
      ? getAllocationsForEvent(event.accountId, event.date).find((a) => a.id === editingAllocationId)
      : null;
    const available = remaining + (editingAlloc?.amount ?? 0);
    if (amount > available + 0.01) {
      errors.amount = t('reinvest.errorAmountExceeds');
    }

    if (Object.keys(errors).length > 0) {
      setForm((prev) => ({ ...prev, errors }));
      return;
    }

    if (editingAllocationId) {
      editAllocation(editingAllocationId, form.targetAccountId, amount);
    } else {
      addAllocation({
        sourceAccountId: event.accountId,
        sourceDate: event.date,
        sourceType: event.type,
        amount,
        targetAccountId: form.targetAccountId,
      });
    }

    setShowForm(false);
    setEditingAllocationId(null);
    setForm(INITIAL_FORM);
  }

  function handleNewAccount(event: MaturityEvent) {
    const remaining = getRemainingAmount(event);
    openModal({
      type: 'account',
      editingResult: null,
      onResult: (newAccount) => {
        addResult(newAccount);
        addAllocation({
          sourceAccountId: event.accountId,
          sourceDate: event.date,
          sourceType: event.type,
          amount: remaining,
          targetAccountId: newAccount.id,
        });
        setShowForm(false);
        setForm(INITIAL_FORM);
      },
    });
  }

  // Filter target accounts: exclude source, only active accounts that allow cashflows
  const getTargetAccounts = (event: MaturityEvent) =>
    results.filter((r) => r.id !== event.accountId && r.hasCashFlows && !r.hasExpired);

  return (
    <div className="reinvest-detail" role="tabpanel">
      {events.map((event, idx) => {
        const sourceAccount = results.find((r) => r.id === event.accountId);
        const cur = (sourceAccount?.currency ?? currency) as string;
        const eventAllocations = getAllocationsForEvent(event.accountId, event.date)
          .filter((a) => a.sourceType === event.type);
        const remaining = getRemainingAmount(event);
        const allocatedTotal = event.amount - remaining;
        const progress = event.amount > 0 ? (allocatedTotal / event.amount) * 100 : 0;
        const isFullyAllocated = remaining <= 0;

        return (
          <div key={`${event.accountId}-${event.date}-${event.type}`} className="reinvest-detail__event">
            <div className="reinvest-detail__event-header">
              <div className="reinvest-detail__event-info">
                <span className={`reinvest-detail__type-badge reinvest-detail__type-badge--${event.type}`}>
                  {t(`reinvest.${event.type}`)}
                </span>
                <span className="reinvest-detail__event-date">{formatDate(event.date)}</span>
              </div>
              <span className="reinvest-detail__event-amount">{formatCurrency(event.amount, cur)}</span>
            </div>

            {sourceAccount && (
              <div className="reinvest-detail__source">
                <span className="reinvest-detail__source-label">{t('reinvest.source')}:</span>
                <span className="reinvest-detail__source-account">
                  {formatAccountLabel(sourceAccount.effectiveBalance, sourceAccount.currentRate, cur)}
                </span>
              </div>
            )}

            {/* Progress bar */}
            <div className="reinvest-detail__progress">
              <div className="reinvest-detail__progress-bar">
                <div
                  className={`reinvest-detail__progress-fill${isFullyAllocated ? ' reinvest-detail__progress-fill--complete' : ''}`}
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <div className="reinvest-detail__progress-labels">
                <span>{t('reinvest.allocated')}: {formatCurrency(allocatedTotal, cur)}</span>
                <span>{t('reinvest.remaining')}: {formatCurrency(remaining, cur)}</span>
              </div>
            </div>

            {/* Existing allocations */}
            {eventAllocations.length > 0 && (
              <div className="reinvest-detail__allocations">
                <h4>{t('reinvest.allocations')}</h4>
                <ul className="reinvest-detail__allocation-list">
                  {eventAllocations.map((alloc) => {
                    const target = results.find((r) => r.id === alloc.targetAccountId);
                    const targetCur = (target?.currency ?? currency) as string;
                    return (
                      <li key={alloc.id} className="reinvest-detail__allocation-item">
                        <span className="reinvest-detail__allocation-target">
                          {target
                            ? formatAccountLabel(target.effectiveBalance, target.currentRate, targetCur)
                            : alloc.targetAccountId}
                        </span>
                        <span className="reinvest-detail__allocation-amount">
                          {formatCurrency(alloc.amount, cur)}
                        </span>
                        <button
                          className="btn-icon btn-icon--edit"
                          onClick={() => handleEditAllocation(alloc.id, idx)}
                          aria-label={t('reinvest.editAllocation')}
                        >
                          <PencilIcon aria-hidden="true" />
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => { removeAllocation(alloc.id); handleCancelForm(); }}
                          aria-label={t('reinvest.deleteAllocation')}
                        >
                          <TrashIcon aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Allocation form (add or edit) */}
            {showForm && activeEventIndex === idx ? (() => {
              const editingAlloc = editingAllocationId
                ? eventAllocations.find((a) => a.id === editingAllocationId)
                : null;
              const formAvailable = remaining + (editingAlloc?.amount ?? 0);
              return (
                <div className="reinvest-detail__form">
                  <div className="form-group">
                    <label className="form-label" htmlFor={`target-${idx}`}>
                      {t('reinvest.targetAccount')}
                    </label>
                    <select
                      id={`target-${idx}`}
                      className={`form-input${form.errors.targetAccountId ? ' form-input--error' : ''}`}
                      value={form.targetAccountId}
                      onChange={(e) => setForm((prev) => ({
                        ...prev,
                        targetAccountId: e.target.value,
                        errors: { ...prev.errors, targetAccountId: '' },
                      }))}
                    >
                      <option value="">{t('reinvest.selectAccount')}</option>
                      {getTargetAccounts(event).map((r) => {
                        const rCur = (r.currency ?? currency) as string;
                        return (
                          <option key={r.id} value={r.id}>
                            {formatAccountLabel(r.effectiveBalance, r.currentRate, rCur)}
                          </option>
                        );
                      })}
                    </select>
                    {form.errors.targetAccountId && (
                      <span className="form-error">{form.errors.targetAccountId}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor={`amount-${idx}`}>
                      {t('reinvest.allocationAmount')}
                    </label>
                    <div className="form-input-prefix">
                      <span className="prefix" aria-hidden="true">&euro;</span>
                      <input
                        id={`amount-${idx}`}
                        type="text"
                        inputMode="decimal"
                        className={`form-input${form.errors.amount ? ' form-input--error' : ''}`}
                        value={form.amount}
                        onChange={(e) => setForm((prev) => ({
                          ...prev,
                          amount: e.target.value,
                          errors: { ...prev.errors, amount: '' },
                        }))}
                      />
                    </div>
                    <span className="form-hint">
                      {t('reinvest.maxAvailable', { amount: formatCurrency(formAvailable, cur) })}
                    </span>
                    {form.errors.amount && (
                      <span className="form-error">{form.errors.amount}</span>
                    )}
                  </div>

                  <div className="reinvest-detail__form-actions">
                    <button className="btn-action" onClick={() => handleSubmit(event)}>
                      {t('reinvest.save')}
                    </button>
                    {!editingAllocationId && (
                      <button className="btn-action btn-action--muted" onClick={() => handleNewAccount(event)}>
                        {t('reinvest.newAccount')}
                      </button>
                    )}
                    <button className="btn-action btn-action--muted" onClick={handleCancelForm}>
                      {t('reinvest.cancel')}
                    </button>
                  </div>
                </div>
              );
            })() : (
              <>
                {!isFullyAllocated && (
                  <button
                    className="btn-action btn-action--muted reinvest-detail__allocate-btn"
                    onClick={() => handleShowForm(idx)}
                  >
                    {t('reinvest.addAllocation')}
                  </button>
                )}
                {isFullyAllocated && eventAllocations.length === 0 && (
                  <p className="reinvest-detail__no-allocations">{t('reinvest.noAllocations')}</p>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
