import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from '../Modal';
import './ExportModal.css';

interface ExportModalProps {
  resultCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ExportModal({ resultCount, onConfirm, onCancel }: ExportModalProps) {
  return (
    <Modal
      titleId="export-modal-title"
      title="Gegevens exporteren"
      onClose={onCancel}
      onConfirm={onConfirm}
      confirmLabel="Exporteren"
    >
      <p className="export-modal__count">
        <strong>{resultCount}</strong> {resultCount === 1 ? 'rekening' : 'rekeningen'} worden geëxporteerd.
      </p>
      <p className="export-modal__warning">
        <ExclamationTriangleIcon className="export-modal__warning-icon" aria-hidden="true" />
        Het exportbestand bevat al je rekeninggegevens. Bewaar het op een veilige plek en deel het niet onbedoeld. Verwijder het bestand wanneer je het niet meer nodig hebt.
      </p>
      <p className="export-modal__hint">
        Let op: je downloads-map kan automatisch synchroniseren met cloud-diensten zoals iCloud, Google Drive of OneDrive.
      </p>
    </Modal>
  );
}
