import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import ToastContainer from './components/Toast';
import { api } from './api/client';

// Views
import AuthView from './views/AuthView';
import DashboardView from './views/DashboardView';
import SmartBinsView from './views/SmartBinsView';
import PickupsView from './views/PickupsView';
import MapView from './views/MapView';
import JourneyView from './views/JourneyView';
import RecoveryView from './views/RecoveryView';
import SustainabilityView from './views/SustainabilityView';
import SourcesView from './views/SourcesView';
import VehiclesView from './views/VehiclesView';
import CollectorsView from './views/CollectorsView';
import CollectorJobsView from './views/CollectorJobsView';
import CollectorAvailableJobsView from './views/CollectorAvailableJobsView';
import CollectorAvailabilityView from './views/CollectorAvailabilityView';
import CollectorEarningsView from './views/CollectorEarningsView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentRole, setCurrentRole] = useState('admin');
  const [currentUser, setCurrentUser] = useState(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [toasts, setToasts] = useState([]);

  // ── Check existing session on load ──────────────────────────
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await api.getCurrentUser();
        // api client already unwraps Flask envelope — data IS the user object
        const user = data && data.id ? data : null;
        if (!error && user) {
          const role = (user.role || 'GENERATOR').toLowerCase();
          setCurrentUser(user);
          setCurrentRole(role);
          setIsAuthenticated(true);
          setDefaultView(role);
        }
      } catch (_) {
        // Backend not reachable or not logged in — go to auth page
      } finally {
        setAuthChecked(true);
      }
    };
    checkSession();
  }, []);

  const setDefaultView = (role) => {
    if (role === 'collector') setActiveView('collector_jobs');
    else if (role === 'generator') setActiveView('sources');
    else setActiveView('dashboard');
  };

  const showToast = (type, title, message) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRoleChange = (newRole) => {
    setCurrentRole(newRole);
    setDefaultView(newRole);
    showToast('info', 'Workspace Switched', `Now viewing as ${newRole.toUpperCase()}`);
  };

  // Called by AuthView after a successful API login/register
  const handleLogin = (roleStr, user) => {
    const role = roleStr.toLowerCase();
    setCurrentRole(role);
    setCurrentUser(user || null);
    setIsAuthenticated(true);
    setDefaultView(role);
    showToast('success', 'Authenticated', `Signed in as ${role.toUpperCase()}`);
  };

  const handleLogout = async () => {
    await api.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentRole('admin');
    showToast('info', 'Signed Out', 'Returned to portal.');
  };

  // Show nothing until session check completes (avoids flash)
  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#071910' }}>
        <div style={{ textAlign: 'center', color: '#4ade80' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(74,222,128,0.25)', borderTopColor: '#4ade80', borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 14px' }} />
          <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
          <div style={{ fontSize: '0.85rem', color: '#4d6b57' }}>Loading WasteLoop…</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthView onLogin={handleLogin} />;
  }

  // Render view by activeView
  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onNavigate={setActiveView} showToast={showToast} />;
      case 'bins':
        return <SmartBinsView onNavigate={setActiveView} showToast={showToast} />;
      case 'pickups':
        return <PickupsView showToast={showToast} />;
      case 'map':
        return <MapView showToast={showToast} />;
      case 'journey':
        return <JourneyView />;
      case 'recovery':
        return <RecoveryView />;
      case 'sustainability':
        return <SustainabilityView showToast={showToast} />;
      case 'sources':
        return <SourcesView showToast={showToast} />;
      case 'vehicles':
        return <VehiclesView />;
      case 'collectors':
        return <CollectorsView />;
      case 'collector_jobs':
        return <CollectorJobsView onNavigate={setActiveView} showToast={showToast} />;
      case 'collector_available':
        return <CollectorAvailableJobsView onNavigate={setActiveView} showToast={showToast} />;
      case 'collector_availability':
        return <CollectorAvailabilityView showToast={showToast} />;
      case 'collector_earnings':
        return <CollectorEarningsView showToast={showToast} />;
      default:
        return <DashboardView onNavigate={setActiveView} showToast={showToast} />;
    }
  };

  return (
    <div className="app-shell">
      {/* Dynamic Role-Aware Sidebar */}
      <Sidebar
        currentRole={currentRole}
        currentUser={currentUser}
        activeView={activeView}
        setActiveView={setActiveView}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className={`app-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
        <Topbar
          activeView={activeView}
          currentRole={currentRole}
          currentUser={currentUser}
          setCurrentRole={handleRoleChange}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
          onRefresh={() => showToast('info', 'Stream Refreshed', 'Synced with WasteLoop telemetry')}
        />

        <div className="app-content">
          {renderActiveView()}
        </div>
      </main>

      {/* Floating Toast Notification Stack */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
