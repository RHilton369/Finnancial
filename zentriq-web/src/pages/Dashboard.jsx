import { useEffect, useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Bell, RefreshCw, Sparkles } from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { formatCurrency, formatMonthLabel } from '../utils/format';
import { CATEGORY_ICONS, getCategoryIcon } from '../utils/categoryColors';
import SpendingDonut from '../components/charts/SpendingDonut';
import CashflowLine from '../components/charts/CashflowLine';
import styles from './Dashboard.module.css';
import toast from 'react-hot-toast';
import { maintenanceApi } from '../api/maintenance';
import { reportsApi } from '../api/reports';
import WrappedModal from '../components/reports/WrappedModal';

/**
 * Página do Dashboard - Visão geral financeira do usuário.
 * Exibe resumos de receitas/despesas, gráficos de gastos e alertas de orçamento.
 * 
 * @component
 */
export default function Dashboard() {
  const now = new Date();
  const [month, setMonth] = useState(() => parseInt(localStorage.getItem('selectedMonth')) || now.getMonth() + 1);
  const [year, setYear] = useState(() => parseInt(localStorage.getItem('selectedYear')) || now.getFullYear());
  const [recalculating, setRecalculating] = useState(false);
  const [showWrapped, setShowWrapped] = useState(false);
  const [wrappedData, setWrappedData] = useState(null);
  const { summary, cashflow, loading, refresh } = useDashboard(month, year);

  const handleOpenWrapped = async () => {
    try {
      const res = await reportsApi.wrapped(month, year);
      setWrappedData(res.data);
      setShowWrapped(true);
    } catch (err) {
      toast.error('Erro ao gerar o Fechamento do Mês');
    }
  };

  useEffect(() => {
    /**
     * Listener para mudanças globais de mês/ano disparadas pelo TopBar.
     * @param {CustomEvent} e 
     */
    const handler = (e) => {
      if (e.detail) { 
        setMonth(e.detail.month); 
        setYear(e.detail.year); 
      }
    };
    window.addEventListener('monthChange', handler);
    return () => window.removeEventListener('monthChange', handler);
  }, []);

  return (
    <div className={styles.dashboard}>
      {/* Grade de Resumo (Cards Superiores) */}
      <div className={styles.summaryGrid}>
        <SummaryCard
          label="Receitas do Mês"
          value={summary?.summary?.totalIncome || 0}
          vDelta={summary?.vsLastMonth?.income}
        />
        <SummaryCard
          label="Despesas do Mês"
          value={summary?.summary?.totalExpense || 0}
          vDelta={summary?.vsLastMonth?.expense} inverted
        />
        <SummaryCard
          label="Saldo"
          value={summary?.summary?.balance || 0}
        />
        <SummaryCard
          label="Taxa de Poupança"
          value={summary?.summary?.savingsRate || 0}
          isPercent
        />
        <div className={styles.summaryCardRecalc}>
          <button 
            className={styles.recalcBtnGlobal} 
            style={{background: 'var(--color-primary)', color: '#fff', border: 'none', marginBottom: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px'}}
            onClick={handleOpenWrapped}
          >
            <Sparkles size={16} /> Fechamento do Mês
          </button>
          <button 
            className={styles.recalcBtnGlobal}
            onClick={async () => {
              setRecalculating(true);
              try {
                await maintenanceApi.recalculateBalances();
                toast.success('Saldos recalculados com sucesso!');
                // Atualiza os dados de forma reativa sem recarregar a página
                await refresh();
              } catch (err) {
                toast.error('Erro ao recalcular: ' + (err.response?.data?.message || err.message || 'Erro desconhecido'));
              } finally {
                setRecalculating(false);
              }
            }}
            disabled={recalculating}
            title="Recalcular todos os saldos baseado no histórico de transações"
          >
            {recalculating ? <><RefreshCw size={16} className={styles.spin} /> Calculando...</> : <><RefreshCw size={16} /> Recalcular</>}
          </button>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.colMain}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Gastos por Categoria</h3>
            {loading ? (
              <div className={styles.chartPlaceholder}>Carregando...</div>
            ) : (
              <SpendingDonut data={(summary?.topCategories || []).filter(Boolean).map(c => ({ name: c.name || 'Sem nome', value: c.total || 0, color: c.color }))} />
            )}
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Fluxo de Caixa</h3>
            {loading ? (
              <div className={styles.chartPlaceholder}>Carregando...</div>
            ) : (
              <CashflowLine data={cashflow || []} />
            )}
          </div>
        </div>

        <div className={styles.colSide}>
          <div className={styles.card}>
            <div className={styles.flexBetween}>
              <h3 className={styles.cardTitle}>Próximas Contas</h3>
              <Bell size={16} color="var(--text-tertiary)" />
            </div>
            {!loading && summary?.upcomingBills && summary.upcomingBills.length > 0 ? (
              <div className={styles.billList}>
                {summary.upcomingBills.filter(Boolean).map(bill => {
                  const Ico = getCategoryIcon(bill.category_icon || 'tag');
                  const days = bill.daysUntil;
                  return (
                    <div key={bill.id || Math.random()} className={styles.billItem}>
                      <div className={styles.billIcon} style={{ background: bill.category_color || '#888780' }}>
                        <Ico size={16} color="white" />
                      </div>
                      <div className={styles.billInfo}>
                        <span className={styles.billName}>{bill.description || 'Sem descrição'}</span>
                        <span className={styles.billDate}>{formatCurrency(bill.amount || 0)}</span>
                      </div>
                      <span className={`${styles.billBadge} ${days <= 0 ? styles.danger : days <= 1 ? styles.warning : ''}`}>
                        {days <= 0 ? 'Hoje' : days === 1 ? 'Amanhã' : `${days}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.emptyText}>Nenhuma conta nos próximos 7 dias</p>
            )}
          </div>

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Maiores Gastos</h3>
            {!loading && summary?.topCategories && summary.topCategories.length > 0 ? (
              <div className={styles.topList}>
                {summary.topCategories.filter(Boolean).slice(0, 5).map((cat) => {
                  const maxCat = summary.topCategories[0];
                  const barWidth = (maxCat?.total > 0) ? (cat.total / maxCat.total * 100) : 0;
                  return (
                    <div key={cat.id || Math.random()} className={styles.topItem}>
                      <div className={styles.topDot} style={{ background: cat.color || '#888780' }} />
                      <div className={styles.topInfo}>
                        <span>{cat.name || 'Sem nome'}</span>
                        <div className={styles.topBar}>
                          <div className={styles.topBarFill} style={{ width: `${Math.min(Math.max(barWidth, 0), 100)}%`, background: cat.color || '#888780' }} />
                        </div>
                      </div>
                      <span className={styles.topValue}>{formatCurrency(cat.total || 0)}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.emptyText}>Nenhum gasto este mês</p>
            )}
          </div>

          {summary?.budgetAlerts && summary.budgetAlerts.length > 0 && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                Alertas
                <span className={styles.alertBadge}>{summary.budgetAlerts.length}</span>
              </h3>
              <div className={styles.alertList}>
                {summary.budgetAlerts.filter(Boolean).map(alert => {
                  const Ico = getCategoryIcon(alert.icon || 'tag');
                  return (
                    <div key={alert.id || Math.random()} className={styles.alertItem}>
                      <Ico size={18} color={alert.color || '#888780'} />
                      <div className={styles.alertInfo}>
                        <div className={styles.alertHeader}>
                          <span>{alert.name || 'Sem nome'}</span>
                          <span className={alert.status === 'danger' ? styles.alertStatusDanger : styles.alertStatusWarning}>
                            {alert.status === 'danger' ? 'Estourado' : 'Atenção'}
                          </span>
                        </div>
                        <div className={styles.progressBar}>
                          <div
                            className={styles.progressFill}
                            style={{ width: `${Math.min(Math.max(alert.usedPct || 0, 0), 100)}%`, background: alert.usedPct >= 100 ? 'var(--color-danger)' : 'var(--color-warning)' }}
                          />
                        </div>
                        <span className={styles.alertValue}>{formatCurrency(alert.spent || 0)} de {formatCurrency(alert.amount_limit || 0)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      {showWrapped && (
        <WrappedModal 
          data={wrappedData} 
          onClose={() => setShowWrapped(false)} 
        />
      )}
    </div>
  );
}

/**
 * Card de resumo para indicadores financeiros.
 * 
 * @param {Object} props
 * @param {string} props.label - Título do indicador.
 * @param {number} props.value - Valor numérico.
 * @param {boolean} [props.isPercent] - Se o valor deve ser exibido como percentual.
 * @param {Object} [props.vDelta] - Objeto contendo variação em relação ao período anterior.
 * @param {boolean} [props.inverted] - Inverte as cores de sucesso/erro (ex: despesa subindo é ruim).
 */
function SummaryCard({ label, value, isPercent, vDelta, inverted }) {
  let IconComp = Wallet;
  if (label.includes('Receita')) IconComp = ArrowUpCircle;
  else if (label.includes('Despesa')) IconComp = ArrowDownCircle;
  else if (label.includes('Saldo')) IconComp = Wallet;
  else if (label.includes('Poupan')) IconComp = PiggyBank;

  let iconColor = 'var(--color-info)';
  let iconBg = 'var(--color-info-light)';
  if (label.includes('Receita')) { iconColor = 'var(--color-success)'; iconBg = 'var(--color-success-light)'; }
  else if (label.includes('Despesa')) { iconColor = 'var(--color-danger)'; iconBg = 'var(--color-danger-light)'; }
  else if (label.includes('Poupan')) { iconColor = 'var(--color-primary)'; iconBg = 'var(--color-primary-light)'; }

  const isNegativeBalance = label.includes('Saldo') && value < 0;
  const isPositiveBalance = label.includes('Saldo') && value > 0;
  const valueClassName = `${styles.summaryValue} ${isNegativeBalance ? styles.negativeBalance : isPositiveBalance ? styles.positiveBalance : ''}`;

  return (
    <div className={styles.summaryCard}>
      <div className={styles.summaryIconWrap} style={{ background: iconBg }}>
        <IconComp size={20} color={iconColor} />
      </div>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={valueClassName}>{isPercent ? `${value}%` : formatCurrency(value)}</span>
      {vDelta && <DeltaBadge value={vDelta.delta} direction={vDelta.direction} inverted={inverted} />}
    </div>
  );
}

/**
 * Badge de variação percentual (Delta).
 * 
 * @param {Object} props
 * @param {number} props.value - Valor da variação.
 * @param {string} props.direction - Direção ('up' | 'down').
 * @param {boolean} props.inverted - Se verdadeiro, 'up' fica vermelho e 'down' verde (para despesas).
 */
function DeltaBadge({ value, direction, inverted }) {
  const isUp = direction === 'up';
  let color;
  if (inverted) {
    color = isUp ? 'var(--color-danger)' : 'var(--color-success)';
  } else {
    color = isUp ? 'var(--color-success)' : 'var(--color-danger)';
  }
  return (
    <span className={styles.delta} style={{ color }}>
      {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {Math.abs(value)}%
    </span>
  );
}
