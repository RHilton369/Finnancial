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
        background: 'white', borderRadius: 8, padding: '10px 14px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)', fontSize: 13
      }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>{payload[0].payload.label}</div>
        <div style={{ color: '#1D9E75' }}>Receita: {formatCurrencyCompact(payload[0].payload.income)}</div>
        <div style={{ color: '#E24B4A' }}>Despesa: {formatCurrencyCompact(payload[0].payload.expense)}</div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75' }} /> Receitas
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E24B4A' }} /> Despesas
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={formatCurrencyCompact} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="income" stroke="#1D9E75" strokeWidth={2} fill="#1D9E75" fillOpacity={0.08} dot={false} activeDot={{ r: 5 }} />
          <Area type="monotone" dataKey="expense" stroke="#E24B4A" strokeWidth={2} fill="#E24B4A" fillOpacity={0.08} dot={false} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
