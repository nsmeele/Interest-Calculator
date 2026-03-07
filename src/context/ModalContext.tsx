import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { ImportPreview, ImportMode } from '../hooks/useDataTransfer';
import type { BankAccount } from '../models/BankAccount';
import ImportModal from '../components/ImportModal';
import ExportModal from '../components/ExportModal';
import AccountFormModal from '../components/AccountFormModal';
import Modal from '../components/Modal';

type ModalState =
  | { type: 'import'; preview: ImportPreview; onConfirm: (mode: ImportMode) => void; onCancel?: () => void }
  | { type: 'export'; resultCount: number; onConfirm: () => void }
  | { type: 'account'; editingResult: BankAccount | null; onResult: (result: BankAccount) => void }
  | { type: 'confirm'; title: string; message: string; confirmLabel: string; onConfirm: () => void }
  | null;

interface ModalContextValue {
  openModal: (modal: NonNullable<ModalState>) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>(null);

  const openModal = useCallback((m: NonNullable<ModalState>) => setModal(m), []);
  const closeModal = useCallback(() => setModal(null), []);

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      {modal?.type === 'import' && (
        <ImportModal
          preview={modal.preview}
          onConfirm={(mode) => {
            modal.onConfirm(mode);
            closeModal();
          }}
          onCancel={() => {
            modal.onCancel?.();
            closeModal();
          }}
        />
      )}
      {modal?.type === 'export' && (
        <ExportModal
          resultCount={modal.resultCount}
          onConfirm={() => {
            modal.onConfirm();
            closeModal();
          }}
          onCancel={closeModal}
        />
      )}
      {modal?.type === 'account' && (
        <AccountFormModal
          editingResult={modal.editingResult}
          onResult={(result) => {
            modal.onResult(result);
            closeModal();
          }}
          onClose={closeModal}
        />
      )}
      {modal?.type === 'confirm' && (
        <Modal
          titleId="confirm-modal-title"
          title={modal.title}
          confirmLabel={modal.confirmLabel}
          onConfirm={() => {
            modal.onConfirm();
            closeModal();
          }}
          onClose={closeModal}
        >
          <p>{modal.message}</p>
        </Modal>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}
