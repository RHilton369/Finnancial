import { useState, useEffect, useRef } from 'react';
import { transactionsApi } from '../../api/transactions';
import { useCategories } from '../../hooks/useCategories';
import { useAccounts } from '../../hooks/useAccounts';
import Modal from '../ui/Modal';
import { getCategoryIcon } from '../../utils/categoryColors';
import toast from 'react-hot-toast';
import styles from './TransactionFormModal.module.css';

const TABS = [
  { val: 'expense', label: 'Despesa' },
  { val: 'income', label: 'Receita' },
  { val: 'transfer', label: 'Transferência' },
];

const CATEGORY_PLACEHOLDERS = {
  'Moradia': 'Ex: Aluguel, Condomínio, IPTU...',
  'Alimentação': 'Ex: Almoço, Mercado, iFood...',
  'Transporte': 'Ex: Gasolina, Uber, Estacionamento...',
  'Saúde': 'Ex: Farmácia, Consulta, Plano de saúde...',
  'Lazer': 'Ex: Filme, Restaurante, Show...',
  'Educação': 'Ex: Curso, Livro, Material escolar...',
  'Outros': 'Descreva o gasto...',
  'Salário': 'Ex: Salário, Férias, 13º...',
  'Renda Extra': 'Ex: Freelance, Venda, Dividendos...',
};

export function TransactionFormModal({ isOpen, onClose, tx, onSuccess }) {
  const [tab, setTab] = useState(tx?.type || 'expense');
  const [amount, setAmount] = useState(tx?.amount?.toString() || '');
  const [description, setDescription] = useState(tx?.description || '');
  const [date, setDate] = useState(tx?.date || new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState(tx?.category_id || null);
  const [accountId, setAccountId] = useState(tx?.account_id || localStorage.getItem('lastAccountId') || '');
  const [toAccountId, setToAccountId] = useState(tx?.to_account_id || '');
  const [notes, setNotes] = useState(tx?.notes || '');
  const [showNotes, setShowNotes] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: categories } = useCategories(tab === 'income' ? 'income' : 'expense');
  const { data: accounts } = useAccounts();
  const amountRef = useRef();

  useEffect(() => {
    if (isOpen && amountRef.current) amountRef.current.focus();
    if (tx) {
      setTab(tx.type);
      setAmount(tx.amount?.toString() || '');
      setDescription(tx.description || '');
      setDate(tx.date || '');
      setCategoryId(tx.category_id || null);
      setAccountId(tx.account_id || '');
      setToAccountId(tx.to_account_id || '');
      setNotes(tx.notes || '');
    }
  }, [isOpen, tx]);

  function formatCurrencyInput(val) {
    // Remove all non-digits
    const digits = val.replace(/\D/g, '');
    if (!digits) return '';
    const cents = parseInt(digits, 10);
    if (cents === 0) return '0,00';
    const formatted = (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return formatted;
  }

  function handleAmountChange(e) {
    setAmount(formatCurrencyInput(e.target.value));
  }

  function getNumericAmount() {
    if (!amount) return 0;
    return parseFloat(amount.replace(/\./g, '').replace(',', '.'));
  }

  function getPlaceholder() {
    if (tab === 'transfer') return 'Transferindo...';
    const cat = categories?.find(c => c.id === categoryId);
    return CATEGORY_PLACEHOLDERS[cat?.name] || 'Descreva esta transação...';
  }

  function getCategoryTheme() {
    if (!categoryId) return {};
    const cat = categories?.find(c => c.id === categoryId);
    return cat ? { color: cat.color, '--cat-color': cat.color } : {};
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const amt = getNumericAmount();
    if (amt <= 0) { toast.error('Informe um valor'); return; }
    if (!description.trim()) { toast.error('Informe uma descrição'); return; }
    if (tab === 'transfer' && !accountId) { toast.error('Selecione uma conta'); return; }
    if (tab !== 'transfer' && !categoryId) { toast.error('Selecione uma categoria'); return; }

    setLoading(true);
    try {
      const body = {
        type: tab,
        amount: amt,
        description: description.trim(),
        date,
        category_id: tab === 'transfer' ? null : categoryId,
        account_id: accountId,
        from_account_id: tab === 'transfer' ? accountId : undefined,
        to_account_id: tab === 'transfer' ? toAccountId : undefined,
        notes: notes || null,
      };

      if (tx?.id) {
        await transactionsApi.update(tx.id, body);
        toast.success('Transação atualizada!');
      } else {
        await transactionsApi.create(body);
        toast.success(`${tab === 'expense' ? 'Despesa' : tab === 'income' ? 'Receita' : 'Transferência'} salva!`);
      }

      localStorage.setItem('lastAccountId', accountId.toString());
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  const isTransfer = tab === 'transfer';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tx?.id ? 'Editar transação' : isTransfer ? 'Nova transferência' : `Nova ${tab === 'expense' ? 'despesa' : 'receita'}`}
      size="lg"
    >
      <div className={styles.container} style={getCategoryTheme()}>
        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button
              key={t.val}
              className={`${styles.tab} ${tab === t.val ? styles.tabActive : ''} ${styles[`${t.val}Tab`]}`}
              onClick={() => { setTab(t.val); setCategoryId(null); }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Amount */}
          <div className={styles.amountWrap}>
            <span className={styles.amountPrefix}>R$</span>
            <input
              ref={amountRef}
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0,00"
              className={styles.amountInput}
            />
          </div>

          {/* Category grid */}
          {!isTransfer && (
            <div className={styles.catGrid}>
              {categories?.map(cat => {
                const Icon = getCategoryIcon(cat.icon || 'tag');
                const selected = categoryId === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    className={`${styles.catItem} ${selected ? styles.catSelected : ''}`}
                    style={selected ? { borderColor: cat.color, background: `${cat.color}12` } : {}}
                    onClick={() => setCategoryId(cat.id)}
                  >
                    <Icon size={24} color={cat.color} />
                    <span className={styles.catName}>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Description */}
          <div className={styles.field}>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={getPlaceholder()}
              className={styles.input}
            />
          </div>

          {/* Account + Date */}
          <div className={styles.row}>
            <div className={styles.field}>
              <label>{isTransfer ? 'De (Origem)' : 'Conta'}</label>
              <select value={accountId} onChange={e => setAccountId(e.target.value)} className={styles.select}>
                <option value="">Selecione...</option>
                {accounts?.filter(a => a.is_active).map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
            {isTransfer && (
              <div className={styles.field}>
                <label>Para (Destino)</label>
                <select value={toAccountId} onChange={e => setToAccountId(e.target.value)} className={styles.select}>
                  <option value="">Selecione...</option>
                  {accounts?.filter(a => a.is_active && a.id !== accountId).map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className={styles.field}>
              <label>Data</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          {/* Notes toggle */}
          {!showNotes ? (
            <button type="button" className={styles.notesToggle} onClick={() => setShowNotes(true)}>
              + Adicionar nota
            </button>
          ) : (
            <div className={styles.field}>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Notas (opcional)"
                className={styles.textarea}
                rows={2}
              />
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className={`${styles.submitBtn} ${isTransfer ? styles.transferBtn : styles[`${tab}Btn`]}`}
            disabled={loading}
          >
            {loading ? 'Salvando...' : (tx?.id ? 'Salvar alterações' : `Salvar ${isTransfer ? 'transferência' : tab === 'expense' ? 'despesa' : 'receita'}`)}
          </button>
        </form>
      </div>
    </Modal>
  );
}
