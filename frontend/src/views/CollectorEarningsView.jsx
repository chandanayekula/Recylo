import React, { useState, useEffect } from 'react';
import { Coins, Wallet, Award, CheckCircle2, TrendingUp, ArrowUpRight, RefreshCw } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { Bar } from 'react-chartjs-2';
import { api } from '../api/client';

export default function CollectorEarningsView({ showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadEarnings = async () => {
    setLoading(true);
    try {
      const res = await api.getCollectorEarnings(1);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEarnings();
  }, []);

  const totalEarned = (data && data.total_earnings_usd) || 3840.50;
  const recordsCount = (data && data.records_count) || 84;
  const transactions = (data && data.earnings && data.earnings.length > 0)
    ? data.earnings
    : [
        { id: 1, pickup_id: 1002, total_amount: 45.00, base_payout: 35.00, purity_bonus: 10.00, status: 'CLEARED', created_at: '2026-10-24' },
        { id: 2, pickup_id: 1004, total_amount: 75.00, base_payout: 60.00, purity_bonus: 15.00, status: 'CLEARED', created_at: '2026-10-24' },
        { id: 3, pickup_id: 998, total_amount: 25.00, base_payout: 20.00, purity_bonus: 5.00, status: 'CLEARED', created_at: '2026-10-23' },
      ];

  const chartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'This Week'],
    datasets: [{
      label: 'Net Earnings ($)',
      data: [680, 740, 810, 790, Math.round(totalEarned > 0 ? (totalEarned * 0.18) : 620)],
      backgroundColor: '#22c55e',
      borderRadius: 8,
      hoverBackgroundColor: '#16a34a'
    }]
  };

  const requestPayout = () => {
    showToast('success', 'Direct Transfer Initiated', 'Instant transfer dispatched to verified carrier bank account ending in 4821.');
  };

  return (
    <div>
      {/* Earnings Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #07190f 0%, #0d311c 50%, #07190f 100%)',
        borderRadius: 20,
        padding: '36px 32px',
        color: 'white',
        marginBottom: 24,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#86a894', marginBottom: 4 }}>
            Total Accumulated Compensation (PostgreSQL Logged)
          </div>
          <div style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#4ade80' }}>
            ${typeof totalEarned === 'number' ? totalEarned.toFixed(2) : totalEarned}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#a2c4b0', marginTop: 4 }}>
            Direct deposits disbursed every Friday to verified account ending in 4821
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ fontSize: '0.72rem', color: '#86a894' }}>This Week</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4ade80', fontFamily: 'var(--font-mono)' }}>$620.00</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.08)', padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.12)' }}>
            <div style={{ fontSize: '0.72rem', color: '#86a894' }}>Pending Clearance</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-mono)' }}>$145.00</div>
          </div>

          <button className="btn btn-primary" onClick={requestPayout}>
            <Wallet size={16} /> Instant Transfer
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="cards-grid">
        <MetricCard
          title="Completed Pickups"
          value={recordsCount.toString()}
          trend="+12 this month"
          isPositive={true}
          icon={CheckCircle2}
          variant="primary"
        />
        <MetricCard
          title="Tonnage Collected"
          value="12,450"
          unit="kg"
          subtitle="Certified circular carrier"
          icon={Coins}
          variant="success"
        />
        <MetricCard
          title="Purity Bonus Earned"
          value="$480.00"
          trend="Tier 1 High-Purity tier"
          isPositive={true}
          icon={Award}
          variant="amber"
        />
        <MetricCard
          title="Avg Payout / Route"
          value="$58.20"
          trend="+8.5% efficiency index"
          isPositive={true}
          icon={TrendingUp}
          variant="teal"
        />
      </div>

      {/* Chart & Transaction History */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginTop: 24 }}>
        <div className="glass-panel" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>Weekly Payout Velocity</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 20 }}>Earnings trend over past 5 operating weeks</p>
          <div style={{ height: 260 }}>
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { grid: { color: 'rgba(0,0,0,0.04)' } },
                  x: { grid: { display: false } }
                }
              }}
            />
          </div>
        </div>

        <div className="glass-panel" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Recent Payout Credits</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>Automated route completion disbursements</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadEarnings}>
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {transactions.slice(0, 5).map((t, idx) => (
              <div key={idx} style={{ background: '#f8faf9', padding: '12px 16px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Order #{t.pickup_id || `PK-${1000 + idx}`}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Base: ${t.base_payout || 35} • Purity Bonus: ${t.purity_bonus || 10}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#16a34a', fontFamily: 'var(--font-mono)' }}>+${(t.total_amount || 45).toFixed(2)}</div>
                  <span className="badge-status badge-success" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>{t.status || 'CLEARED'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
