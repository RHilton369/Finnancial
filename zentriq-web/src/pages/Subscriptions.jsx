import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, Repeat, Activity } from 'lucide-react';
import { recurringApi } from '../api/recurring';
import { accountsApi } from '../api/accounts';
import { categoriesApi } from '../api/categories';
import { formatCurrency } from '../utils/format';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import styles from './Subscriptions.module.css';

const FREQUENCIES = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'yearly', label: 'Anual' }
];

export default function Subscriptions() {
  const [recurrences, setRecurrences] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense',
    account_id: '',
    category_id: '',
    frequency: 'monthly',
    start_date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [recRes, accRes, catRes] = await Promise.all([
        recurringApi.list(),
        accountsApi.list(),
        categoriesApi.list()
      ]);
      setRecurrences(recRes.data);
      setAccounts(accRes.data.filter(a => a.is_active));
      setCategories(catRes.data);
    } catch (err) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        description: item.description,
        amount: item.amount.toString(),
        type: item.type,
        account_id: item.account_id,
        category_id: item.category_id || '',
        frequency: item.frequency,
        start_date: item.start_date.split('T')[0]
      });
    } else {
      setEditingId(null);
      setFormData({
        description: '',
        amount: '',
        type: 'expense',
        account_id: accounts[0]?.id || '',
        category_id: '',
        frequency: 'monthly',
        start_date: format(new Date(), 'yyyy-MM-dd')
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (editingId) {
        await recurringApi.update(editingId, payload);
        toast.success('Assinatura atualizada!');
      } else {
        await recurringApi.create(payload);
        toast.success('Assinatura criada!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Erro ao salvar assinatura');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta assinatura?')) return;
    try {
      await recurringApi.remove(id);
      toast.success('Assinatura removida');
      fetchData();
    } catch (err) {
      toast.error('Erro ao remover');
    }
  };

  const totalMonthly = recurrences
    .filter(r => r.type === 'expense' && r.frequency === 'monthly')
    .reduce((acc, curr) => acc + curr.amount, 0);

  if (loading) return <div style={{ padding: 20 }}>Carregando...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Assinaturas e Despesas Fixas</h1>
          <p className={styles.subtitle}>Gerencie seus pagamentos recorrentes</p>
        </div>
        <Button onClick={() => handleOpenModal()} icon={<Plus size={18} />}>Nova Assinatura</Button>
      </div>

      <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'inline-block' }}>
        <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '4px' }}>Custo Fixo Mensal Estimado</div>
        <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--color-danger)' }}>
          {formatCurrency(totalMonthly)}
        </div>
      </div>

      {recurrences.length === 0 ? (
        <div className={styles.emptyState}>
          <Activity size={48} color="var(--text-tertiary)" />
          <h3>Nenhuma assinatura encontrada</h3>
          <p>Adicione Netflix, Internet, Aluguel para automatizar seus lançamentos.</p>
          <Button onClick={() => handleOpenModal()}>Criar Primeira Assinatura</Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {recurrences.map(item => {
            const isExpense = item.type === 'expense';
            return (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardIcon} style={{ background: isExpense ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    <Repeat size={20} />
                  </div>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} onClick={() => handleOpenModal(item)}><Edit2 size={16} /></button>
                    <button className={`${styles.actionBtn} ${styles.delete}`} onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
                
                <div>
                  <div className={styles.cardTitle}>{item.description}</div>
                  <div className={styles.cardAmount} style={{ color: isExpense ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {formatCurrency(item.amount)}
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={14} />
                    Próx: {format(parseISO(item.next_due_date), "dd 'de' MMM", { locale: ptBR })}
                  </div>
                  <span className={styles.badge}>
                    {FREQUENCIES.find(f => f.value === item.frequency)?.label || item.frequency}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Editar Assinatura' : 'Nova Assinatura'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input 
            label="Descrição (ex: Netflix)" 
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            required
          />
          <div className={styles.formGrid}>
            <Input 
              label="Valor" 
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
              required
            />
            <Select 
              label="Frequência"
              options={FREQUENCIES}
              value={formData.frequency}
              onChange={v => setFormData({...formData, frequency: v})}
            />
          </div>
          <div className={styles.formGrid}>
            <Select 
              label="Conta de Pagamento"
              options={accounts.map(a => ({ value: a.id, label: a.name }))}
              value={formData.account_id}
              onChange={v => setFormData({...formData, account_id: v})}
              required
            />
            <Select 
              label="Categoria"
              options={categories.filter(c => c.type === formData.type).map(c => ({ value: c.id, label: c.name }))}
              value={formData.category_id}
              onChange={v => setFormData({...formData, category_id: v})}
            />
          </div>
          <div className={styles.formGrid}>
            <Select 
              label="Tipo"
              options={[{ value: 'expense', label: 'Despesa' }, { value: 'income', label: 'Receita' }]}
              value={formData.type}
              onChange={v => setFormData({...formData, type: v, category_id: ''})}
            />
            <Input 
              label="Data de Início" 
              type="date"
              value={formData.start_date}
              onChange={e => setFormData({...formData, start_date: e.target.value})}
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
