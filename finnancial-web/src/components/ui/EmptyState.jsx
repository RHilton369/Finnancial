export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-tertiary)' }}>
      {Icon && <Icon size={48} color="var(--text-tertiary)" style={{ marginBottom: 16 }} />}
      <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8, color: 'var(--text-secondary)' }}>{title}</p>
      {description && <p style={{ fontSize: 14, marginBottom: 20 }}>{description}</p>}
      {action}
    </div>
  );
}
