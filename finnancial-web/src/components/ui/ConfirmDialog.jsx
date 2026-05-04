import Modal from './Modal';

export default function ConfirmDialog({ isOpen, onClose, onConfirm, message, title = 'Confirma' }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <button onClick={onClose} style={{ padding: '8px 16px', color: 'var(--text-secondary)' }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            padding: '8px 16px', background: 'var(--color-danger)',
            color: 'white', borderRadius: 'var(--border-radius-sm)'
          }}>Confirmar</button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
}
