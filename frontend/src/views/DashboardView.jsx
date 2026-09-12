import React, { useState, useEffect } from 'react';
import {
  Scale,
  Sparkles,
  AlertOctagon,
  Truck,
  TrendingUp,
  Percent,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  Award
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { api } from '../api/client';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut, Bar, Radar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardView({ onNavigate, showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getDashboard();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !data) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="animate-spin" style={{ marginBottom: 12 }} />
        <div>Connecting to WasteLoop telemetry engine...</div>
      </div>
    );
  }

  const m = data?.metrics || {};
  const weeklyTrend = data?.weekly_trend || {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    collected: [2100, 2450, 2800, 3100, 2900, 3400, 3800],
    diverted:  [1900, 2200, 2600, 2900, 2750, 3200, 3550]
  };
  const composition = data?.composition || {
    labels: ['Plastics (PET/HDPE)', 'Organics', 'Cardboard & Paper', 'Metals & Aluminum', 'E-Waste'],
    data: [32, 28, 20, 14, 6],
    colors: ['#22c55e', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6']
  };
  const aiInsights = data?.ai_insights || [];

  // Line Chart Data
  const lineChartData = {
    labels: weeklyTrend.labels,
    datasets: [
      {
        label: 'Collected (kg)',
        data: weeklyTrend.collected,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5
      },
      {
        label: 'Landfill Diverted (kg)',
        data: weeklyTrend.diverted,
        borderColor: '#14b8a6',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.35,
        borderWidth: 2
      }
    ]
  };

  // Doughnut Composition Data
  const doughnutData = {
    labels: composition.labels,
    datasets: [{
      data: composition.data,
      backgroundColor: composition.colors,
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 6
    }]
  };

  // Radar Efficiency Data
  const radarData = {
    labels: ['Collection Speed', 'Purity Rate', 'Fuel Efficiency', 'Sensor Uptime', 'Reclamation %'],
    datasets: [{
      label: 'Performance Index',
      data: [92, 94, 88, 99, 91],
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      borderColor: '#22c55e',
      pointBackgroundColor: '#22c55e'
    }]
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title gradient-text">Operations Intelligence</h1>
          <p className="page-subtitle">Real-time telemetry, predictive bin overflow AI, and closed-loop circular metrics</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={loadData}>
            <RefreshCw size={14} /> Refresh Stream
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => onNavigate('pickups')}>
            <Truck size={14} /> Dispatch Center
          </button>
        </div>
      </div>

      {/* Critical Smart Bin Alert Banner */}
      {m.critical_bins_count > 0 && (
        <div className="critical-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'var(--color-critical)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              flexShrink: 0
            }}>
              <AlertOctagon size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '0.98rem' }}>
                CRITICAL OVERFLOW ALERT — {m.critical_bins_count} Smart Bin{m.critical_bins_count > 1 ? 's' : ''} at &gt;90% Capacity
              </div>
              <div style={{ fontSize: '0.82rem', color: '#b91c1c' }}>
                Automated route optimization triggered. Immediate collector dispatch recommended.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => onNavigate('bins')}
            >
              Dispatch Collector Now <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="cards-grid">
        <MetricCard
          title="Total Recovered"
          value={m.total_collected_kg ? m.total_collected_kg.toLocaleString() : '18,450'}
          unit="kg"
          trend={`+${m.collected_trend_pct}% vs last wk`}
          isPositive={true}
          icon={Scale}
          variant="success"
        />
        <MetricCard
          title="Segregation Purity"
          value={`${m.segregation_rate_pct || 91.8}%`}
          trend="+2.4% compliance"
          isPositive={true}
          icon={Percent}
          variant="primary"
        />
        <MetricCard
          title="Active Pickups"
          value={m.active_pickups || 16}
          subtitle="4 in transit • 12 scheduled"
          icon={Truck}
          variant="teal"
        />
        <MetricCard
          title="Critical Smart Bins"
          value={m.critical_bins_count || 2}
          trend="Bin #B-104 (92%), #B-107 (88%)"
          isPositive={false}
          icon={AlertOctagon}
          variant="critical"
        />
      </div>

      {/* Row 2: Charts + Circularity Gauge */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Weekly Trend Line Chart */}
        <div className="glass-panel" style={{ padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Weekly Inflow & Landfill Diversion</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Daily volume (kg) collected vs secondary processing diversion</p>
            </div>
            <span className="badge-status badge-success"><span className="badge-status-dot" />Live Stream</span>
          </div>
          <div style={{ height: 260 }}>
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { boxWidth: 12 } } },
                scales: {
                  y: { grid: { color: 'rgba(0,0,0,0.05)' } },
                  x: { grid: { display: false } }
                }
              }}
            />
          </div>
        </div>

        {/* Circularity Index Ring & Breakdown */}
        <div className="glass-panel" style={{ padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Award size={20} color="#22c55e" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Circularity Index</h3>
              </div>
              <span className="badge-status badge-info">Tier 1 Certified</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, margin: '14px 0' }}>
              {/* SVG Ring Gauge */}
              <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8e4"
                    strokeWidth="3.2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="3.2"
                    strokeDasharray="88, 100"
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>88%</span>
                  <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Loop Score</span>
                </div>
              </div>

              <div style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Closed-loop index derived from segregation fidelity, landfill diversion volume, and low transit emissions.
                <div style={{ marginTop: 8, fontWeight: 700, color: 'var(--color-accent)' }}>
                  +5.4% improvement this quarter
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>CO2 Avoided</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>24.2 MT</div>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Water Saved</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>142,000 L</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Doughnut + Radar + AI Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Stream Composition */}
        <div className="glass-panel" style={{ padding: 22 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>Material Composition</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>Distribution across recyclable streams</p>
          <div style={{ height: 210 }}>
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } } }
              }}
            />
          </div>
        </div>

        {/* Radar Performance */}
        <div className="glass-panel" style={{ padding: 22 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4 }}>Operational Health</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>Multi-axis metric balance</p>
          <div style={{ height: 210 }}>
            <Radar
              data={radarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { r: { ticks: { display: false }, min: 50, max: 100 } }
              }}
            />
          </div>
        </div>

        {/* AI Predictive Insights Drawer */}
        <div className="glass-panel" style={{ padding: 22, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Sparkles size={18} color="#22c55e" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>AI Predictive Insights</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            {aiInsights.map((ins) => (
              <div
                key={ins.id}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: ins.urgency === 'critical' ? '#fef2f2' : '#f0fdf4',
                  border: `1px solid ${ins.urgency === 'critical' ? '#fecaca' : '#bbf7d0'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: ins.urgency === 'critical' ? '#991b1b' : '#166534' }}>
                    {ins.title}
                  </span>
                  <span className={`badge-status ${ins.urgency === 'critical' ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '10px' }}>
                    {ins.urgency}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#4b5563', lineHeight: 1.4 }}>
                  {ins.text}
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: ins.urgency === 'critical' ? '#dc2626' : '#16a34a', marginTop: 6 }}>
                  Action: {ins.recommended_action}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
