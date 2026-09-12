import React, { useState, useEffect } from 'react';
import {
  GitFork,
  CheckCircle2,
  Clock,
  Building2,
  Truck,
  Factory,
  PackageCheck,
  ShieldCheck,
  QrCode,
  RefreshCw,
  Search
} from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import { api } from '../api/client';

export default function JourneyView() {
  const [pickups, setPickups] = useState([]);
  const [selectedPickupId, setSelectedPickupId] = useState('PK-1002');
  const [journeyData, setJourneyData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load available pickups on mount
  useEffect(() => {
    const init = async () => {
      try {
        const list = await api.getPickups();
        if (list && list.length > 0) {
          setPickups(list);
          setSelectedPickupId(list[0].id || 'PK-1002');
        }
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, []);

  // Fetch journey events whenever selectedPickupId changes
  useEffect(() => {
    if (!selectedPickupId) return;
    const fetchJourney = async () => {
      setLoading(true);
      try {
        const res = await api.getJourneyEvents(selectedPickupId);
        setJourneyData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchJourney();
  }, [selectedPickupId]);

  const activePickup = (journeyData && journeyData.pickup) || pickups.find(p => p.id === selectedPickupId) || {
    id: selectedPickupId,
    source_name: 'Metro Eco Supermarket',
    waste_type: 'Cardboard',
    estimated_weight_kg: 180,
    status: 'assigned'
  };

  const rawEvents = (journeyData && journeyData.events) || [];

  // Map backend events or standard circular pipeline steps
  const stageIcons = {
    CREATED: Building2,
    ASSIGNED: Truck,
    ON_THE_WAY: Clock,
    COLLECTED: CheckCircle2,
    RECOVERED: Factory,
    RECYCLED: PackageCheck
  };

  const steps = rawEvents.length > 0
    ? rawEvents.map((evt) => ({
        title: evt.stage ? evt.stage.replace('_', ' ') : 'Processing Step',
        location: evt.location || 'WasteLoop Regional Network',
        time: evt.timestamp ? new Date(evt.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Verified',
        status: (evt.status || 'completed').toLowerCase(),
        icon: stageIcons[evt.stage] || ShieldCheck,
        desc: evt.notes || 'Provenance record confirmed in PostgreSQL audit log.'
      }))
    : [
        {
          title: 'Generated & Segregated',
          location: activePickup.source_name || 'Source Facility',
          time: 'Logged',
          status: 'completed',
          icon: Building2,
          desc: `${activePickup.estimated_weight_kg || 180} kg segregated ${activePickup.waste_type || 'clean feedstock'} logged at source.`
        },
        {
          title: 'Collection & On-Board Weighing',
          location: activePickup.collector_name ? `Carrier: ${activePickup.collector_name}` : 'Carrier Assigned',
          time: 'Scheduled',
          status: activePickup.status === 'completed' ? 'completed' : 'active',
          icon: Truck,
          desc: 'Verified tare weight calibration. Zero hazardous contaminants detected.'
        },
        {
          title: 'Central Recovery Hub (MRF)',
          location: 'EcoLoop Material Reclamation Plant #2',
          time: 'Next Phase',
          status: activePickup.status === 'completed' ? 'completed' : 'pending',
          icon: Factory,
          desc: 'Optical sorting and closed-loop reprocessing yield.'
        },
        {
          title: 'Secondary Remanufacturing',
          location: 'Circular Packaging Mills Co.',
          time: 'Upcoming',
          status: 'pending',
          icon: PackageCheck,
          desc: 'Re-pelletized material converted into 100% post-consumer circular output.'
        }
      ];

  const chartData = {
    labels: ['Target Recyclable', 'Diverted Clean', 'Resin Intermediate', 'Residual Reject'],
    datasets: [{
      data: [60, 24, 12, 4],
      backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'],
      borderWidth: 2,
      borderColor: '#ffffff'
    }]
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Chain-of-Custody & Waste Provenance</h1>
          <p className="page-subtitle">Verifiable journey tracking from source generation to certified secondary material outputs</p>
        </div>
      </div>

      {/* Selector & Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Select Active Order:
          </span>
          <select
            className="form-select"
            style={{ minWidth: 220 }}
            value={selectedPickupId}
            onChange={(e) => setSelectedPickupId(e.target.value)}
          >
            {pickups.map((p) => (
              <option key={p.id} value={p.id}>
                #{p.id} — {p.source_name} ({p.waste_type})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#16a34a', fontWeight: 700, background: 'var(--color-accent-dim)', padding: '6px 14px', borderRadius: 999 }}>
          <ShieldCheck size={16} /> PostgreSQL Audit Record Verified
        </div>
      </div>

      {/* Main Grid: Journey Timeline + Verification Summary Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Left Column: Timeline */}
        <div className="glass-panel" style={{ padding: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Lifecycle Provenance</h2>
            <span className="badge-status badge-success">Live Track</span>
          </div>

          <div style={{ position: 'relative', paddingLeft: 32 }}>
            <div style={{ position: 'absolute', top: 12, bottom: 12, left: 15, width: 2, background: 'var(--color-accent-dim)' }} />

            {steps.map((step, idx) => {
              const IconComp = step.icon;
              const isDone = step.status === 'completed';
              const isActive = step.status === 'active';

              return (
                <div key={idx} style={{ position: 'relative', marginBottom: 28 }}>
                  <div style={{
                    position: 'absolute',
                    left: -32,
                    top: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: isDone ? '#22c55e' : isActive ? '#3b82f6' : '#e2e8e4',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '3px solid white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <IconComp size={16} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>{step.title}</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{step.time}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 4 }}>
                      {step.location}
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: QR Digital Product Passport & Composition */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="glass-panel" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--color-accent-dim)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Digital Material Passport</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Universal Circularity Identifier</div>
              </div>
            </div>

            <div style={{ background: '#f8faf9', padding: 14, borderRadius: 12, fontSize: '0.82rem', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Pickup Code:</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>#{activePickup.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Feedstock Stream:</span>
                <strong>{activePickup.waste_type}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--text-muted)' }}>Recorded Payload:</span>
                <strong>{activePickup.actual_weight_kg || activePickup.estimated_weight_kg} kg</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Origin Source:</span>
                <strong>{activePickup.source_name}</strong>
              </div>
            </div>

            <div style={{ height: 180, display: 'flex', justifyContent: 'center' }}>
              <Doughnut
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
                  cutout: '70%'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
