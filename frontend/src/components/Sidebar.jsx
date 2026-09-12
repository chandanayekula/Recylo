import React from 'react';
import {
  LayoutDashboard,
  Trash2,
  Truck,
  MapPin,
  GitFork,
  Recycle,
  TreePine,
  Car,
  Users,
  Building2,
  Briefcase,
  ClipboardList,
  CalendarClock,
  Coins,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({
  currentRole,
  currentUser,
  activeView,
  setActiveView,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  onLogout
}) {
  // Navigation menus configured per role
  const adminNav = [
    { section: 'Overview' },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { section: 'Operations' },
    { id: 'bins', label: 'Smart Bins', icon: Trash2, badge: '92% Alert', badgeColor: 'critical' },
    { id: 'pickups', label: 'Pickups', icon: Truck, badge: '4' },
    { id: 'sources', label: 'Waste Sources', icon: Building2 },
    { id: 'collectors', label: 'Collectors', icon: Users },
    { id: 'vehicles', label: 'Vehicle Fleet', icon: Car },
    { section: 'Intelligence' },
    { id: 'map', label: 'Collection Map', icon: MapPin },
    { id: 'journey', label: 'Waste Journey', icon: GitFork },
    { id: 'recovery', label: 'Recovery Analytics', icon: Recycle },
    { id: 'sustainability', label: 'Sustainability ESG', icon: TreePine },
  ];

  const generatorNav = [
    { section: 'My Account' },
    { id: 'sources', label: 'My Sources', icon: Building2 },
    { id: 'pickups', label: 'My Pickups', icon: Truck },
    { id: 'journey', label: 'Waste Journey', icon: GitFork },
    { id: 'sustainability', label: 'Our ESG Impact', icon: TreePine },
  ];

  const collectorNav = [
    { section: 'My Shifts & Routes' },
    { id: 'collector_jobs', label: 'Assigned Jobs', icon: Briefcase, badge: '2 Active' },
    { id: 'collector_available', label: 'Available Pool', icon: ClipboardList },
    { id: 'collector_availability', label: 'My Availability', icon: CalendarClock },
    { section: 'Tools' },
    { id: 'map', label: 'Route Map', icon: MapPin },
    { id: 'journey', label: 'Journey Timeline', icon: GitFork },
    { id: 'collector_earnings', label: 'Earnings & Payouts', icon: Coins },
  ];

  const navItems = currentRole === 'admin' ? adminNav : currentRole === 'collector' ? collectorNav : generatorNav;

  const handleNavClick = (id) => {
    setActiveView(id);
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-logo-area">
        <div className="sidebar-logo-icon">
          <Recycle size={22} strokeWidth={2.4} />
        </div>
        {!collapsed && (
          <div>
            <div className="sidebar-brand-name">
              Waste<span>Loop</span>
            </div>
            <div className="sidebar-tagline">Circular Platform</div>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <div className="sidebar-nav-scroll">
        {navItems.map((item, idx) => {
          if (item.section) {
            if (collapsed) return null;
            return <div key={`sec-${idx}`} className="sidebar-group-title">{item.section}</div>;
          }

          const IconComponent = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              className={`nav-link-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <IconComponent size={19} strokeWidth={isActive ? 2.2 : 1.8} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && (
                <span className={`nav-link-badge ${item.badgeColor === 'critical' ? 'badge-critical' : ''}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse Toggle */}
      <div style={{ padding: '8px 14px', display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end' }}>
        <button
          className="icon-button"
          style={{ width: 32, height: 32, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#9cb5a6' }}
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* User Profile Footer */}
      <div className="sidebar-footer-area">
        <div className="sidebar-user-avatar">
          {(currentUser?.name || currentRole).charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="sidebar-user-meta">
            <div className="sidebar-user-name">
              {currentUser?.name || (currentRole === 'admin' ? 'Administrator' : currentRole === 'collector' ? 'Collector' : 'Generator')}
            </div>
            <div className="sidebar-user-role">
              {currentUser?.email || `${currentRole} portal`}
            </div>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={onLogout}
            style={{ background: 'transparent', border: 'none', color: '#7c9485', cursor: 'pointer', marginLeft: 'auto' }}
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
