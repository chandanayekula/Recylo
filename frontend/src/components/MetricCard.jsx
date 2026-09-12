import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function MetricCard({
  title,
  value,
  unit,
  trend,
  isPositive = true,
  icon: Icon,
  variant = 'success',
  subtitle
}) {
  const variantClass = `icon-${variant}`;

  return (
    <div className="metric-card">
      <div className="metric-card-top">
        <span className="metric-card-title">{title}</span>
        {Icon && (
          <div className={`metric-card-icon-wrap ${variantClass}`}>
            <Icon size={19} />
          </div>
        )}
      </div>

      <div className="metric-card-value">
        {value} {unit && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>{unit}</span>}
      </div>

      {trend && (
        <div className={`metric-card-sub ${isPositive ? 'trend-up' : 'trend-down'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{trend}</span>
        </div>
      )}

      {subtitle && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
}
