import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useBudgets } from '../hooks/useBudgets';
import { useCategories } from '../hooks/useCategories';
import { budgetsApi } from '../api/budgets';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatCurrency, formatMonthYear } from '../utils/format';
import { getCategoryIcon } from '../utils/categoryColors';
import { getCategoryColor } from '../utils/categoryColors';
import toast from 'react-hot-toast';
import styles from './Budgets.module.css';

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const now = new Date();

export default function Budgets() {
  const [month, setMonth] = useState(() => parseInt(localStorage.getItem('selectedMonth')) || now.getMonth() + 1);
  const [year, setYear] = useState(() => parseInt(localStorage.getItem('selectedYear')) || now.getFullYear());

  const { data: budgets, loading, refetch } = useBudgets(month, year);
  const { data: categories } = useCategories('expense');

  const [modalOpen, setModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Track which categories have budgets
  const budgetCategoryIds = new Set(budgets?.map(b => b.category_id) || []);
  const withoutBudget = categories?.filter(c => !budgetCategoryIds.has(c.id)) || [];

  useEffect(() => {
    const handler = (e) => {
      if (e.detail) { setMonth(e.detail.month); setYear(e.detail.year); }
    };
    window.addEventListener('monthChange', handler);
    return () => window.removeEventListener('monthChange', handler);
  }, []);

  const handleDelete = async () => {
    try {
      await budgetsApi.remove(deleteId);
      toast.success('Orçamento removido');
      refetch();
    } catch {
      toast.error('Erro ao remover');
    }
    setConfirmOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.periodTitle}>{formatMonthYear(month, year)}</h2>
        <button className={styles.addButton} onClick={() => { setEditBudget(null); setModalOpen(true); }}>
          <Plus size={18} /> Definir orçamento
        </button>
      </div>

      {/* Summary */}
      {budgets && budgets.length > 0 && (
        <div className={styles.summaryBar}>
          <span>{budgets.length} de {categories?.filter(c => c.type === 'expense').length} categorias com orçamento</span>
          <span>
            Total planejado: <strong>{formatCurrency(budgets.reduce((s, b) => s + b.amount_limit, 0))}</strong>
          </span>
        </div>
      )}

      {/* Budget cards */}
      {loading ? (
        <div className={styles.loading}>Carregando orçamentos...</div>
      ) : budgets && budgets.length > 0 ? (
        <div className={styles.budgetGrid}>
          {budgets.map(b => (
            <BudgetCard
              key={b.id}
              budget={b}
              onEdit={() => { setEditBudget(b); setModalOpen(true); }}
              onDelete={() => { setDeleteId(b.id); setConfirmOpen(true); }}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <p>Nenhum orçamento definido para este mês</p>
          <button className={styles.addButton} onClick={() => setModalOpen(true)}>
            <Plus size={18} /> Criar primeiro orçamento
          </button>
        </div>
      )}

      {/* Without budget */}
      {withoutBudget.length > 0 && (
        <div className={styles.withoutBudget}>
          <h3 className={styles.sectionTitle}>Sem orçamento (ordem por gasto)</h3>
          <div className={styles.noBudgetList}>
            {withoutBudget
              .sort((a, b) => (b.spent || 0) - (a.spent || 0))
              .map(cat => (
                <div key={cat.id} className={styles.noBudgetItem}>
                  {(() => { const Icon = getCategoryIcon(cat.icon || 'tag'); return <Icon size={18} color={cat.color} />; })()}
                  <span>{cat.name}</span>
                  <button
                    className={styles.defineBtn}
                    onClick={() => { setEditBudget({ category_id: cat.id }); setModalOpen(true); }}
                  >
                    Definir limite
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Budget form modal */}
      <BudgetFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditBudget(null); }}
        budget={editBudget}
        month={month}
        year={year}
        categories={withoutBudget}
        onSuccess={() => { refetch(); setModalOpen(false); setEditBudget(null); }}
      />

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Remover orçamento" message="Tem certeza que deseja remover este orçamento?" />
    </div>
  );
}

function BudgetCard({ budget, onEdit, onDelete }) {
  const Icon = getCategoryIcon(budget.icon || 'tag');
  const usedPct = Math.min(budget.used_pct || 0, 100);
  const status = usedPct >= 100 ? styles.danger : usedPct >= 70 ? styles.warning : styles.ok;
  const barColor = usedPct >= 100 ? 'var(--color-danger)' : usedPct >= 70 ? 'var(--color-warning)' : 'var(--color-success)';

  return (
    <div className={styles.budgetCard}>
      <button className={styles.closeBtn} onClick={onDelete}><X size={14} /></button>
      <div className={styles.cardHeader}>
        <div className={styles.cardIcon} style={{ background: budget.color }}>
          <Icon size={20} color="white" />
        </div>
        <div className={styles.cardInfo}>
          <span className={styles.cardName}>{budget.name}</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${usedPct}%`, background: barColor }} />
          </div>
        </div>
      </div>
      <div className={styles.cardFooter}>
        <span className={`${styles.statusBadge} ${status}`}>
          {usedPct >= 100 ? 'Estourado' : usedPct >= 70 ? 'Atenção' : 'OK'}
        </span>
        <span className={styles.cardAmount}>
          {formatCurrency(budget.spent || 0)} de {formatCurrency(budget.amount_limit)} · {budget.used_pct}%
        </span>
        <button className={styles.editBtn} onClick={onEdit}>Editar</button>
      </div>
    </div>
  );
}

function BudgetFormModal({ isOpen, onClose, budget, month, year, categories, onSuccess }) {
  const [categoryId, setCategoryId] = useState(budget?.category_id || '');
  const [amount, setAmount] = useState(budget?.amount_limit?.toString() || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCategoryId(budget?.category_id || '');
      setAmount(budget?.amount_limit?.toString() || '');
    }
  }, [isOpen, budget]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId) { toast.error('Selecione uma categoria'); return; }
    if (!amount || parseFloat(amount) <= 0) { toast.error('Informe um valor'); return; }

    setLoading(true);
    try {
      if (budget?.id) {
        await budgetsApi.update(budget.id, { amount_limit: parseFloat(amount) });
        toast.success('Orçamento atualizado');
      } else {
        await budgetsApi.create({ category_id: categoryId, amount_limit: parseFloat(amount), month, year });
        toast.success('Orçamento criado');
      }
      onSuccess();
    } catch (err) {
      if (err.response?.data?.code === 'BUDGET_EXISTS') toast.error('Já existe orçamento para esta categoria');
      else toast.error('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={budget?.id ? 'Editar orçamento' : 'Novo orçamento'} size="sm">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Categoria</label>
          <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={styles.select}
            disabled={!!budget?.id}>
            <option value="">Selecione...</option>
            {categories?.filter(c => c.type === 'expense').map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            {budget?.name && <option value={budget.category_id}>{budget.name}</option>}
          </select>
        </div>
        <div className={styles.field}>
          <label>Limite mensal (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Ex: 500"
            className={styles.input}
          />
        </div>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Salvando...' : (budget?.id ? 'Atualizar' : 'Criar orçamento')}
        </button>
      </form>
    </Modal>
  );
}
