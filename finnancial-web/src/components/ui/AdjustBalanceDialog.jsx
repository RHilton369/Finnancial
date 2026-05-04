import { useState, useEffect } from 'react';
import Modal from './Modal';
import styles from './AdjustBalanceDialog.module.css';

/**
 * Diálogo para ajuste manual de saldo de conta.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {function} props.onConfirm
 * @param {Object} props.account - Dados da conta a ser ajustada
 */
export default function AdjustBalanceDialog({ isOpen, onClose, onConfirm, account }) {
  const [targetBalance, setTargetBalance] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && account) {
      setTargetBalance(account.balance?.toString() || '0');
    }
  }, [isOpen, account]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!account) return;
    
    setLoading(true);
    try {
      await onConfirm(account.id, parseFloat(targetBalance));
      onClose();
    } catch (err) {
      // Erro tratado pelo componente pai
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Ajustar Saldo: ${account?.name}`}
      size="sm"
      footer={
        <>
          <button 
            type="button" 
            onClick={onClose} 
            className={styles.btnSecondary}
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            form="adjust-balance-form"
            className={styles.btnPrimary}
            disabled={loading || !targetBalance}
          >
            {loading ? 'Ajustando...' : 'Confirmar Ajuste'}
          </button>
        </>
      }
    >
      <form id="adjust-balance-form" onSubmit={handleSubmit} className={styles.form}>
        <p className={styles.description}>
          Informe o <strong>saldo real</strong> atual desta conta (conforme aparece no seu banco). 
          O sistema ajustará o saldo inicial para compensar qualquer diferença.
        </p>
        
        <div className={styles.field}>
          <label htmlFor="targetBalance">Saldo Real Atual (R$)</label>
          <input
            id="targetBalance"
            type="number"
            step="0.01"
            value={targetBalance}
            onChange={(e) => setTargetBalance(e.target.value)}
            placeholder="0.00"
            autoFocus
            required
            className={styles.input}
          />
        </div>

        <div className={styles.info}>
          <span>Saldo atual no sistema: <strong>R$ {account?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
        </div>
      </form>
    </Modal>
  );
}
