import { useState } from 'react';
import type { ImportPreview, ImportMode } from '../../hooks/useDataTransfer';
import Modal from '../Modal';
import './ImportModal.css';

interface ImportModalProps {
  preview: ImportPreview;
  onConfirm: (mode: ImportMode) => void;
  onCancel: () => void;
}

export default function ImportModal({ preview, onConfirm, onCancel }: ImportModalProps) {
  const [mode, setMode] = useState<ImportMode>('replace');

  return (
    <Modal
      titleId="import-modal-title"
      title="Gegevens importeren"
      onClose={onCancel}
      onConfirm={() => onConfirm(mode)}
      confirmLabel="Importeren"
    >
      <div className="import-preview">
        <div className="import-preview__stat">
          <span className="import-preview__stat-value">{preview.resultCount}</span>
          <span className="import-preview__stat-label">
            {preview.resultCount === 1 ? 'rekening' : 'rekeningen'}
          </span>
        </div>
        {preview.portfolioIdCount > 0 && (
          <div className="import-preview__stat">
            <span className="import-preview__stat-value">{preview.portfolioIdCount}</span>
            <span className="import-preview__stat-label">
              {preview.portfolioIdCount === 1 ? 'portefeuille-item' : 'portefeuille-items'}
            </span>
          </div>
        )}
      </div>

      <fieldset className="import-mode">
        <legend className="import-mode__legend">Wat wil je doen?</legend>
        <label className={`import-mode__option${mode === 'replace' ? ' import-mode__option--active' : ''}`}>
          <input
            type="radio"
            name="import-mode"
            value="replace"
            checked={mode === 'replace'}
            onChange={() => setMode('replace')}
          />
          <div>
            <span className="import-mode__option-title">Vervangen</span>
            <span className="import-mode__option-desc">Bestaande gegevens worden gewist en vervangen door de import.</span>
          </div>
        </label>
        <label className={`import-mode__option${mode === 'merge' ? ' import-mode__option--active' : ''}`}>
          <input
            type="radio"
            name="import-mode"
            value="merge"
            checked={mode === 'merge'}
            onChange={() => setMode('merge')}
          />
          <div>
            <span className="import-mode__option-title">Samenvoegen</span>
            <span className="import-mode__option-desc">Nieuwe rekeningen worden toegevoegd aan je bestaande gegevens.</span>
          </div>
        </label>
      </fieldset>
    </Modal>
  );
}
