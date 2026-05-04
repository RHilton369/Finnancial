import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useCategories } from '../hooks/useCategories';
import { reportsApi } from '../api/reports';
import { formatCurrency } from '../utils/format';
import styles from './Reports.module.css';

const now = new Date();
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function Reports() {
  const [year, setYear] = useState(now.getFullYear());
  const [monthlyData, setMonthlyData] = useState(null);
  const [catEvolutionData, setCatEvolutionData] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const { data: categories } = useCategories('expense');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    reportsApi.monthly(year)
      .then(res => setMonthlyData(res.data))
      .catch(() => setMonthlyData(null))
      .finally(() => setLoading(false));
  }, [year]);

  useEffect(() => {
    if (selectedCategory) {
      reportsApi.categoryEvolution(selectedCategory, 6)
        .then(res => setCatEvolutionData(res.data))
        .catch(() => setCatEvolutionData(null));
    }
  }, [selectedCategory]);

  const totalIncome = monthlyData?.reduce((s, m) => s + m.income, 0) || 0;
  const totalExpense = monthlyData?.reduce((s, m) => s + m.expense, 0) || 0;
  const totalBalance = totalIncome - totalExpense;
  const maxMonth = monthlyData?.reduce((max, m) => m.expense > (max?.expense || 0) ? m : max, null);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Relatórios</h2>
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className={styles.yearSelect}>
          {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Carregando...</div>
      ) : monthlyData && (
        <>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Receita anual</span>
              <span className={styles.incomeText}>{formatCurrency(totalIncome)}</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Despesa anual</span>
              <span className={styles.expenseText}>{formatCurrency(totalExpense)}</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Saldo anual</span>
              <span className={totalBalance >= 0 ? styles.incomeText : styles.expenseText}>
                {formatCurrency(totalBalance)}
              </span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Mês mais caro</span>
              <span>
                {maxMonth?.expense > 0 ? `${MONTH_LABELS[maxMonth.month - 1]} · ${formatCurrency(maxMonth.expense)}` : '—'}
              </span>
            </div>
          </div>

          <div className={styles.chartCard}>
            <h3 className={styles.cardTitle}>{year} — Receitas vs Despesas</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tickFormatter={v => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} tick={{ fontSize: 11 }} tickLine={false} />
                <Tooltip formatter={v => formatCurrency(v)} />
                <Bar dataKey="income" fill="#1D9E75" name="Receita" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" fill="#E24B4A" name="Despesa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.tableCard}>
            <h3 className={styles.cardTitle}>Resumo mensal</h3>
            <div className={styles.tableWrap}>
              <table className={styles.monthlyTable}>
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Receitas</th>
                    <th>Despesas</th>
                    <th>Saldo</th>
                    <th>Poupança</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map(m => {
                    const savingsRate = m.income > 0 ? ((m.income - m.expense) / m.income * 100) : 0;
                    const isCurrent = m.month === now.getMonth() + 1 && parseInt(year) === now.getFullYear();
                    return (
                      <tr key={m.month}
                        className={isCurrent ? styles.currentRow : ''}
                        onClick={() => navigate(`/transactions?month=${m.month}&year=${year}`)}
                      >
                        <td>{m.label}</td>
                        <td className={styles.incomeCell}>{formatCurrency(m.income)}</td>
                        <td className={styles.expenseCell}>{formatCurrency(m.expense)}</td>
                        <td className={m.balance >= 0 ? styles.incomeCell : styles.expenseCell}>
                          {formatCurrency(m.balance)}
                        </td>
                        <td>
                          <span className={`${styles.savingsBadge} ${savingsRate >= 20 ? styles.green : savingsRate >= 0 ? styles.yellow : styles.red}`}>
                            {savingsRate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {categories && categories.length > 0 && (
            <div className={styles.chartCard}>
              <h3 className={styles.cardTitle}>Evolução de gasto por categoria</h3>
              <div className={styles.catSelector}>
                <label>Selecionar categoria:</label>
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                  <option value="">Selecione...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {catEvolutionData && catEvolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={catEvolutionData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis tickFormatter={v => `R$${v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}`} tick={{ fontSize: 11 }} tickLine={false} />
                    <Tooltip formatter={v => formatCurrency(v)} />
                    <Line type="monotone" dataKey="total"
                      stroke={categories.find(c => c.id === selectedCategory)?.color || '#1D9E75'}
                      strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className={styles.emptyChart}>Selecione uma categoria para ver a evolução</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
