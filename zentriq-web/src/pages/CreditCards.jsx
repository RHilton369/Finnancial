import { useState, useEffect } from 'react';
import { useAccounts } from '../hooks/useAccounts';
import { accountsApi } from '../api/accounts';
import { formatCurrency, formatDate } from '../utils/format';
import { CreditCard, Wallet, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';
import styles from './CreditCards.module.css';
import { TransactionFormModal } from '../components/transactions/TransactionFormModal';
import Modal from '../components/ui/Modal';
import { getCategoryIcon } from '../utils/categoryColors';

export default function CreditCards() {
  const { data: accounts, loading: accountsLoading } = useAccounts();
  const [invoices, setInvoices] = useState({});
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  
  // Modals state
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [extratoModalOpen, setExtratoModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  const creditCards = accounts?.filter(a => a.type === 'credit' && a.is_active) || [];

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    const newInvoices = {};
    for (const card of creditCards) {
      try {
        const { data } = await accountsApi.getInvoice(card.id);
        newInvoices[card.id] = data;
      } catch (err) {
        console.error('Erro ao buscar fatura do cartão', card.id, err);
      }
    }
    setInvoices(newInvoices);
    setLoadingInvoices(false);
  };

  useEffect(() => {
    if (creditCards.length > 0) {
      fetchInvoices();
    } else {
      setLoadingInvoices(false);
    }
  }, [accounts]);

  const handlePayInvoice = (card) => {
    setSelectedCard(card);
    setPayModalOpen(true);
  };

  const handleViewExtrato = (card) => {
    setSelectedCard(card);
    setExtratoModalOpen(true);
  };

  if (accountsLoading) return <div className={styles.container}>Carregando...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Meus Cartões</h1>
        <p className={styles.subtitle}>Gerencie seus limites e faturas atuais</p>
      </div>

      <div className={styles.grid}>
        {creditCards.length === 0 ? (
          <div className={styles.emptyState}>
            <CreditCard size={48} color="var(--text-tertiary)" />
            <h3>Nenhum cartão cadastrado</h3>
            <p>Acesse as Configurações para adicionar uma Conta do tipo "Crédito"</p>
          </div>
        ) : (
          creditCards.map(card => {
            const invoice = invoices[card.id];
            const isLoading = loadingInvoices && !invoice;
            const creditLimit = card.credit_limit || 0;
            const invoiceTotal = invoice?.invoiceTotal || 0;
            const availableLimit = creditLimit - invoiceTotal;
            const limitPercentage = creditLimit > 0 ? (invoiceTotal / creditLimit) * 100 : 0;
            const isDanger = limitPercentage > 90;
            const isWarning = limitPercentage > 75 && !isDanger;

            return (
              <div key={card.id} className={styles.cardWrapper}>
                {/* Visual Representation */}
                <div className={styles.physicalCard} style={{ backgroundColor: card.color || '#378ADD' }}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardName}>{card.name}</span>
                    <CreditCard size={24} opacity={0.8} />
                  </div>
                  <div className={styles.chip}></div>
                  <div className={styles.cardFooter}>
                    <div className={styles.cardNumber}>**** **** **** 0000</div>
                    <div className={styles.cardDates}>
                      <div>
                        <span>Fechamento</span>
                        <strong>{card.closing_day || '--'}</strong>
                      </div>
                      <div>
                        <span>Vencimento</span>
                        <strong>{card.due_day || '--'}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoice Stats */}
                <div className={styles.invoiceInfo}>
                  <div className={styles.invoiceHeader}>
                    <span className={styles.invoiceLabel}>Fatura Atual</span>
                    {isLoading ? (
                      <span className={styles.invoiceAmount}>Carregando...</span>
                    ) : (
                      <span className={styles.invoiceAmount}>{formatCurrency(invoiceTotal)}</span>
                    )}
                  </div>
                  
                  <div className={styles.limitBarContainer}>
                    <div 
                      className={`${styles.limitBarFill} ${isDanger ? styles.danger : isWarning ? styles.warning : ''}`}
                      style={{ width: `${Math.min(limitPercentage, 100)}%` }}
                    />
                  </div>
                  
                  <div className={styles.limitDetails}>
                    <span>Disponível: <strong>{formatCurrency(availableLimit)}</strong></span>
                    <span>Limite: {formatCurrency(creditLimit)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.cardActions}>
                  <button 
                    className={`${styles.btn} ${styles.btnSecondary}`} 
                    onClick={() => handleViewExtrato(card)}
                    disabled={isLoading}
                  >
                    Ver Extrato
                  </button>
                  <button 
                    className={`${styles.btn} ${styles.btnPrimary}`} 
                    onClick={() => handlePayInvoice(card)}
                    disabled={isLoading}
                  >
                    <Wallet size={16} /> Pagar Fatura
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Extrato Modal */}
      {extratoModalOpen && selectedCard && invoices[selectedCard.id] && (
        <ExtratoModal 
          isOpen={extratoModalOpen}
          onClose={() => setExtratoModalOpen(false)}
          card={selectedCard}
          invoice={invoices[selectedCard.id]}
        />
      )}

      {/* Pay Invoice Modal */}
      {payModalOpen && selectedCard && invoices[selectedCard.id] && (
        <TransactionFormModal
          isOpen={payModalOpen}
          onClose={() => setPayModalOpen(false)}
          tx={{
            type: 'transfer',
            to_account_id: selectedCard.id,
            amount: invoices[selectedCard.id].invoiceTotal,
            description: `Pagamento Fatura ${selectedCard.name}`,
          }}
          onSuccess={() => {
            setPayModalOpen(false);
            fetchInvoices();
          }}
        />
      )}

    </div>
  );
}

function ExtratoModal({ isOpen, onClose, card, invoice }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Fatura Atual - ${card.name}`} size="md">
      <div style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <p style={{ color: 'var(--text-tertiary)', fontSize: 14 }}>
          Período: {formatDate(invoice.period.start)} até {formatDate(invoice.period.end)}
        </p>
        <h2 style={{ fontSize: 24, marginTop: 8 }}>{formatCurrency(invoice.invoiceTotal)}</h2>
      </div>

      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {invoice.transactions.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 32 }}>Nenhuma transação nesta fatura.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {invoice.transactions.map(tx => {
              const Icon = getCategoryIcon(tx.categories?.icon || 'tag');
              const isExpense = tx.type === 'expense';
              
              return (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${tx.categories?.color || '#888'}20`, color: tx.categories?.color || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={20} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{tx.description}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{formatDate(tx.date)}</div>
                  </div>
                  <div style={{ fontWeight: 600, color: isExpense ? 'var(--text-main)' : 'var(--color-success)' }}>
                    {isExpense ? '' : '+'} {formatCurrency(tx.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
