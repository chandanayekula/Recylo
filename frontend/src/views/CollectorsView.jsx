import React, { useState, useEffect } from 'react';
import { Users, Star, Phone, Truck, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function CollectorsView() {
  const [collectors, setCollectors] = useState([]);

  useEffect(() => {
    api.getCollectors().then(setCollectors);
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Collector Fleet Directory</h1>
          <p className="page-subtitle">Manage certified collection personnel, active shift status, and daily route performance</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
        {collectors.map((c) => (
          <div key={c.id} className="glass-panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e2e8e4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#166534' }}>
                  {c.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>{c.name}</h3>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {c.id}</div>
                </div>
              </div>
              <StatusBadge status={c.status} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Truck size={14} color="#16a34a" />
                <span>Vehicle: <strong>{c.vehicle}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Phone size={14} color="#64748b" />
                <span>{c.phone}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#d97706', fontWeight: 700 }}>
                <Star size={14} fill="#d97706" /> {c.rating} Rating
              </div>
              <div style={{ fontWeight: 600 }}>
                {c.completed_today} Pickups Today
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
