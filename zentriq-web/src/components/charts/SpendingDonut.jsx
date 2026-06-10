import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../utils/format';

export default function SpendingDonut({ data = [] }) {
  if (data.length === 0) {
    return (
      <div style={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: 14 }}>
        Nenhum gasto registrado neste mês
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);
  const chartData = data.map(d => ({ name: d.name, value: d.value, color: d.color || 'var(--text-tertiary)' }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.[0]) return null;
    const item = payload[0].payload;
    const pct = total > 0 ? (item.value / total * 100).toFixed(1) : 0;
    return (
      <div style={{
        background: 'var(--bg-card)', color: 'var(--text-primary)', borderRadius: 8, padding: '10px 14px',
        boxShadow: 'var(--shadow-card)', border: '1px solid var(--border-color)', fontSize: 13
      }}>
        <div style={{ fontWeight: 600 }}>{item.name}</div>
        <div style={{ color: 'var(--text-secondary)' }}>{formatCurrency(item.value)} · {pct}%</div>
      </div>
    );
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={chartData}
            innerRadius={75}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* custom legend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginTop: 16 }}>
        {chartData.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>{item.name}</span>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

