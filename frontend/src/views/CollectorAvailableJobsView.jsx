import React, { useState, useEffect } from 'react';
import { ClipboardList, PlusCircle, MapPin, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';

export default function CollectorAvailableJobsView({ showToast, onNavigate }) {
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPool = async () => {
    setLoading(true);
    try {
      const allPickups = await api.getPickups();
      // Filter unassigned or newly created pickups
      const available = (allPickups || []).filter(p =>
        ['created', 'pending'].includes(p.status?.toLowerCase()) || !p.collector_id
      );

      const mapped = available.map((j, idx) => ({
        ...j,
        distance_km: (1.2 + idx * 0.8).toFixed(1),
        payout: `$${((j.estimated_weight_kg || 180) * 0.25).toFixed(2)}`
      }));

      setPool(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPool();
  }, []);

  const claimJob = async (id) => {
    const res = await api.acceptJob(1, { pickup_id: id });
    if (res.error) {
      showToast('error', 'Job Claim Failed', res.error);
    } else {
      showToast('success', 'Job Claimed!', `Pickup #${id} added to your active dispatch route.`);
      await loadPool();
      onNavigate('collector_jobs');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Available Collection Pool</h1>
          <p className="page-subtitle">Claim on-demand pickup requests and optimize your daily revenue from live database orders</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadPool}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Pool
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('collector_jobs')}>
            Back to My Jobs
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {pool.map((job) => {
          const isCritical = job.priority === 'critical' || job.priority === 'high';

          return (
            <div
              key={job.id}
              className="glass-panel"
              style={{
                padding: 22,
                border: isCritical ? '1.5px solid rgba(239, 68, 68, 0.4)' : undefined
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    #{job.id}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: isCritical ? '#dc2626' : 'var(--text-muted)', fontWeight: isCritical ? 700 : 500 }}>
                    {isCritical ? 'High Priority Collection' : `${job.distance_km} km away`}
                  </div>
                </div>
                <StatusBadge status={job.priority} />
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{job.source_name}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14 }}>
                <MapPin size={13} /> {job.address}
              </div>

              <div style={{ background: '#f8faf9', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Material:</span>
                  <strong>{job.waste_type}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Est. Weight:</span>
                  <strong>{job.estimated_weight_kg} kg</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 700, fontSize: '0.95rem' }}>
                  <span>Guaranteed Payout:</span>
                  <span>{job.payout}</span>
                </div>
              </div>

              <button
                className={`btn ${isCritical ? 'btn-danger' : 'btn-primary'}`}
                style={{ width: '100%' }}
                onClick={() => claimJob(job.id)}
              >
                <PlusCircle size={15} /> Claim Job Dispatch
              </button>
            </div>
          );
        })}
        {pool.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            All available collection requests have been claimed. Check back shortly for new IoT sensor alerts.
          </div>
        )}
      </div>
    </div>
  );
}
