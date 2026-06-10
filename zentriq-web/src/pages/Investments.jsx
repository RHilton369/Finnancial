import { useState, useEffect } from 'react';
import { 
  Plus, 
  RefreshCw, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  X, 
  DollarSign, 
  AlertCircle, 
  Calendar, 
  Briefcase 
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { investmentsApi } from '../api/investments';
import styles from './Investments.module.css';

const TYPE_LABELS = {
  fixed_income: 'Renda Fixa',
  variable_income: 'Renda Variável (Ações/FIIs)',
  cripto: 'Criptoativos',
  others: 'Outros'
};

const TYPE_COLORS = {
  fixed_income: '#3b82f6',
  variable_income: '#10b981',
  cripto: '#8b5cf6',
  others: '#6b7280'
};

export default function Investments() {
  const [investments, setInvestments] = useState([]);
  const [summary, setSummary] = useState({ total_invested: 0, total_current: 0, profit: 0, roi: 0 });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Estados dos Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [valuationModalOpen, setValuationModalOpen] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);

  // Formulário de Cadastro/Edição
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('fixed_income');
  const [formTicker, setFormTicker] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formInstitution, setFormInstitution] = useState('');
  const [formInvestedAmount, setFormInvestedAmount] = useState('');
  const [formCurrentAmount, setFormCurrentAmount] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  // Formulário de Aporte/Valuation
  const [valInvestedVal, setValInvestedVal] = useState('');
  const [valCurrentVal, setValCurrentVal] = useState('');
  const [valDate, setValDate] = useState(new Date().toISOString().substring(0, 7)); // AAAA-MM

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await investmentsApi.list();
      setInvestments(res.data.investments);
      setSummary(res.data.summary);

      const histRes = await investmentsApi.getHistory();
      setHistory(histRes.data);
    } catch (err) {
      console.error('Erro ao carregar investimentos', err);
      setErrorMessage('Falha ao carregar os dados de investimentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  // Sincronizar cotações automaticamente
  const handleSyncQuotes = async () => {
    clearMessages();
    setSyncing(true);
    try {
      const res = await investmentsApi.sync();
      setSuccessMessage(res.data.message || 'Cotações sincronizadas com sucesso.');
      await fetchData();
    } catch (err) {
      console.error('Erro ao sincronizar cotações', err);
      const msg = err.response?.data?.message || 'Falha ao conectar na API de cotações.';
      setErrorMessage(msg);
    } finally {
      setSyncing(false);
    }
  };

  // Abrir modal de criação
  const handleOpenCreateModal = () => {
    setSelectedInvestment(null);
    setFormName('');
    setFormType('fixed_income');
    setFormTicker('');
    setFormQuantity('');
    setFormInstitution('');
    setFormInvestedAmount('');
    setFormCurrentAmount('');
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    clearMessages();
    setModalOpen(true);
  };

  // Abrir modal de edição
  const handleOpenEditModal = (inv) => {
    setSelectedInvestment(inv);
    setFormName(inv.name);
    setFormType(inv.type);
    setFormTicker(inv.ticker || '');
    setFormQuantity(inv.quantity !== null && inv.quantity !== undefined ? inv.quantity : '');
    setFormInstitution(inv.institution);
    setFormInvestedAmount(inv.invested_amount);
    setFormCurrentAmount(inv.current_amount);
    setFormPurchaseDate(inv.purchase_date);
    clearMessages();
    setModalOpen(true);
  };

  // Abrir modal de Aporte/Valuation
  const handleOpenValuationModal = (inv) => {
    setSelectedInvestment(inv);
    setValInvestedVal('');
    setValCurrentVal(inv.current_amount);
    setValDate(new Date().toISOString().substring(0, 7));
    clearMessages();
    setValuationModalOpen(true);
  };

  // Submeter cadastro/edição
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!formName || !formInstitution || !formPurchaseDate) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const payload = {
      name: formName,
      type: formType,
      ticker: formType === 'variable_income' && formTicker ? formTicker.trim().toUpperCase() : null,
      quantity: (formType === 'variable_income' || formType === 'cripto') && formQuantity !== '' ? parseFloat(formQuantity) : null,
      institution: formInstitution,
      invested_amount: parseFloat(formInvestedAmount) || 0,
      current_amount: formCurrentAmount !== '' ? parseFloat(formCurrentAmount) : parseFloat(formInvestedAmount) || 0,
      purchase_date: formPurchaseDate
    };

    try {
      if (selectedInvestment) {
        await investmentsApi.update(selectedInvestment.id, payload);
        setSuccessMessage('Investimento atualizado com sucesso.');
      } else {
        await investmentsApi.create(payload);
        setSuccessMessage('Investimento cadastrado com sucesso.');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Erro ao salvar investimento.');
    }
  };

  // Submeter Aporte/Valuation
  const handleValuationSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    if (valCurrentVal === '') {
      setErrorMessage('O novo saldo atual do investimento é obrigatório.');
      return;
    }

    const payload = {
      invested_val: parseFloat(valInvestedVal) || 0,
      current_val: parseFloat(valCurrentVal),
      date: valDate
    };

    try {
      await investmentsApi.addValuation(selectedInvestment.id, payload);
      setSuccessMessage('Aporte / Reajuste de saldo registrado com sucesso.');
      setValuationModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setErrorMessage(err.response?.data?.message || 'Erro ao registrar movimentação.');
    }
  };

  // Deletar ativo
  const handleDelete = async (id) => {
    clearMessages();
    if (!window.confirm('Tem certeza que deseja excluir este investimento? O histórico de rendimento dele também será apagado.')) {
      return;
    }

    try {
      await investmentsApi.remove(id);
      setSuccessMessage('Investimento excluído com sucesso.');
      fetchData();
    } catch (err) {
      console.error(err);
      setErrorMessage('Erro ao excluir investimento.');
    }
  };

  // Formatar valores para moeda brasileira
  const formatBRL = (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Preparar dados para o gráfico de pizza de diversificação
  const pieData = Object.keys(TYPE_LABELS).map(type => {
    const total = investments
      .filter(inv => inv.type === type)
      .reduce((sum, inv) => sum + inv.current_amount, 0);
    return {
      name: TYPE_LABELS[type],
      value: total,
      typeKey: type
    };
  }).filter(item => item.value > 0);

  // Formatar dados do gráfico de linha
  const formattedHistory = history.map(h => ({
    ...h,
    Mês: h.date.split('-').reverse().join('/'),
    'Valor Investido': h.invested,
    'Valor Atual': h.current
  }));

  return (
    <div className={styles.container}>
      {/* Cabeçalho */}
      <div className={styles.headerActions}>
        <div className={styles.titleSection}>
          <h2>Investimentos</h2>
          <p>Gerencie sua carteira, lance aportes e acompanhe seu rendimento patrimonial.</p>
        </div>
        <div className={styles.buttonGroup}>
          <button 
            className={styles.secondaryBtn} 
            onClick={handleSyncQuotes} 
            disabled={syncing}
            title="Sincronizar cotações de Renda Variável via Brapi"
          >
            <RefreshCw size={18} className={syncing ? 'spinner-anim' : ''} />
            {syncing ? 'Sincronizando...' : 'Sincronizar B3'}
          </button>
          <button className={styles.primaryBtn} onClick={handleOpenCreateModal}>
            <Plus size={18} />
            Novo Investimento
          </button>
        </div>
      </div>

      {/* Alertas Rápidos */}
      {errorMessage && (
        <div className="alert alert-danger" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <TrendingUp size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.cardLabel}>Patrimônio Atualizado</span>
          <span className={styles.cardValue}>{formatBRL(summary.total_current)}</span>
          <span className={styles.cardSub}>Valor de mercado atual</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.cardLabel}>Total Investido</span>
          <span className={styles.cardValue}>{formatBRL(summary.total_invested)}</span>
          <span className={styles.cardSub}>Histórico de aportes</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.cardLabel}>Lucro / Prejuízo</span>
          <span className={`${styles.cardValue} ${summary.profit >= 0 ? styles.positive : styles.negative}`}>
            {summary.profit >= 0 ? '+' : ''}{formatBRL(summary.profit)}
          </span>
          <span className={styles.cardSub}>Rendimento líquido</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.cardLabel}>Retorno sobre Investimento (ROI)</span>
          <span className={`${styles.cardValue} ${summary.roi >= 0 ? styles.positive : styles.negative}`}>
            {summary.roi >= 0 ? '+' : ''}{summary.roi.toFixed(2)}%
          </span>
          <span className={styles.cardSub}>Rentabilidade acumulada</span>
        </div>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Carregando dados da sua carteira...</div>
      ) : (
        <>
          {/* Seção de Gráficos */}
          {investments.length > 0 && (
            <div className={styles.chartsGrid}>
              {/* Pizza de Diversificação */}
              <div className={styles.chartCard}>
                <span className={styles.chartTitle}>Alocação por Tipo de Ativo</span>
                <div className={styles.chartWrap}>
                  {pieData.length === 0 ? (
                    <span style={{ color: 'var(--text-tertiary)' }}>Sem dados de alocação</span>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={TYPE_COLORS[entry.typeKey]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatBRL(value)} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Área de Evolução */}
              <div className={styles.chartCard}>
                <span className={styles.chartTitle}>Evolução Histórica da Carteira</span>
                <div className={styles.chartWrap}>
                  {formattedHistory.length === 0 ? (
                    <span style={{ color: 'var(--text-tertiary)' }}>Histórico insuficiente para gráficos</span>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={formattedHistory}>
                        <defs>
                          <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="Mês" stroke="var(--text-tertiary)" fontSize={11} />
                        <YAxis stroke="var(--text-tertiary)" fontSize={11} tickFormatter={(v) => `R$ ${v}`} />
                        <Tooltip formatter={(value) => formatBRL(value)} />
                        <Legend />
                        <Area type="monotone" dataKey="Valor Investido" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorInvested)" />
                        <Area type="monotone" dataKey="Valor Atual" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCurrent)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tabela de Ativos */}
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <span className={styles.tableTitle}>Seus Ativos Cadastrados</span>
            </div>

            {investments.length === 0 ? (
              <div className={styles.emptyState}>
                <Briefcase size={36} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p>Nenhum investimento cadastrado ainda.</p>
                <button 
                  className={styles.secondaryBtn} 
                  onClick={handleOpenCreateModal} 
                  style={{ marginTop: '16px', display: 'inline-flex' }}
                >
                  Cadastrar Primeiro Investimento
                </button>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Ativo</th>
                      <th>Classe</th>
                      <th>Instituição</th>
                      <th>Valor Investido</th>
                      <th>Saldo Atual</th>
                      <th>Rendimento</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map(inv => {
                      const netProfit = inv.current_amount - inv.invested_amount;
                      const assetRoi = inv.invested_amount > 0 ? (netProfit / inv.invested_amount) * 100 : 0;
                      return (
                        <tr key={inv.id}>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 600 }}>{inv.name}</span>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                                {inv.ticker && <span className={styles.tickerBadge}>{inv.ticker}</span>}
                                {inv.quantity !== null && inv.quantity !== undefined && inv.quantity > 0 && (
                                  <span className={styles.quantityBadge}>
                                    {inv.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 6 })} {inv.type === 'cripto' ? 'unidades' : 'cotas'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`${styles.typeBadge} ${
                              inv.type === 'fixed_income' ? styles.typeFixed :
                              inv.type === 'variable_income' ? styles.typeVariable :
                              inv.type === 'cripto' ? styles.typeCripto : styles.typeOthers
                            }`}>
                              {TYPE_LABELS[inv.type]}
                            </span>
                          </td>
                          <td>{inv.institution}</td>
                          <td>{formatBRL(inv.invested_amount)}</td>
                          <td>{formatBRL(inv.current_amount)}</td>
                          <td className={netProfit >= 0 ? styles.positive : styles.negative} style={{ fontWeight: 600 }}>
                            <div>{netProfit >= 0 ? '+' : ''}{formatBRL(netProfit)}</div>
                            <div style={{ fontSize: '11px', opacity: 0.8 }}>{netProfit >= 0 ? '+' : ''}{assetRoi.toFixed(2)}%</div>
                          </td>
                          <td>
                            <div className={styles.actionsCell}>
                              <button 
                                className={styles.actionBtn} 
                                onClick={() => handleOpenValuationModal(inv)}
                                title="Registrar aporte ou valorização manual"
                              >
                                <DollarSign size={16} />
                              </button>
                              <button 
                                className={styles.actionBtn} 
                                onClick={() => handleOpenEditModal(inv)}
                                title="Editar dados cadastrais"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                                onClick={() => handleDelete(inv.id)}
                                title="Excluir investimento"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {modalOpen && (
        <div className={styles.modalOverlay}>
          <form className={styles.modal} onSubmit={handleSubmit}>
            <div className={styles.modalHeader}>
              <h3>{selectedInvestment ? 'Editar Investimento' : 'Novo Investimento'}</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Nome do Investimento *</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: CDB Inter Liquidez Diária, Ações Petrobras"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Classe do Ativo *</label>
                <select 
                  className={styles.select} 
                  value={formType} 
                  onChange={(e) => setFormType(e.target.value)}
                >
                  <option value="fixed_income">Renda Fixa (CDB, Tesouro, LCI)</option>
                  <option value="variable_income">Renda Variável (Ações, FIIs, ETFs)</option>
                  <option value="cripto">Criptoativos (BTC, ETH)</option>
                  <option value="others">Outros (Imóveis, Ouro, etc.)</option>
                </select>
              </div>

              {formType === 'variable_income' && (
                <div className={styles.formGroup}>
                  <label>Ticker da B3</label>
                  <input 
                    type="text" 
                    className={styles.input} 
                    value={formTicker} 
                    onChange={(e) => setFormTicker(e.target.value)}
                    placeholder="Ex: PETR4, MXRF11 (deixe em branco se não aplicável)"
                  />
                  <div className={styles.alertBox}>
                    <AlertCircle size={14} />
                    <span>Se preenchido, você poderá consultar e sincronizar a cotação automaticamente.</span>
                  </div>
                </div>
              )}

              {(formType === 'variable_income' || formType === 'cripto') && (
                <div className={styles.formGroup}>
                  <label>Quantidade de Cotas / Frações *</label>
                  <input 
                    type="number" 
                    step="any"
                    className={styles.input} 
                    value={formQuantity} 
                    onChange={(e) => setFormQuantity(e.target.value)}
                    placeholder="Ex: 100, 1.5, 0.052"
                    required
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Instituição Financeira *</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={formInstitution} 
                  onChange={(e) => setFormInstitution(e.target.value)}
                  placeholder="Ex: Banco Inter, XP Investimentos, Binance"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Valor Investido Original *</label>
                <input 
                  type="number" 
                  step="0.01"
                  className={styles.input} 
                  value={formInvestedAmount} 
                  onChange={(e) => setFormInvestedAmount(e.target.value)}
                  placeholder="R$ 0,00"
                  required
                />
              </div>

              {!selectedInvestment && (
                <div className={styles.formGroup}>
                  <label>Valor de Mercado Atual (Opcional)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className={styles.input} 
                    value={formCurrentAmount} 
                    onChange={(e) => setFormCurrentAmount(e.target.value)}
                    placeholder="Se diferente do valor original"
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Data de Compra *</label>
                <input 
                  type="date" 
                  className={styles.input} 
                  value={formPurchaseDate} 
                  onChange={(e) => setFormPurchaseDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelBtn} onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className={styles.primaryBtn}>
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE APORTE / REAJUSTE DE SALDO (VALUATION) */}
      {valuationModalOpen && selectedInvestment && (
        <div className={styles.modalOverlay}>
          <form className={styles.modal} onSubmit={handleValuationSubmit}>
            <div className={styles.modalHeader}>
              <h3>Aporte ou Atualização de Saldo</h3>
              <button type="button" className={styles.closeBtn} onClick={() => setValuationModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Ativo: <strong>{selectedInvestment.name}</strong>
              </div>

              <div className={styles.formGroup}>
                <label>Valor de Aporte Adicional (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className={styles.input} 
                  value={valInvestedVal} 
                  onChange={(e) => setValInvestedVal(e.target.value)}
                  placeholder="Ex: Comprou mais R$ 500,00. Deixe em branco se for só reajuste."
                />
              </div>

              <div className={styles.formGroup}>
                <label>Novo Saldo de Mercado Total (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  className={styles.input} 
                  value={valCurrentVal} 
                  onChange={(e) => setValCurrentVal(e.target.value)}
                  placeholder="Valor total atualizado da carteira deste ativo"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Mês de Referência *</label>
                <input 
                  type="month" 
                  className={styles.input} 
                  value={valDate} 
                  onChange={(e) => setValDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelBtn} onClick={() => setValuationModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className={styles.primaryBtn}>
                Registrar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
