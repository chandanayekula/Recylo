import React, { useState, useEffect } from 'react';
import { Car, BatteryCharging, UserCheck, ShieldCheck } from 'lucide-react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function VehiclesView() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    api.getVehicles().then(setVehicles);
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vehicle Fleet Telemetry</h1>
          <p className="page-subtitle">Eco-friendly collection vehicles, live cargo payload capacity, and battery telemetry</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
        {vehicles.map((v) => {
          const loadPct = Math.round((v.current_load_kg / v.capacity_kg) * 100);

          return (
            <div key={v.id} className="glass-panel" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {v.id}
                </div>
                <StatusBadge status={v.status} />
              </div>

              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                {v.type}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Assigned: <strong>{v.assigned_collector}</strong>
              </div>

              {/* Payload Progress */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 5 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payload Load</span>
                  <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {v.current_load_kg} / {v.capacity_kg} kg ({loadPct}%)
                  </span>
                </div>
                <div style={{ height: 8, background: '#e2e8e4', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${loadPct}%`, background: 'var(--color-accent)', borderRadius: 999 }} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a', fontWeight: 600 }}>
                  <BatteryCharging size={16} /> {v.battery_fuel}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>Zero Emissions</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
