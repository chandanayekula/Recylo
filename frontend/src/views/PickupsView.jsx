import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, Filter, CheckCircle2, UserCheck, Clock, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';

export default function PickupsView({ showToast }) {
  const [pickups, setPickups] = useState([]);
  const [sources, setSources] = useState([]);
  const [collectors, setCollectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [selectedCollectorId, setSelectedCollectorId] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // New pickup form state
  const [selectedSourceId, setSelectedSourceId] = useState('');
  const [newStream, setNewStream] = useState('Plastics');
  const [newWeight, setNewWeight] = useState(150);
  const [scheduledTime, setScheduledTime] = useState('Today 3:00 PM');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [pickupsRes, sourcesRes, collectorsRes] = await Promise.all([
        api.getPickups(),
        api.getSources(),
        api.getCollectors()
      ]);
      setPickups(pickupsRes || []);
      setSources(sourcesRes || []);
      setCollectors(collectorsRes || []);

      if (sourcesRes && sourcesRes.length > 0 && !selectedSourceId) {
        setSelectedSourceId(sourcesRes[0].id);
      }
      if (collectorsRes && collectorsRes.length > 0 && !selectedCollectorId) {
        setSelectedCollectorId(collectorsRes[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAssignModal = (pickup) => {
    setSelectedPickup(pickup);
    if (collectors.length > 0) {
      setSelectedCollectorId(collectors[0].id);
    }
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedPickup || !selectedCollectorId) return;
    const col = collectors.find(c => String(c.id) === String(selectedCollectorId));
    const collectorName = col ? col.name : 'Collector';

    const res = await api.assignPickup(selectedPickup.id, {
      collector_id: selectedCollectorId,
      collector_name: collectorName,
      status: 'assigned'
    });

    if (res.error) {
      showToast('error', 'Assignment Failed', res.error);
    } else {
      showToast('success', 'Collector Assigned', `${collectorName} assigned to pickup #${selectedPickup.id}`);
      setAssignModalOpen(false);
      await loadData();
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSourceId) {
      showToast('error', 'Validation Error', 'Please select a source facility.');
      return;
    }

    const payload = {
      source_id: selectedSourceId,
      waste_type: newStream,
      estimated_weight_kg: Number(newWeight),
      scheduled_time: scheduledTime,
      notes: notes || 'Scheduled via WasteLoop Portal'
    };

    const res = await api.createPickup(payload);
    if (res.error) {
      showToast('error', 'Creation Failed', res.error);
    } else {
      const code = res.data?.id || res.data?.pickup_code || 'New';
      showToast('success', 'Pickup Scheduled', `Order #${code} created and queued for dispatch.`);
      setCreateModalOpen(false);
      await loadData();
    }
  };

  const filtered = (pickups || []).filter((p) => {
    const matchFilter = filter === 'all' || p.status === filter;
    const matchSearch = !search ||
      (p.id && p.id.toLowerCase().includes(search.toLowerCase())) ||
      (p.source_name && p.source_name.toLowerCase().includes(search.toLowerCase())) ||
      (p.waste_type && p.waste_type.toLowerCase().includes(search.toLowerCase()));
    return matchFilter && matchSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Pickup Management</h1>
          <p className="page-subtitle">Coordinate collection requests, dispatch vehicle assignments, and track live status in PostgreSQL</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setCreateModalOpen(true)}>
            <Plus size={15} /> Schedule Pickup
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrap">
          <Search size={15} />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search by ID, facility, or waste type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-chips">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'created', label: 'Pending' },
            { id: 'assigned', label: 'Assigned' },
            { id: 'on_the_way', label: 'In Transit' },
            { id: 'completed', label: 'Completed' }
          ].map((c) => (
            <button
              key={c.id}
              className={`filter-chip ${filter === c.id ? 'active' : ''}`}
              onClick={() => setFilter(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="data-table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Source Generator</th>
                <th>Waste Stream</th>
                <th>Weight</th>
                <th>Priority</th>
                <th>Assigned Carrier</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const isUnassigned = !p.collector_id || p.collector_name === 'Unassigned';
                return (
                  <tr key={p.id}>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--color-primary)' }}>
                        #{p.id}
                      </span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.scheduled_time || 'Immediate'}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.source_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.address}</div>
                    </td>
                    <td>
                      <span className="badge-status badge-info">{p.waste_type}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {p.actual_weight_kg || p.estimated_weight_kg} kg
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={p.priority} />
                    </td>
                    <td>
                      {isUnassigned ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
                          Unassigned
                        </span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Truck size={14} color="#16a34a" />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.collector_name}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td>
                      {isUnassigned ? (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => openAssignModal(p)}
                        >
                          <UserCheck size={13} /> Assign
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => openAssignModal(p)}
                        >
                          Reassign
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    No matching pickup orders found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Collector to Order #${selectedPickup?.id}`}
        icon={Truck}
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleAssignSubmit}>
              Confirm Dispatch
            </button>
          </>
        }
      >
        {selectedPickup && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#f8faf9', padding: 14, borderRadius: 12, fontSize: '0.85rem' }}>
              <div><strong>Facility:</strong> {selectedPickup.source_name} ({selectedPickup.address})</div>
              <div><strong>Payload:</strong> {selectedPickup.estimated_weight_kg} kg {selectedPickup.waste_type}</div>
              <div><strong>Current Status:</strong> {selectedPickup.status}</div>
            </div>

            <div>
              <label className="form-label">Select Registered Fleet Collector</label>
              <select
                className="form-select"
                value={selectedCollectorId}
                onChange={(e) => setSelectedCollectorId(e.target.value)}
              >
                {collectors.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.vehicle || 'Standard Vehicle'}) — {c.status?.toUpperCase() || 'AVAILABLE'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Schedule Collection Order"
        icon={Plus}
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleCreateSubmit}>
              Schedule Pickup
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="form-label">Source Generator Facility</label>
            <select
              className="form-select"
              value={selectedSourceId}
              onChange={(e) => setSelectedSourceId(e.target.value)}
              required
            >
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.category} - {s.address})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Material Stream</label>
            <select
              className="form-select"
              value={newStream}
              onChange={(e) => setNewStream(e.target.value)}
            >
              <option value="Plastics">Plastics (PET / HDPE)</option>
              <option value="Cardboard">Cardboard & Packaging</option>
              <option value="Organics">Organic Compostables</option>
              <option value="E-Waste">E-Waste & Electronics</option>
              <option value="Metals">Aluminum & Scrap Metal</option>
            </select>
          </div>
          <div>
            <label className="form-label">Estimated Weight (kg)</label>
            <input
              type="number"
              className="form-control"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              min="1"
              required
            />
          </div>
          <div>
            <label className="form-label">Scheduled Time Window</label>
            <input
              type="text"
              className="form-control"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              placeholder="e.g. Today 2:00 PM or Immediate"
            />
          </div>
          <div>
            <label className="form-label">Handling Notes</label>
            <input
              type="text"
              className="form-control"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dock 4 entrance, clean baled cartons"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
