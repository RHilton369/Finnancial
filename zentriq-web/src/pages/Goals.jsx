import { useState } from 'react';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';
import { useGoals } from '../hooks/useGoals';
import { goalsApi } from '../api/goals';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { formatCurrency } from '../utils/format';
import { getCategoryIcon } from '../utils/categoryColors';
import toast from 'react-hot-toast';
import styles from './Goals.module.css';

const COLORS = ['#1D9E75', '#378ADD', '#EF9F27', '#E24B4A', '#7F77DD', '#D4537E', '#D85A30', '#639922'];
const ICONS = ['target', 'Home', 'Car', 'Plane', 'BookOpen', 'Heart', 'Star', 'Image'];
const ICON_MAP = { target: 'target', Home: 'home', Car: 'car', Plane: 'Plane', BookOpen: 'book', Heart: 'heart', Star: 'star', Image: 'image' };

export default function Goals() {
  const { data: rawGoals, loading, refetch } = useGoals();

  const [modalOpen, setModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [depositGoal, setDepositGoal] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const activeGoals = rawGoals?.filter(g => !g.is_completed) || [];
  const completedGoals = rawGoals?.filter(g => g.is_completed) || [];

  const handleDelete = async () => {
    try {
      await goalsApi.remove(deleteId);
      toast.success('Meta removida');
      refetch();
    } catch { toast.error('Erro ao remover'); }
    setConfirmOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Metas financeiras</h2>
        <button className={styles.addButton} onClick={() => { setEditGoal(null); setModalOpen(true); }}>
          <Plus size={18} /> Nova meta
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando metas...</div>
      ) : activeGoals.length > 0 ? (
        <div className={styles.goalsGrid}>
          {activeGoals.map(g => (
            <GoalCard
              key={g.id}
              goal={g}
              onDeposit={() => { setDepositGoal(g); setDepositOpen(true); }}
              onEdit={() => { setEditGoal(g); setModalOpen(true); }}
              onDelete={() => { setDeleteId(g.id); setConfirmOpen(true); }}
            />
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <p>Nenhuma meta criada ainda</p>
          <button className={styles.addButton} onClick={() => setModalOpen(true)}>
            <Plus size={18} /> Criar primeira meta
          </button>
        </div>
      )}

      {completedGoals.length > 0 && (
        <details className={styles.completedSection}>
          <summary className={styles.completedSummary} onClick={(e) => { e.preventDefault(); setShowCompleted(!showCompleted); }}>
            Concluídas ({completedGoals.length})
          </summary>
          {showCompleted && (
            <div className={styles.goalsGrid}>
              {completedGoals.map(g => (
                <GoalCard key={g.id} goal={g} onEdit={() => { setEditGoal(g); setModalOpen(true); }} disabled />
              ))}
            </div>
          )}
        </details>
      )}

      <GoalFormModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditGoal(null); }} goal={editGoal} onSuccess={() => { refetch(); setModalOpen(false); setEditGoal(null); }} />

      <DepositModal isOpen={depositOpen} onClose={() => setDepositOpen(false)} goal={depositGoal} onSuccess={() => { refetch(); setDepositOpen(false); setDepositGoal(null); }} />

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Remover meta" message="Tem certeza que deseja remover esta meta?" />
    </div>
  );
}

function GoalCard({ goal, onDeposit, onEdit, onDelete, disabled }) {
  const Icon = getCategoryIcon(goal.icon || 'target');
  const progress = goal.progress_pct || 0;

  return (
    <div className={styles.goalCard}>
      <div className={styles.goalHeader} style={{ background: goal.color || '#1D9E75' }}>
        <Icon size={24} color="white" />
        <span className={styles.goalName}>{goal.name}</span>
        {!!goal.is_completed && <span className={styles.completedBadge}>Atingida!</span>}
      </div>
      <div className={styles.goalBody}>
        <div className={styles.goalProgressBar}>
          <div className={styles.goalProgressFill} style={{ width: `${progress}%`, background: goal.color || '#1D9E75' }} />
        </div>
        <div className={styles.goalStats}>
          <span className={styles.goalAmount}>
            {formatCurrency(goal.current_amount)} de {formatCurrency(goal.target_amount)}
          </span>
          <span className={styles.goalPct}>{progress}%</span>
        </div>
        {goal.monthly_needed > 0 && !goal.is_completed && (
          <p className={styles.monthlyNeeded}>Poupar {formatCurrency(goal.monthly_needed)}/mês para atingir no prazo</p>
        )}
        {goal.days_remaining !== null && goal.days_remaining > 0 && !goal.is_completed && (
          <p className={styles.remaining}>{goal.days_remaining} dias restantes</p>
        )}
        {goal.deadline && goal.days_remaining !== null && goal.days_remaining <= 0 && !goal.is_completed && (
          <span className={styles.overdueBadge}>Atrasada</span>
        )}
        {!disabled && !goal.is_completed && (
          <div className={styles.goalActions}>
            <button className={styles.depositBtn} onClick={onDeposit}>Depositar</button>
            <button className={styles.editSmallBtn} onClick={onEdit} title="Editar meta">
              <Pencil size={14} />
            </button>
            <button className={styles.deleteSmallBtn} onClick={onDelete} title="Excluir meta">
              <Trash2 size={14} />
            </button>
          </div>
        )}
        {!!goal.is_completed && (
          <p className={styles.completedDate}>Concluída em {goal.completed_at}</p>
        )}
      </div>
    </div>
  );
}

function GoalFormModal({ isOpen, onClose, goal, onSuccess }) {
  const [name, setName] = useState(goal?.name || '');
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount?.toString() || '');
  const [currentAmount, setCurrentAmount] = useState(goal?.current_amount?.toString() || '0');
  const [deadline, setDeadline] = useState(goal?.deadline || '');
  const [color, setColor] = useState(goal?.color || COLORS[0]);
  const [icon, setIcon] = useState(goal?.icon || 'target');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Informe o nome'); return; }
    if (!targetAmount || parseFloat(targetAmount) <= 0) { toast.error('Informe o valor alvo'); return; }

    setLoading(true);
    try {
      const body = { name: name.trim(), target_amount: parseFloat(targetAmount), current_amount: parseFloat(currentAmount) || 0 };
      if (deadline) body.deadline = deadline;
      body.color = color;
      body.icon = icon;

      if (goal?.id) {
        await goalsApi.update(goal.id, body);
        toast.success('Meta atualizada');
      } else {
        await goalsApi.create(body);
        toast.success('Meta criada');
      }
      onSuccess();
    } catch { toast.error('Erro ao salvar'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={goal?.id ? 'Editar meta' : 'Nova meta'} size="md">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Nome da meta</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Viagem, Carro..." className={styles.input} />
        </div>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Valor alvo</label>
            <input type="number" step="0.01" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="Ex: 10000" className={styles.input} />
          </div>
          <div className={styles.field}>
            <label>Já salvo (opcional)</label>
            <input type="number" step="0.01" value={currentAmount} onChange={e => setCurrentAmount(e.target.value)} placeholder="0" className={styles.input} />
          </div>
        </div>
        <div className={styles.field}>
          <label>Prazo (opcional)</label>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className={styles.input} />
        </div>

        {/* Color picker */}
        <div className={styles.field}>
          <label>Cor</label>
          <div className={styles.colorPicker}>
            {COLORS.map(c => (
              <button key={c} type="button" className={`${styles.colorDot} ${color === c ? styles.colorDotActive : ''}`}
                style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>

        {/* Icon picker */}
        <div className={styles.field}>
          <label>Ícone</label>
          <div className={styles.iconPicker}>
            {ICONS.concat(["repeat", "wallet", "briefcase", "plus-circle"]).map(ic => {
              const Ico = getCategoryIcon(ic);
              return (
                <button key={ic} type="button"
                  className={`${styles.iconDot} ${icon === ic ? styles.iconDotActive : ''}`}
                  onClick={() => setIcon(ic)}>
                  <Ico size={20} color={color} />
                </button>
              );
            })}
          </div>
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Salvando...' : (goal?.id ? 'Atualizar' : 'Criar meta')}</button>
      </form>
    </Modal>
  );
}

function DepositModal({ isOpen, onClose, goal, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const current = goal?.current_amount || 0;
  const target = goal?.target_amount || 0;
  const newAmount = current + parseFloat(amount || 0);
  const newPct = target > 0 ? Math.min(newAmount / target * 100, 100) : 0;
  const willComplete = newAmount >= target && amount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) { toast.error('Informe um valor'); return; }
    setLoading(true);
    try {
      await goalsApi.deposit(goal.id, { amount: parseFloat(amount) });
      if (willComplete) toast.success('Parabéns, meta atingida!');
      else toast.success('Depósito realizado');
      onSuccess();
    } catch { toast.error('Erro ao depositar'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Depositar na meta" size="sm">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.depositPreview}>
          <span className={styles.depositAmount}>{formatCurrency(current)}</span>
          {amount && <span className={styles.to}>→ {formatCurrency(newAmount)}</span>}
          <span className={styles.depositPct}>{newPct.toFixed(1)}%</span>
        </div>
        {willComplete && <p className={styles.celebration}>Este depósito completa sua meta!</p>}
        <div className={styles.field}>
          <label>Valor do depósito</label>
          <input type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)}
            placeholder="Ex: 100" className={styles.input} />
        </div>
        <button type="submit" className={styles.submitBtn} disabled={loading}>{loading ? 'Depositando...' : 'Depositar'}</button>
      </form>
    </Modal>
  );
}
