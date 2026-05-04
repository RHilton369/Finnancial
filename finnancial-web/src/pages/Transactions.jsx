import { useState, useEffect } from 'react';
import { Plus, Search, Filter, X } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import { useAccounts } from '../hooks/useAccounts';
import { formatCurrency, formatDate } from '../utils/format';
import { getCategoryIcon } from '../utils/categoryColors';
import { transactionsApi } from '../api/transactions';
import { TransactionFormModal } from '../components/transactions/TransactionFormModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import styles from './Transactions.module.css';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const now = new Date();
const today = now.toISOString().split('T')[0];
const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

/**
 * Página de Listagem de Transações.
 * Permite visualizar, filtrar, pesquisar, editar e excluir transações financeiras.
 * Implementa rolagem infinita/paginação e agrupamento cronológico.
 * 
 * @component
 */
export default function Transactions() {
  const [month, setMonth] = useState(() => parseInt(localStorage.getItem('selectedMonth')) || now.getMonth() + 1);
  const [year, setYear] = useState(() => parseInt(localStorage.getItem('selectedYear')) || now.getFullYear());
  const [type, setType] = useState('all');
  const [categoryId, setCategoryId] = useState(null);
  const [accountId, setAccountId] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [refetchSignal, setRefetchSignal] = useState(0);

  // Hook customizado para busca de dados paginados
  const { data, loading, refetch } = useTransactions(
    { month, year, type, category_id: categoryId, account_id: accountId, search: debouncedSearch, page, limit: 20 },
    refetchSignal
  );
  
  const { data: categories } = useCategories();
  const { data: accounts } = useAccounts();

  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Debounce para otimização da busca textual
  useEffect(() => {
    const timer = setTimeout(() => { 
      setDebouncedSearch(search); 
      setPage(1); 
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset da página ao alterar filtros estruturais
  useEffect(() => { 
    setPage(1); 
  }, [type, categoryId, accountId]);

  // Sincronização de período via evento global
  useEffect(() => {
    const handler = (e) => {
      if (e.detail) { 
        setMonth(e.detail.month); 
        setYear(e.detail.year); 
      }
    };
    window.addEventListener('monthChange', handler);
    return () => window.removeEventListener('monthChange', handler);
  }, []);

  /**
   * Converte uma string de data ISO em um rótulo legível (Hoje, Ontem ou Data formatada).
   * @param {string} ds - Data no formato YYYY-MM-DD.
   * @returns {string}
   */
  function dateLabel(ds) {
    if (ds === today) return 'Hoje';
    if (ds === yesterday) return 'Ontem';
    return formatDate(ds);
  }

  // Lógica de agrupamento de transações por data para exibição em lista
  const groupedData = {};
  if (data?.data) {
    data.data.forEach(tx => {
      if (!groupedData[tx.date]) groupedData[tx.date] = [];
      groupedData[tx.date].push(tx);
    });
  }
  const sortedDates = Object.keys(groupedData).sort((a, b) => b.localeCompare(a));

  /**
   * Executa a exclusão de uma transação após confirmação.
   */
  const handleDelete = async () => {
    try {
      await transactionsApi.remove(deleteId);
      toast.success('Transação excluída');
      setRefetchSignal(n => n + 1);
    } catch {
      toast.error('Erro ao excluir');
    }
    setConfirmOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Cabeçalho de Período */}
      <div className={styles.header}>
        <h2 className={styles.periodTitle}>{MONTHS[month - 1]} {year}</h2>
        <button className={styles.addButton} onClick={() => setModalOpen(true)}>
          <Plus size={18} /> Nova transação
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className={styles.filtersBar}>
        <div className={styles.searchWrap}>
          <Search size={16} />
          <input type="text" placeholder="Buscar..." value={search}
            onChange={e => setSearch(e.target.value)} className={styles.searchInput} />
          {search && <X size={14} onClick={() => setSearch('')} className={styles.clearSearch} />}
        </div>
        <div className={styles.typeToggle}>
          {[
            { val: 'all', label: 'Todos' },
            { val: 'income', label: 'Receitas' },
            { val: 'expense', label: 'Despesas' },
          ].map(t => (
            <button key={t.val}
              className={`${styles.typeBtn} ${type === t.val ? styles.typeBtnActive : ''}`}
              onClick={() => setType(t.val)}>
              {t.label}
            </button>
          ))}
        </div>
        <button className={styles.filterBtn} onClick={() => setShowFilters(!showFilters)}>
          <Filter size={16} />
        </button>
      </div>

      {/* Filtros Expandidos (Categoria/Conta) */}
      {showFilters && (
        <div className={styles.expandedFilters}>
          <select value={categoryId || ''} onChange={e => setCategoryId(e.target.value ? e.target.value : null)}>
            <option value="">Todas categorias</option>
            {categories?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={accountId || ''} onChange={e => setAccountId(e.target.value ? e.target.value : null)}>
            <option value="">Todas contas</option>
            {accounts?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button className={styles.clearFilters} onClick={() => { setCategoryId(null); setAccountId(null); }}>
            Limpar
          </button>
        </div>
      )}

      {/* Resumo Financeiro da Visualização Atual */}
      {data?.summary && (
        <div className={styles.summaryBar}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Receitas</span>
            <span className={`${styles.summaryValue} ${styles.income}`}>{formatCurrency(data.summary.totalIncome)}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Despesas</span>
            <span className={`${styles.summaryValue} ${styles.expense}`}>{formatCurrency(data.summary.totalExpense)}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Saldo</span>
            <span className={`${styles.summaryValue} ${data.summary.balance >= 0 ? styles.income : styles.expense}`}>
              {formatCurrency(data.summary.balance)}
            </span>
          </div>
        </div>
      )}

      {/* Listagem de Transações */}
      {loading ? (
        <div className={styles.loading}>Carregando transações...</div>
      ) : sortedDates.length > 0 ? (
        <div className={styles.txList}>
          {sortedDates.map(date => (
            <div key={date} className={styles.dateGroup}>
              <div className={styles.dateHeader}>
                <span>{dateLabel(date)}</span>
                <span className={styles.dateTotal}>
                  {formatCurrency(groupedData[date]
                    .reduce((s, tx) => s + (tx.type === 'expense' ? -tx.amount : tx.amount), 0))}
                </span>
              </div>
              {groupedData[date].map(tx => {
                const Icon = getCategoryIcon(tx.category_icon || 'tag');
                const isInc = tx.type === 'income';
                return (
                  <div key={tx.id} className={styles.transactionItem}>
                    <div className={styles.txIcon} style={{ background: tx.category_color || '#888780' }}>
                      <Icon size={18} color="white" />
                    </div>
                    <div className={styles.txInfo}>
                      <span className={styles.txDesc}>{tx.description}</span>
                      <span className={styles.txMeta}>
                        {tx.category_name}{tx.account_name && ` · ${tx.account_name}`}
                      </span>
                    </div>
                    <div className={styles.txRight}>
                      <span className={`${styles.txAmount} ${isInc ? styles.incomeText : styles.expenseText}`}>
                        {isInc ? '+' : '-'} {formatCurrency(tx.amount)}
                      </span>
                      <div className={styles.txActions}>
                        <button onClick={() => { setEditTx(tx); setModalOpen(true); }}>Editar</button>
                        <button className={styles.deleteAction} onClick={() => { setDeleteId(tx.id); setConfirmOpen(true); }}>Excluir</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <p>Nenhuma transação encontrada</p>
          <button className={styles.addButton} onClick={() => setModalOpen(true)}>
            <Plus size={18} /> Adicionar transação
          </button>
        </div>
      )}

      {/* Controle de Paginação */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className={styles.pageBtn}>
            Anterior
          </button>
          <span className={styles.pageInfo}>{page} de {data.pagination.totalPages}</span>
          <button disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)} className={styles.pageBtn}>
            Próxima
          </button>
        </div>
      )}

      {/* Modais de Ação */}
      <TransactionFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTx(null); }}
        tx={editTx}
        onSuccess={() => { setRefetchSignal(n => n + 1); setModalOpen(false); setEditTx(null); }}
      />

      <ConfirmDialog 
        isOpen={confirmOpen} 
        onClose={() => setConfirmOpen(false)} 
        onConfirm={handleDelete} 
        title="Excluir transação" 
        message="Tem certeza que deseja excluir esta transação?" 
      />
    </div>
  );
}
