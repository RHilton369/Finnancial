import { useState, useEffect, useCallback } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { formatCurrency, formatDate } from '../utils/format';
import { getCategoryIcon } from '../utils/categoryColors';
import { maintenanceApi } from '../api/maintenance';
import { CATEGORY_ICONS } from '../utils/categoryColors';
import toast from 'react-hot-toast';
import styles from './Accounts.module.css';
import { RefreshCw, CheckCircle, AlertCircle, Wallet, RotateCw, Trash, Edit3 } from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AdjustBalanceDialog from '../components/ui/AdjustBalanceDialog';

/**
 * Página de Gestão de Contas Financeiras
 * Permite visualizar, recálcular e verificar consistência dos saldos das contas
 * 
 * @component
 */
export default function Accounts() {
  const { data: accounts, loading, refresh } = useAccounts();
  const [recalculating, setRecalculating] = useState(null);
  const [recalculatingAll, setRecalculatingAll] = useState(false);
  const [checkingConsistency, setCheckingConsistency] = useState(false);
  const [consistencyData, setConsistencyData] = useState(null);
  const [showRecalcDialog, setShowRecalcDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  /**
   * Recalcula saldo de uma conta específica
   */
  const handleRecalculateAccount = useCallback(async (accountId) => {
    setRecalculating(accountId);
    try {
      const response = await maintenanceApi.recalculateAccount(accountId);
      if (response.data?.success) {
        const { novoSaldo, saldoAnterior, ajuste } = response.data;
        toast.success(
          <div>
            <strong>Recálculo concluído!</strong><br />
            Saldo anterior: {formatCurrency(saldoAnterior)}<br/>
            Novo saldo: {formatCurrency(novoSaldo)}<br/>
            {ajuste !== 0 && (
              <span style={{ color: ajuste > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                Ajuste: {formatCurrency(ajuste)}
              </span>
            )}
          </div>,
          { duration: 5000 }
        );
        refresh();
      }
    } catch (err) {
      toast.error('Erro ao recalcular conta: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setRecalculating(null);
    }
  }, [refresh]);

  /**
   * Recalcula todas as contas
   */
  const handleRecalculateAll = useCallback(async () => {
    setRecalculatingAll(true);
    try {
      const response = await maintenanceApi.recalculateAll();
      if (response.data?.success) {
        toast.success(
          `Recálculo de ${response.data.totalAccounts || 'todas'} conta(s) concluído!`,
          { duration: 4000 }
        );
        refresh();
        setConsistencyData(null);
      }
    } catch (err) {
      toast.error('Erro ao recalcular: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setRecalculatingAll(false);
      setShowRecalcDialog(false);
    }
  }, [refresh]);

  /**
   * Ajusta o saldo manual de uma conta
   */
  const handleAdjustBalance = useCallback(async (accountId, targetBalance) => {
    try {
      const response = await maintenanceApi.adjustBalance(accountId, targetBalance);
      if (response.data) {
        toast.success(`Saldo ajustado para ${formatCurrency(targetBalance)}`);
        refresh();
      }
    } catch (err) {
      toast.error('Erro ao ajustar saldo: ' + (err.message || 'Erro desconhecido'));
      throw err;
    }
  }, [refresh]);

  /**
   * Verifica consistência dos saldos
   */
  const handleCheckConsistency = useCallback(async () => {
    setCheckingConsistency(true);
    try {
      const response = await maintenanceApi.checkConsistency();
      if (response.data?.success) {
        setConsistencyData(response.data);
        if (response.data.dadosConsistentes) {
          toast.success('✓ Todos os saldos estão consistentes!', { duration: 3000 });
        } else {
          toast.warning(
            `${response.data.inconsistencias.length} conta(s) com inconsistência`,
            { duration: 5000 }
          );
        }
      }
    } catch (err) {
      toast.error('Erro ao verificar: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setCheckingConsistency(false);
    }
  }, []);

  const openRecalcDialog = (account) => {
    setSelectedAccount(account);
    setShowRecalcDialog(true);
  };

  const openAdjustDialog = (account) => {
    setSelectedAccount(account);
    setShowAdjustDialog(true);
  };

  const renderConsistencyBadge = (account) => {
    if (!consistencyData || consistencyData.dadosConsistentes) {
      return null;
    }
    const issue = consistencyData.inconsistencias.find(i => i.accountId === account.id);
    if (!issue) return null;
    
    return (
        <div className={styles.consistencyBadgeWarning}
             title={`Diferença: ${formatCurrency(issue.diferenca)}`}>
          <AlertCircle size={14} />
          <span>{formatCurrency(Math.abs(issue.diferenca))}</span>
        </div>
    );
  };

  return (
    <div className={styles.accountsPage}>
      {/* Cabeçalho */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gestão de Contas</h1>
          <p className={styles.subtitle}>
            Visualize e mantenha seus saldos atualizados e precisos
          </p>
        </div>
        <div className={styles.headerActions}>
            <button 
              className={`${styles.btn} ${styles.btnSecondary}`}
              onClick={handleCheckConsistency}
              disabled={checkingConsistency || loading}
            >
              <AlertCircle size={16} />
              {checkingConsistency ? 'Verificando...' : 'Verificar Consistência'}
            </button>
          <button 
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => setShowRecalcDialog(true)}
            disabled={recalculatingAll || loading}
          >
            {recalculatingAll ? (
              <><RefreshCw size={16} className={styles.spin} /> Recalculando...</>
            ) : (
              <><RefreshCw size={16} /> Recalcular Todas</>
            )}
          </button>
        </div>
      </div>

      {/* Status de Consistência */}
      {consistencyData && (
        <div className={`${styles.consistencyCard} ${consistencyData.dadosConsistentes ? styles.consistent : styles.inconsistent}`}>
          <div className={styles.consistencyIcon}>
            {consistencyData.dadosConsistentes ? (
              <CheckCircle size={24} color="var(--color-success)" />
            ) : (
              <AlertCircle size={24} color="var(--color-warning)" />
            )}
          </div>
          <div className={styles.consistencyInfo}>
            <h3>{consistencyData.dadosConsistentes ? '✓ Dados Consistentes' : '⚠ Inconsistências Detectadas'}</h3>
            <p>Contas verificadas: {consistencyData.contasVerificadas}</p>
            {!consistencyData.dadosConsistentes && (
              <p className={styles.consistencyWarning}>
                {consistencyData.inconsistencias.length} conta(s) precisa(m) de recálculo
              </p>
            )}
          </div>
          <button 
            className={styles.consistencyClose}
            onClick={() => setConsistencyData(null)}
          >×</button>
        </div>
      )}

      {/* Grade de Contas */}
      <div className={styles.grid}>
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonLine} style={{ width: '60%' }} />
              <div className={styles.skeletonLine} style={{ width: '80%' }} />
              <div className={styles.skeletonLine} style={{ width: '40%' }} />
            </div>
          ))
        ) : !accounts?.length ? (
          <div className={styles.emptyState}>
            <Wallet size={48} color="var(--color-text-tertiary)" />
            <h3>Nenhuma conta cadastrada</h3>
            <p>Crie sua primeira conta para começar</p>
          </div>
        ) : (
          accounts.filter(a => a.is_active !== 0).map(account => {
            const Icon = getCategoryIcon(account.icon || 'wallet');
            return (
              <div key={account.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.accountIcon} style={{ background: account.color + '20', color: account.color }}>
                    <Icon size={24} />
                  </div>
                  <div className={styles.headerRight}>
                    <span className={styles.accountType}>{account.type}</span>
                    <div className={styles.consistencyWrapper}>
                      {renderConsistencyBadge(account)}
                    </div>
                  </div>
                </div>
                
                <h3 className={styles.accountName}>{account.name}</h3>
                
                <div className={styles.balanceSection}>
                  <span className={styles.balanceLabel}>Saldo Atual</span>
                  <span className={`${styles.balanceValue} ${account.balance < 0 ? styles.negativeBalance : account.balance > 0 ? styles.positiveBalance : ''}`}>
                    {formatCurrency(account.balance || 0)}
                  </span>
                </div>
                
                <div className={styles.balanceSection}>
                  <span className={styles.balanceLabel}>Saldo Inicial</span>
                  <span className={styles.initialBalance}>{formatCurrency(account.initial_balance || 0)}</span>
                </div>
                
                {account.updated_at && (
                  <div className={styles.lastUpdate}>
                    Atualizado em {formatDate(account.updated_at)}
                  </div>
                )}
                
                <div className={styles.cardActions}>
                  <button 
                    className={`${styles.actionBtn} ${styles.recalcBtn}`}
                    onClick={() => handleRecalculateAccount(account.id)}
                    disabled={recalculating === account.id}
                    title="Recalcular saldo baseado no histórico"
                  >
                      {recalculating === account.id ? (
                      <><RefreshCw size={16} className={styles.spin} /> Calculando...</>
                    ) : (
                      <><RotateCw size={16} /> Recalcular</>
                    )}
                  </button>
                  <button 
                    className={`${styles.actionBtn} ${styles.adjustBtn}`}
                    onClick={() => openAdjustDialog(account)}
                    title="Corrigir saldo atual manualmente"
                  >
                    <Edit3 size={16} /> Ajustar Saldo
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Confirmação de Recálculo Total */}
      <ConfirmDialog
        isOpen={showRecalcDialog}
        onClose={() => setShowRecalcDialog(false)}
        onConfirm={handleRecalculateAll}
        title="Recalcular todas as contas"
        message={`
Tem certeza que deseja recalcular o saldo de TODAS as contas?

Esta ação verificará todas as transações históricas e recalculará os saldos baseando-se no saldo inicial mais o somatório de todas as movimentações (receitas, despesas e transferências).

Use esta função se notar discrepâncias entre os saldos exibidos e as transações registradas.
        `}
        confirmLabel="Sim, recalcular tudo"
        cancelLabel="Cancelar"
      />

      {/* Modal de Ajuste Manual de Saldo */}
      <AdjustBalanceDialog
        isOpen={showAdjustDialog}
        onClose={() => setShowAdjustDialog(false)}
        onConfirm={handleAdjustBalance}
        account={selectedAccount}
      />
    </div>
  );
}