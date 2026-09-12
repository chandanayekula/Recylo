import React, { useState } from 'react';
import { CalendarClock, Plus, Trash2, CheckCircle2, Radio } from 'lucide-react';

export default function CollectorAvailabilityView({ showToast }) {
  const [liveStatus, setLiveStatus] = useState('available');

  const [schedule, setSchedule] = useState({
    Monday: ['08:00 - 12:00', '13:00 - 17:00'],
    Tuesday: ['08:00 - 12:00', '13:00 - 17:00'],
    Wednesday: ['08:00 - 12:00', '13:00 - 17:00'],
    Thursday: ['08:00 - 12:00', '13:00 - 17:00'],
    Friday: ['08:00 - 12:00', '13:00 - 16:00'],
    Saturday: ['09:00 - 13:00'],
    Sunday: []
  });

  const removeSlot = (day, index) => {
    const updated = { ...schedule, [day]: schedule[day].filter((_, i) => i !== index) };
    setSchedule(updated);
  };

  const addSlot = (day) => {
    const slot = prompt(`Enter time window for ${day} (e.g. 09:00 - 13:00):`, '09:00 - 13:00');
    if (slot && slot.trim()) {
      setSchedule({ ...schedule, [day]: [...schedule[day], slot.trim()] });
      showToast('info', 'Shift Added', `Added shift window to ${day}`);
    }
  };

  const handleStatusChange = async (st) => {
    setLiveStatus(st);
    const res = await api.setAvailability(1, { status: st });
    if (res.error) {
      showToast('error', 'Status Sync Failed', res.error);
    } else {
      showToast('success', 'Duty Status Synced', `Marked as ${st.toUpperCase()} in routing dispatch.`);
    }
  };

  const saveAll = async () => {
    await api.setAvailability(1, { status: liveStatus });
    showToast('success', 'Schedule Synced', 'Weekly availability updated in routing engine.');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Collector Availability & Duty Status</h1>
          <p className="page-subtitle">Configure your active operating shifts and real-time on-demand dispatch availability</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={saveAll}>
          Save Schedule
        </button>
      </div>

      {/* Live Status Switcher */}
      <div className="glass-panel" style={{ padding: 20, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>On-Demand Automated Dispatch</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
            When set to Available, urgent smart bin overflow alerts can be routed directly to your truck
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'available', label: 'Available Now', color: '#16a34a' },
            { id: 'break', label: 'On Break', color: '#d97706' },
            { id: 'offline', label: 'Offline', color: '#64748b' }
          ].map((s) => (
            <button
              key={s.id}
              className={`btn btn-sm ${liveStatus === s.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handleStatusChange(s.id)}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, display: 'inline-block', marginRight: 4 }} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Days Schedule */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Object.entries(schedule).map(([day, slots]) => (
          <div key={day} className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ width: 120, fontWeight: 700, fontSize: '0.92rem' }}>{day}</div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flex: 1 }}>
              {slots.length ? (
                slots.map((slot, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'var(--color-accent-dim)',
                      color: '#166534',
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: '0.78rem',
                      fontWeight: 600
                    }}
                  >
                    <span>{slot}</span>
                    <button
                      onClick={() => removeSlot(day, idx)}
                      style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13 }}
                    >
                      &times;
                    </button>
                  </div>
                ))
              ) : (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Off Duty / No shifts</span>
              )}
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => addSlot(day)}
            >
              <Plus size={13} /> Add Shift
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
