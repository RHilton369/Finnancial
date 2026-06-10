import { useState, useEffect } from 'react';
import { categoriesApi } from '../api/categories';
import { accountsApi } from '../api/accounts';
import { maintenanceApi } from '../api/maintenance';
import { useCategories } from '../hooks/useCategories';
import { useAccounts } from '../hooks/useAccounts';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { getCategoryIcon } from '../utils/categoryColors';
import { Plus, X, Pencil, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/format';
import styles from './Settings.module.css';

export default function Settings() {
  const [section, setSection] = useState('profile');
  const links = [
    { key: 'profile', label: 'Perfil' },
    { key: 'accounts', label: 'Contas' },
    { key: 'categories', label: 'Categorias' },
    { key: 'data', label: 'Dados' },
  ];

  return (
    <div className={styles.container}>
      <nav className={styles.tabs}>
        {links.map(l => (
          <button
            key={l.key}
            className={`${styles.tabLink} ${section === l.key ? styles.tabActive : ''}`}
            onClick={() => setSection(l.key)}
          >
            {l.label}
          </button>
        ))}
      </nav>

      <div className={styles.section}>
        {section === 'profile' && <ProfileSection />}
        {section === 'accounts' && <AccountsSection />}
        {section === 'categories' && <CategoriesSection />}
        {section === 'data' && <DataSection />}
      </div>
    </div>
  );
}

function ProfileSection() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [monthlyIncome, setMonthlyIncome] = useState(user?.monthly_income?.toString() || '0');
  const [geminiApiKey, setGeminiApiKey] = useState(user?.gemini_api_key || '');
  const [loading, setLoading] = useState(false);

  // Sincroniza o estado local quando o usuário no contexto muda (ex: após login ou atualização)
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setMonthlyIncome(user.monthly_income?.toString() || '0');
      setGeminiApiKey(user.gemini_api_key || '');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Limpa caracteres não numéricos exceto ponto e vírgula, e converte para float
      const rawValue = monthlyIncome.toString().replace(',', '.');
      const cleanIncome = parseFloat(rawValue) || 0;

      const { data } = await authApi.updateProfile({
        name: name.trim(),
        monthly_income: cleanIncome,
        gemini_api_key: geminiApiKey
      });
      updateUser(data);
      toast.success('Perfil atualizado com sucesso');
      setIsEditing(false);
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Erro desconhecido';
      const errDetails = JSON.stringify(error.response?.data?.details || []);
      alert(`Erro ao atualizar perfil: ${errMsg} \nDetalhes: ${errDetails}`);
      toast.error('Erro ao atualizar perfil: ' + errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.profileSection}>
      <div className={styles.sectionHeader}>
        <h3>Perfil</h3>
        {!isEditing && (
          <button className={styles.addBtn} onClick={() => setIsEditing(true)}>
            <Pencil size={14} /> Editar
          </button>
        )}
      </div>

      <form onSubmit={handleSave} className={styles.form}>
        <div className={styles.formGroup}>
          <label>Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!isEditing}
            className={!isEditing ? styles.inputReadonly : styles.input}
          />
        </div>
        <div className={styles.formGroup}>
          <label>Email</label>
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            className={styles.inputReadonly}
            title="O email não pode ser alterado"
          />
        </div>
        <div className={styles.formGroup}>
          <label>Renda mensal</label>
          {!isEditing ? (
            <div className={styles.inputReadonly}>
              {formatCurrency(user?.monthly_income || 0)}
            </div>
          ) : (
            <input
              type="number"
              step="0.01"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              className={styles.input}
              autoFocus
            />
          )}
        </div>
        <div className={styles.formGroup}>
          <label>Chave da API do Google Gemini (IA)</label>
          {!isEditing ? (
            <input
              type="password"
              value={geminiApiKey ? '••••••••••••••••••••••••' : ''}
              placeholder={geminiApiKey ? '' : 'Não configurada (Modo Offline)'}
              readOnly
              className={styles.inputReadonly}
            />
          ) : (
            <input
              type="text"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className={styles.input}
              placeholder="Cole sua API Key do Gemini aqui (AIzaSy...)"
            />
          )}
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px', lineHeight: '1.4' }}>
            Usada para ativar o Assistente IA online do ZenTriq. Você pode gerar uma chave gratuita no Google AI Studio.
          </span>
        </div>

        {isEditing && (
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => {
                setIsEditing(false);
                setName(user?.name || '');
                setMonthlyIncome(user?.monthly_income?.toString() || '0');
                setGeminiApiKey(user?.gemini_api_key || '');
              }}
              disabled={loading}
            >
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              <Save size={16} /> {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        )}
      </form>
      {!isEditing && <p className={styles.hint}>O email é fixo por segurança. Configure a chave do Gemini para liberar a inteligência avançada no chat.</p>}
    </div>
  );
}

function AccountsSection() {
  const { data: accounts, loading, refresh } = useAccounts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState(null);

  const totalBalance = accounts?.filter(a => a.is_active || a.is_active === undefined)
    .reduce((acc, a) => acc + (a.balance || 0), 0) || 0;

  useEffect(() => {
    if (!modalOpen) {
      refresh();
    }
  }, [modalOpen]);

  const handleDelete = async () => {
    try {
      await accountsApi.remove(accountToDelete);
      toast.success('Conta removida');
      refresh();
    } catch {
      toast.error('Erro ao remover conta');
    }
    setConfirmOpen(false);
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h3>Minhas contas</h3>
        
        <div className={styles.totalBalanceBadge}>
          Saldo Total: <strong>{formatCurrency(totalBalance)}</strong>
        </div>

        <button className={styles.addBtn} onClick={() => { setEditAccount(null); setModalOpen(true); }}>
          <Plus size={14} /> Adicionar
        </button>
      </div>
      {loading ? <p>Carregando...</p> : (
        <div className={styles.accountList}>
          {accounts?.filter(a => a.is_active || a.is_active === undefined).map(a => {
            const Icon = getCategoryIcon(a.icon || 'wallet');
            return (
              <div key={a.id} className={styles.accountItem}>
                <div className={styles.accountIcon} style={{ background: a.color }}>
                  <Icon size={20} color="white" />
                </div>
                <div className={styles.accountInfo}>
                  <span className={styles.accountName}>{a.name}</span>
                  <span className={styles.accountMeta}>{a.type}</span>
                </div>
                <div className={styles.accountBalance}>
                  {formatCurrency(a.balance)}
                </div>
                <div className={styles.accountActions}>
                  <button 
                    className={styles.actionBtn} 
                    onClick={() => { setEditAccount(a); setModalOpen(true); }}
                    title="Editar conta"
                  >
                    <Pencil size={14} />
                  </button>
                  <button 
                    className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                    onClick={() => { setAccountToDelete(a.id); setConfirmOpen(true); }}
                    title="Remover conta"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <AccountFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditAccount(null); }}
        account={editAccount}
        onSuccess={() => { 
          setModalOpen(false); 
          setEditAccount(null); 
          refresh(); 
        }}
      />
      <ConfirmDialog 
        isOpen={confirmOpen} 
        onClose={() => setConfirmOpen(false)} 
        onConfirm={handleDelete} 
        title="Remover conta" 
        message="Tem certeza que deseja remover esta conta? Transações associadas podem ser afetadas." 
      />
    </div>
  );
}

function AccountFormModal({ isOpen, onClose, account, onSuccess }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('checking');
  const [balance, setBalance] = useState('0');
  const [color, setColor] = useState('#378ADD');
  const [creditLimit, setCreditLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(account?.name || '');
      setType(account?.type || 'checking');
      setBalance(account?.balance?.toString() || '0');
      setColor(account?.color || '#378ADD');
      setCreditLimit(account?.credit_limit?.toString() || '');
      setClosingDay(account?.closing_day?.toString() || '');
      setDueDay(account?.due_day?.toString() || '');
    }
  }, [isOpen, account]);

  const ACCOUNT_TYPES = [
    { key: 'checking', label: 'Corrente' },
    { key: 'savings', label: 'Poupança' },
    { key: 'cash', label: 'Dinheiro' },
    { key: 'credit', label: 'Crédito' },
    { key: 'investment', label: 'Investimento' },
  ];

  const COLORS = ['#378ADD', '#1D9E75', '#D85A30', '#7F77DD', '#EF9F27', '#E24B4A', '#D4537E', '#639922'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Informe o nome'); return; }
    if (type === 'credit') {
      if (!creditLimit || !closingDay || !dueDay) { toast.error('Preencha os campos do cartão'); return; }
    }
    
    setLoading(true);
    const accountData = { 
      name: name.trim(), 
      type, 
      balance: parseFloat(balance), 
      color,
      credit_limit: type === 'credit' ? parseFloat(creditLimit) : null,
      closing_day: type === 'credit' ? parseInt(closingDay) : null,
      due_day: type === 'credit' ? parseInt(dueDay) : null
    };

    try {
      if (account?.id) {
        await accountsApi.update(account.id, accountData);
        toast.success('Conta atualizada');
      } else {
        await accountsApi.create(accountData);
        toast.success('Conta criada');
      }
      onSuccess();
    } catch { toast.error('Erro ao salvar'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={account?.id ? 'Editar conta' : 'Nova conta'} size="sm">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Nome da conta</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Nubank, Itaú..." className={styles.input} />
        </div>
        <div className={styles.field}>
          <label>Tipo</label>
          <div className={styles.typeSelector}>
            {ACCOUNT_TYPES.map(t => (
              <button key={t.key} type="button"
                className={`${styles.typeBtn} ${type === t.key ? styles.typeBtnActive : ''}`}
                onClick={() => setType(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        
        {type === 'credit' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
              <label>Limite Total</label>
              <input type="number" step="0.01" value={creditLimit} onChange={e => setCreditLimit(e.target.value)} className={styles.input} placeholder="Ex: 5000" />
            </div>
            <div className={styles.field}>
              <label>Fechamento</label>
              <input type="number" min="1" max="31" value={closingDay} onChange={e => setClosingDay(e.target.value)} className={styles.input} placeholder="Dia 25" />
            </div>
            <div className={styles.field}>
              <label>Vencimento</label>
              <input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} className={styles.input} placeholder="Dia 5" />
            </div>
          </div>
        )}

        <div className={styles.field}>
          <label>{account?.id ? 'Saldo inicial (Base)' : 'Saldo inicial'}</label>
          <input type="number" step="0.01" value={balance} onChange={e => setBalance(e.target.value)} className={styles.input} />
          {type === 'credit' && (
            <p className={styles.hint} style={{marginTop: 4, color: 'var(--color-warning)'}}>
              ⚠️ <strong>Atenção:</strong> Dívidas no cartão (o que você já deve) devem ser inseridas como <strong>negativas</strong> (ex: -1500). Valores positivos significam crédito a mais na operadora.
            </p>
          )}
          {account?.id && <p className={styles.hint} style={{marginTop: 4}}>Alterar o saldo inicial recalculará o saldo atual com base no histórico.</p>}
        </div>
        <div className={styles.field}>
          <label>Cor</label>
          <div className={styles.colorPicker}>
            {COLORS.map(c => (
              <button key={c} type="button"
                className={`${styles.colorDot} ${color === c ? styles.colorDotActive : ''}`}
                style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Salvando...' : (account?.id ? 'Atualizar' : 'Criar conta')}
        </button>
      </form>
    </Modal>
  );
}

function CategoriesSection() {
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const { data, loading, refresh } = useCategories(filter === 'all' ? null : filter);

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h3>Categorias</h3>
        <div className={styles.catActions}>
          <div className={styles.catFilter}>
            <button className={`${styles.filterBtn} ${filter === 'all' ? styles.filterActive : ''}`} onClick={() => setFilter('all')}>Todas</button>
            <button className={`${styles.filterBtn} ${filter === 'expense' ? styles.filterActive : ''}`} onClick={() => setFilter('expense')}>Despesas</button>
            <button className={`${styles.filterBtn} ${filter === 'income' ? styles.filterActive : ''}`} onClick={() => setFilter('income')}>Receitas</button>
          </div>
          <button className={styles.addBtn} onClick={() => { setEditCat(null); setModalOpen(true); }}>
            <Plus size={14} /> Adicionar
          </button>
        </div>
      </div>
      {loading ? <p>Carregando...</p> : (
        <div className={styles.catList}>
          {data?.map(c => {
            const Icon = getCategoryIcon(c.icon || 'tag');
            return (
              <div key={c.id} className={styles.catItem}
                style={{ opacity: c.is_default ? 1 : 1 }}
                onDoubleClick={() => { if (!c.is_default) { setEditCat(c); setModalOpen(true); } }}>
                <div className={styles.catDot} style={{ background: c.color }}>
                  <Icon size={14} color="white" />
                </div>
                <span>{c.name}</span>
                <span className={styles.catType}>{c.type === 'income' ? 'Receita' : 'Despesa'}</span>
                {c.is_default
                  ? <span className={styles.lockBadge} title="Padrão (não pode remover)">🔒</span>
                  : <DeleteCatButton id={c.id} onRefresh={refresh} />}
              </div>
            );
          })}
        </div>
      )}
      <CategoryFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditCat(null); }}
        category={editCat}
        filter={filter}
        onSuccess={() => { setModalOpen(false); setEditCat(null); refresh(); }}
      />
    </div>
  );
}

function DeleteCatButton({ id, onRefresh }) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await categoriesApi.remove(id);
      toast.success('Categoria removida');
      if (onRefresh) onRefresh();
    } catch (err) {
      if (err.response?.data?.code === 'CATEGORY_HAS_TRANSACTIONS') toast.error('Categoria possui transações');
      else toast.error('Erro ao remover');
    }
    setConfirmOpen(false);
  };

  return (
    <>
      <button className={styles.deleteCatBtn} onClick={() => setConfirmOpen(true)}>
        <X size={14} />
      </button>
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Remover categoria" message="Tem certeza que deseja remover esta categoria?" />
    </>
  );
}

function CategoryFormModal({ isOpen, onClose, category, filter, onSuccess }) {
  const [name, setName] = useState(category?.name || '');
  const [type, setType] = useState(category?.type || (filter === 'income' ? 'income' : filter === 'expense' ? 'expense' : 'expense'));
  const [color, setColor] = useState(category?.color || '#888780');
  const [icon, setIcon] = useState(category?.icon || 'tag');
  const [loading, setLoading] = useState(false);

  const ICON_OPTIONS = ['tag', 'home', 'utensils', 'car', 'heart', 'smile', 'book', 'shirt', 'repeat', 'trending-up', 'briefcase', 'plus-circle', 'wallet', 'target', 'star', 'image'];

  const COLORS = ['#1D9E75', '#378ADD', '#EF9F27', '#E24B4A', '#7F77DD', '#D4537E', '#D85A30', '#639922', '#BA7517', '#888780'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Informe o nome'); return; }
    setLoading(true);
    try {
      if (category?.id) {
        await categoriesApi.update(category.id, { name: name.trim(), type, color, icon });
        toast.success('Categoria atualizada');
      } else {
        await categoriesApi.create({ name: name.trim(), type, color, icon });
        toast.success('Categoria criada');
      }
      onSuccess();
    } catch { toast.error('Erro ao salvar'); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={category?.id ? 'Editar categoria' : 'Nova categoria'} size="sm">
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Nome</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Farmácia" className={styles.input} />
        </div>
        <div className={styles.field}>
          <label>Tipo</label>
          <div className={styles.typeSelector}>
            <button type="button"
              className={`${styles.typeBtn} ${type === 'expense' ? styles.typeBtnActive : ''}`}
              onClick={() => setType('expense')}
              style={type === 'expense' ? { background: 'var(--color-danger)', color: 'white', borderColor: 'var(--color-danger)' } : {}}>
              Despesa
            </button>
            <button type="button"
              className={`${styles.typeBtn} ${type === 'income' ? styles.typeBtnActive : ''}`}
              onClick={() => setType('income')}
              style={type === 'income' ? { background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' } : {}}>
              Receita
            </button>
          </div>
        </div>
        <div className={styles.field}>
          <label>Cor</label>
          <div className={styles.colorPicker}>
            {COLORS.map(c => (
              <button key={c} type="button"
                className={`${styles.colorDot} ${color === c ? styles.colorDotActive : ''}`}
                style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>
        <div className={styles.field}>
          <label>Ícone</label>
          <div className={styles.iconPicker}>
            {ICON_OPTIONS.map(ic => {
              const Ico = getCategoryIcon(ic);
              return (
                <button key={ic} type="button"
                  className={`${styles.iconDot} ${icon === ic ? styles.iconDotActive : ''}`}
                  onClick={() => setIcon(ic)}>
                  <Ico size={18} color={color} />
                </button>
              );
            })}
          </div>
        </div>
        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? 'Salvando...' : (category?.id ? 'Atualizar' : 'Criar categoria')}
        </button>
      </form>
    </Modal>
  );
}

function DataSection() {
  const handleExport = async () => {
    try {
      const { default: api } = await import('../api/axios');
      const { data } = await api.get('/transactions', { params: { limit: 1000 } });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'zentriq_export.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Dados exportados');
    } catch {
      toast.error('Erro ao exportar');
    }
  };

  return (
    <div>
      <h3>Dados</h3>
      <div className={styles.dataCard}>
        <h4>Exportar transações</h4>
        <p className={styles.dataDesc}>Exporta todas as transações no formato JSON.</p>
        <button className={styles.exportBtn} onClick={handleExport}>
          Baixar JSON
        </button>
      </div>
      <div className={styles.dataCard}>
        <h4>Integridade do Sistema</h4>
        <p className={styles.dataDesc}>Recalcula o saldo de todas as contas baseando-se no histórico de transações. Use se notar divergências.</p>
        <button 
          className={styles.exportBtn} 
          onClick={async () => {
            try {
              toast.loading('Recalculando...');
              await maintenanceApi.recalculateBalances();
              toast.dismiss();
              toast.success('Saldos recalculados com sucesso!');
            } catch {
              toast.dismiss();
              toast.error('Erro ao recalcular saldos');
            }
          }}
          style={{ background: 'var(--color-warning)', color: 'var(--bg-card)' }}
        >
          Recalcular Saldos
        </button>
      </div>
      <div className={styles.dataCard}>
        <h4>Sobre o app</h4>
        <p className={styles.dataDesc}>ZenTriq v2.1.0 — Backend: Node.js + Prisma + MongoDB, Frontend: React + Vite</p>
      </div>
    </div>
  );
}
