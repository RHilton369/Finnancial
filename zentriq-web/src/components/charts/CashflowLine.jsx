import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrencyCompact } from '../../utils/format';

export default function CashflowLine({ data = [] }) {
  if (data.length === 0) {
    return (
      <div style={{ minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
        Sem dados para exibir
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.[0]) return null;
    return (
      <div style={{
        background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: 8, padding: '10px 14px',
        boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)', fontSize: 13
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{payload[0].payload.label}</div>
        <div style={{ color: 'var(--color-success)' }}>Receita: {formatCurrencyCompact(payload[0].payload.income)}</div>
        <div style={{ color: 'var(--color-danger)' }}>Despesa: {formatCurrencyCompact(payload[0].payload.expense)}</div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }} /> Receitas
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-danger)' }} /> Despesas
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={formatCurrencyCompact} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="income" stroke="var(--color-success)" strokeWidth={2} fill="url(#colorIncome)" dot={false} activeDot={{ r: 5 }} />
          <Area type="monotone" dataKey="expense" stroke="var(--color-danger)" strokeWidth={2} fill="url(#colorExpense)" dot={false} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
