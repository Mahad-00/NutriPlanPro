export function Badge({ children, tone = 'teal' }) {
  const colors = {
    teal: { background: '#ccfbf1', color: '#115e59' },
    orange: { background: '#ffedd5', color: '#9a3412' },
    slate: { background: '#f1f5f9', color: '#475569' },
    yellow: { background: '#fef3c7', color: '#92400e' },
    blue: { background: '#dbeafe', color: '#1e40af' },
  };
  const bg = colors[tone] || colors.teal;
  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: '9999px',
        padding: '0.25rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: 600,
        ...bg,
      }}
    >
      {children}
    </span>
  );
}

export function Panel({ children, className = '', style }) {
  return (
    <div
      className={className}
      style={{
        borderRadius: '0.5rem',
        border: '1px solid #e2e8f0',
        background: '#fff',
        padding: '1.5rem',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, helper, icon: Icon, tone = 'teal' }) {
  const iconColors = {
    teal: '#0f766e',
    orange: '#c2410c',
    blue: '#1d4ed8',
    yellow: '#a16207',
  };
  return (
    <div style={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff', padding: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', margin: 0 }}>{label}</p>
        {Icon && <Icon size={20} color={iconColors[tone] || iconColors.teal} />}
      </div>
      <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#020617', margin: '0.5rem 0 0' }}>{value}</p>
      {helper && <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>{helper}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#020617', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0', maxWidth: 640 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, text }) {
  return (
    <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8', margin: 0 }}>{title}</p>
      {text && <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: '0.25rem 0 0' }}>{text}</p>}
    </div>
  );
}

export function ProgressBar({ value = 0, color = '#14b8a6' }) {
  const barColor = {
    'bg-sky-500': '#0ea5e9',
    'bg-amber-500': '#f59e0b',
    'bg-teal-500': '#14b8a6',
  };
  return (
    <div
      style={{
        marginTop: '0.5rem',
        height: '0.5rem',
        width: '100%',
        overflow: 'hidden',
        borderRadius: '9999px',
        background: '#f1f5f9',
      }}
    >
      <div
        style={{
          height: '100%',
          borderRadius: '9999px',
          transition: 'all 0.3s',
          background: barColor[color] || color,
          width: `${Math.min(value, 100)}%`,
        }}
      />
    </div>
  );
}
