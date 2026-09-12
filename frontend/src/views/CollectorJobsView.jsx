import React, { useState, useEffect } from 'react';
import { Briefcase, Play, CheckCircle2, Clock, MapPin, Scale, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export default function CollectorJobsView({ showToast, onNavigate }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeJob, setActiveJob] = useState(null);
  const [verifiedWeight, setVerifiedWeight] = useState(180);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const allPickups = await api.getPickups();
      // Filter pickups assigned to collector or in transit/assigned
      const collectorJobs = (allPickups || []).filter(p =>
        ['assigned', 'on_the_way', 'in_transit', 'collected', 'completed'].includes(p.status?.toLowerCase())
      );

      // Compute estimated guaranteed payout based on weight & waste type
      const mapped = (collectorJobs.length > 0 ? collectorJobs : allPickups.slice(0, 3)).map(j => ({
        ...j,
        payout: `$${((j.estimated_weight_kg || 150) * 0.25).toFixed(2)}`
      }));

      setJobs(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const startJob = async (id) => {
    const res = await api.updatePickupStatus(id, { status: 'ON_THE_WAY' });
    if (res.error) {
      showToast('error', 'Status Update Failed', res.error);
    } else {
      showToast('info', 'En Route', `Navigating to pickup #${id}. Status updated in PostgreSQL.`);
      await loadJobs();
    }
  };

  const openCompleteModal = (job) => {
    setActiveJob(job);
    setVerifiedWeight(job.actual_weight_kg || job.estimated_weight_kg || 180);
    setModalOpen(true);
  };

  const handleComplete = async () => {
    if (!activeJob) return;
    const res = await api.updatePickupStatus(activeJob.id, {
      status: 'COLLECTED',
      actual_weight_kg: Number(verifiedWeight)
    });

    if (res.error) {
      showToast('error', 'Completion Failed', res.error);
    } else {
      setModalOpen(false);
      showToast('success', 'Collection Completed', `Recorded ${verifiedWeight} kg for #${activeJob.id}. Direct payout credited.`);
      await loadJobs();
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Assigned Collection Jobs</h1>
          <p className="page-subtitle">Execute assigned routes, verify onboard weigh scales, and complete collections</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadJobs}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('collector_available')}>
            Browse Open Pool
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('map')}>
            <MapPin size={14} /> Open Route Map
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {jobs.map((job) => {
          const isCompleted = ['collected', 'completed'].includes(job.status?.toLowerCase());
          const isTransit = ['on_the_way', 'in_transit'].includes(job.status?.toLowerCase());

          return (
            <div key={job.id} className="glass-panel" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    #{job.id}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                    {job.scheduled_time || 'Immediate Dispatch'}
                  </div>
                </div>
                <StatusBadge status={job.status} />
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>
                {job.source_name}
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
                <MapPin size={14} /> {job.address}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#f8faf9', padding: 12, borderRadius: 10, marginBottom: 18, fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Stream:</span>
                  <div style={{ fontWeight: 700 }}>{job.waste_type}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Est. Weight:</span>
                  <div style={{ fontWeight: 700 }}>{job.actual_weight_kg || job.estimated_weight_kg} kg</div>
                </div>
                <div style={{ gridColumn: 'span 2', borderTop: '1px solid #e2e8e4', paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Guaranteed Payout:</span>
                  <span style={{ color: '#16a34a', fontWeight: 800, fontSize: '1.05rem' }}>{job.payout}</span>
                </div>
              </div>

              <div>
                {isCompleted ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#16a34a', fontWeight: 700, padding: '10px 0', fontSize: '0.9rem', background: '#dcfce7', borderRadius: 8 }}>
                    <CheckCircle2 size={16} /> Completed & Weighed
                  </div>
                ) : isTransit ? (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => openCompleteModal(job)}
                  >
                    <CheckCircle2 size={15} /> Complete & Weigh
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => startJob(job.id)}
                  >
                    <Play size={15} /> Start Route
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {jobs.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No assigned jobs in queue. Browse the Open Available Pool to claim pickup dispatches.
          </div>
        )}
      </div>

      {/* Completion Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Complete Collection #${activeJob?.id}`}
        icon={Scale}
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleComplete}>
              Confirm Tare & Record Weight
            </button>
          </>
        }
      >
        {activeJob && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f8faf9', padding: 14, borderRadius: 10, fontSize: '0.85rem' }}>
              <div><strong>Generator:</strong> {activeJob.source_name}</div>
              <div><strong>Stream:</strong> {activeJob.waste_type}</div>
              <div><strong>Expected:</strong> {activeJob.estimated_weight_kg} kg</div>
            </div>

            <div>
              <label className="form-label">Verified Scale Net Weight (kg)</label>
              <input
                type="number"
                className="form-control"
                value={verifiedWeight}
                onChange={(e) => setVerifiedWeight(e.target.value)}
                step="0.5"
                min="1"
                required
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Direct reading from vehicle on-board load cell scale.
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
