import React, { useState, useEffect } from 'react';
import { Building2, Plus, Search, MapPin, Award } from 'lucide-react';
import { api } from '../api/client';
import Modal from '../components/Modal';

export default function SourcesView({ showToast }) {
  const [sources, setSources] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Commercial');
  const [address, setAddress] = useState('');

  const loadSources = async () => {
    const list = await api.getSources();
    setSources(list || []);
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleAddSource = async (e) => {
    e.preventDefault();
    const res = await api.createSource({
      name: name.trim(),
      category: category.trim(),
      address: address.trim(),
      monthly_volume_kg: 2500,
      contact_phone: '+1 (555) 0123'
    });

    if (res.error) {
      showToast('error', 'Registration Failed', res.error);
    } else {
      showToast('success', 'Source Registered', `${name} added to circular network.`);
      setModalOpen(false);
      setName('');
      setAddress('');
      await loadSources();
    }
  };

  const filtered = sources.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Waste Sources & Generators</h1>
          <p className="page-subtitle">Commercial, industrial, and residential partners generating segregated recyclable feedstocks</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Register Generator
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="search-input-wrap">
          <Search size={15} />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search facilities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
        {filtered.map((s) => (
          <div key={s.id} className="glass-panel" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--color-accent-dim)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={20} />
              </div>
              <span className="badge-status badge-info">{s.category}</span>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>{s.name}</h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14 }}>
              <MapPin size={13} /> {s.address}
            </div>

            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Volume: </span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{s.monthly_volume_kg.toLocaleString()} kg</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Purity: </span>
                <strong style={{ color: '#16a34a' }}>{s.segregation_score}%</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Register Waste Source"
        icon={Building2}
        footer={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleAddSource}>Register</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label className="form-label">Organization / Facility Name</label>
            <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="form-label">Sector</label>
            <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
              <option>Commercial</option>
              <option>Hospitality</option>
              <option>Corporate Tech</option>
              <option>Residential</option>
              <option>Industrial</option>
            </select>
          </div>
          <div>
            <label className="form-label">Physical Address</label>
            <input type="text" className="form-control" value={address} onChange={e => setAddress(e.target.value)} required />
          </div>
        </div>
      </Modal>
    </div>
  );
}
