import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, CheckCircle, Search, Filter, Truck, ArrowUpRight } from 'lucide-react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export default function SmartBinsView({ showToast, onNavigate }) {
  const [bins, setBins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBin, setSelectedBin] = useState(null);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadBins = async () => {
    setLoading(true);
    const res = await api.getBins();
    setBins(res);
    setLoading(false);
  };

  useEffect(() => {
    loadBins();
  }, []);

  const openDispatch = (bin) => {
    setSelectedBin(bin);
    setDispatchModalOpen(true);
  };

  const handleConfirmDispatch = async () => {
    if (!selectedBin) return;
    await api.createBinPickup(selectedBin.id, {
      priority: 'high',
      notes: `Dispatched from Smart Bin monitor. Fill level at ${selectedBin.fill_pct}%.`
    });
    setDispatchModalOpen(false);
    showToast('success', 'Pickup Dispatched!', `Collector assigned to empty Bin #${selectedBin.id} (${selectedBin.location})`);
    await loadBins();
  };

  const criticalBin = bins.find(b => b.fill_pct >= 90) || null;

  const filteredBins = bins.filter((b) => {
    const matchQuery = !searchQuery ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.waste_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchStatus = statusFilter === 'all' ||
      (statusFilter === 'critical' && b.fill_pct >= 90) ||
      (statusFilter === 'warning' && b.fill_pct >= 70 && b.fill_pct < 90) ||
      (statusFilter === 'normal' && b.fill_pct < 70);

    return matchQuery && matchStatus;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Smart Bins Telemetry</h1>
          <p className="page-subtitle">Ultrasonic fill sensors, status telemetry, and automated route dispatch triggers</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => onNavigate('map')}>
          View on Live Map
        </button>
      </div>

      {/* Critical Alert Banner */}
      {criticalBin && (
        <div className="critical-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={24} color="#dc2626" style={{ flexShrink: 0 }} />
            <div>
              <span style={{ fontWeight: 800, color: '#991b1b' }}>CRITICAL ALERT: </span>
              <span style={{ color: '#b91c1c', fontSize: '0.88rem' }}>
                Bin <strong>#{criticalBin.id}</strong> ({criticalBin.location}) has reached <strong>{criticalBin.fill_pct}% capacity</strong>. Immediate pickup required to avert street-level overflow.
              </span>
            </div>
          </div>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => openDispatch(criticalBin)}
          >
            <Truck size={14} /> Dispatch Collector
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'critical', 'warning', 'normal'].map((st) => (
            <button
              key={st}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(st)}
              style={{ textTransform: 'capitalize' }}
            >
              {st === 'critical' ? 'Critical (90%+)' : st}
            </button>
          ))}
        </div>

        <div className="search-input-wrap">
          <Search size={15} />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search bins by ID or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Smart Bin Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
        {filteredBins.map((bin) => {
          const isCritical = bin.fill_pct >= 90;
          const isWarning = bin.fill_pct >= 70 && bin.fill_pct < 90;
          const fillColor = isCritical ? 'var(--color-critical)' : isWarning ? 'var(--color-amber)' : 'var(--color-accent)';

          return (
            <div
              key={bin.id}
              className="glass-panel"
              style={{
                padding: 20,
                border: isCritical ? '1.5px solid rgba(239, 68, 68, 0.4)' : undefined,
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    #{bin.id}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{bin.zone}</div>
                </div>
                <StatusBadge status={isCritical ? 'critical' : isWarning ? 'warning' : 'normal'} />
              </div>

              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                {bin.location}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
                Stream: <strong>{bin.waste_type}</strong>
              </div>

              {/* Animated Fill Level Meter */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 5 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Fill Capacity</span>
                  <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: fillColor }}>
                    {bin.fill_pct}%
                  </span>
                </div>
                <div style={{ height: 9, background: '#e8eee9', borderRadius: 999, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${bin.fill_pct}%`,
                      background: fillColor,
                      borderRadius: 999,
                      transition: 'width 0.8s ease'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--surface-border)', paddingTop: 12 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Emptied: {bin.last_emptied}
                </div>
                <button
                  className={`btn btn-sm ${isCritical ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => openDispatch(bin)}
                >
                  <Truck size={13} /> {isCritical ? 'Urgent Dispatch' : 'Schedule'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dispatch Modal */}
      <Modal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        title={`Dispatch Collection — Bin #${selectedBin?.id}`}
        icon={Truck}
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setDispatchModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleConfirmDispatch}>
              Confirm Dispatch
            </button>
          </>
        }
      >
        {selectedBin && (
          <div>
            <div style={{ marginBottom: 14, padding: 12, background: '#f8faf9', borderRadius: 8 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedBin.location}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Zone: {selectedBin.zone} • Waste Stream: {selectedBin.waste_type}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedBin.fill_pct >= 90 ? 'var(--color-critical)' : 'var(--color-amber)', marginTop: 4 }}>
                Current Fill: {selectedBin.fill_pct}%
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Assigned Vehicle</label>
              <select className="form-select">
                <option>Electric Van V-03 (Alex Rivera) — 0.6 km away</option>
                <option>Compactor Truck V-01 (Sarah Chen) — 1.8 km away</option>
                <option>Cargo Trike V-05 (Marcus Brody) — 2.1 km away</option>
              </select>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="form-label">Dispatch Urgency</label>
              <select className="form-select" defaultValue={selectedBin.fill_pct >= 90 ? 'critical' : 'high'}>
                <option value="critical">Critical (Immediate Route Override)</option>
                <option value="high">High Priority</option>
                <option value="standard">Standard Route Next Stop</option>
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
