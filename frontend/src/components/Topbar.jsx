import React from 'react';
import { Menu, Search, Bell, RotateCcw, UserCheck, Shield, Sparkles } from 'lucide-react';

export default function Topbar({
  activeView,
  currentRole,
  setCurrentRole,
  mobileOpen,
  setMobileOpen,
  onRefresh
}) {
  const roleNames = {
    admin: 'Administrator',
    generator: 'Waste Generator',
    collector: 'Collector Fleet'
  };

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        {/* Mobile Menu Toggle */}
        <button
          className="icon-button d-md-none"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>

        {/* Search */}
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            className="search-input-field"
            placeholder="Search bins, pickups, trucks..."
          />
        </div>
      </div>

      <div className="topbar-right">
        {/* Quick Role Switcher for Hackathon Testing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Role:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '4px 10px', fontSize: '0.78rem', fontWeight: 600 }}
            value={currentRole}
            onChange={(e) => setCurrentRole(e.target.value)}
          >
            <option value="admin">Admin Portal</option>
            <option value="collector">Collector Fleet</option>
            <option value="generator">Waste Generator</option>
          </select>
        </div>

        {/* Refresh button */}
        <button
          className="icon-button"
          onClick={onRefresh}
          title="Refresh live data"
        >
          <RotateCcw size={17} />
        </button>

        {/* Notifications */}
        <button
          className="icon-button"
          style={{ position: 'relative' }}
          title="Critical Alerts (2 unread)"
        >
          <Bell size={18} />
          <span
            style={{
              position: 'absolute',
              top: 7,
              right: 7,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--color-critical)'
            }}
          />
        </button>

        {/* Role Badge Indicator */}
        <div className="role-switcher-badge">
          <Shield size={13} />
          <span>{currentRole}</span>
        </div>
      </div>
    </header>
  );
}
