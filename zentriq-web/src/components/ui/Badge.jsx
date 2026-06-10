export default function Badge({ variant = 'neutral', size = 'md', children }) {
  const colors = {
    success: { bg: 'var(--color-success-light)', text: 'var(--color-success)' },
    warning: { bg: 'var(--color-warning-light)', text: 'var(--color-warning)' },
    danger: { bg: 'var(--color-danger-light)', text: 'var(--color-danger)' },
    info: { bg: 'var(--color-info-light)', text: 'var(--color-info)' },
    neutral: { bg: 'var(--bg-page)', text: 'var(--text-secondary)' },
  };
  const c = colors[variant] || colors.neutral;
  const s = size === 'sm' ? '11px 6px' : '4px 10px';
  const f = size === 'sm' ? '11px' : '12px';
  return (
    <span style={{
      background: c.bg, color: c.text, padding: s,
      borderRadius: 10, fontSize: f, fontWeight: 600, display: 'inline-block'
    }}>
      {children}
    </span>
  );
}
