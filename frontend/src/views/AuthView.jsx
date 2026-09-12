import React, { useState, useEffect } from 'react';
import { api } from '../api/client';

// ── Role config ─────────────────────────────────────────────
const ROLES = [
  { id: 'GENERATOR', label: 'Generator', icon: '🏭', desc: 'Waste-generating facility' },
  { id: 'COLLECTOR', label: 'Collector', icon: '🚛', desc: 'Collection operative' },
  { id: 'ADMIN',     label: 'Admin',     icon: '⚙️', desc: 'Platform operations' },
];

const DEMO = {
  ADMIN:     { email: 'admin@wasteloop.com',  password: 'admin123' },
  COLLECTOR: { email: 'ravi@wasteloop.com',   password: 'collector123' },
  GENERATOR: { email: 'user@wasteloop.com',   password: 'user123' },
};

// ── Input field ─────────────────────────────────────────────
function Field({ label, id, type = 'text', value, onChange, placeholder, required, error, hint }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label htmlFor={id} style={{ fontSize: '0.78rem', fontWeight: 600, color: '#a7c4b1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          autoComplete={isPassword ? 'current-password' : 'on'}
          style={{
            width: '100%',
            padding: isPassword ? '11px 44px 11px 14px' : '11px 14px',
            background: error ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.07)',
            border: `1.5px solid ${error ? 'rgba(239,68,68,0.55)' : 'rgba(255,255,255,0.13)'}`,
            borderRadius: 10,
            color: '#e8f5ec',
            fontSize: '0.93rem',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={e => { e.target.style.borderColor = '#4ade80'; e.target.style.boxShadow = '0 0 0 3px rgba(74,222,128,0.12)'; }}
          onBlur={e => { e.target.style.borderColor = error ? 'rgba(239,68,68,0.55)' : 'rgba(255,255,255,0.13)'; e.target.style.boxShadow = 'none'; }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#7a9b86', fontSize: '0.85rem', padding: 0 }}>
            {show ? '🙈' : '👁️'}
          </button>
        )}
      </div>
      {error && <span style={{ fontSize: '0.74rem', color: '#f87171' }}>{error}</span>}
      {hint && !error && <span style={{ fontSize: '0.74rem', color: '#6b8a76' }}>{hint}</span>}
    </div>
  );
}

// ── Spinner ─────────────────────────────────────────────────
function Spinner() {
  return (
    <span style={{ display: 'inline-block', width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', verticalAlign: 'middle', marginRight: 8 }} />
  );
}

// ── Main Auth View ───────────────────────────────────────────
export default function AuthView({ onLogin }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'

  // Login state
  const [loginEmail, setLoginEmail]       = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError]       = useState('');
  const [loginLoading, setLoginLoading]   = useState(false);

  // Register state
  const [regName, setRegName]           = useState('');
  const [regEmail, setRegEmail]         = useState('');
  const [regPassword, setRegPassword]   = useState('');
  const [regConfirm, setRegConfirm]     = useState('');
  const [regPhone, setRegPhone]         = useState('');
  const [regRole, setRegRole]           = useState('GENERATOR');
  const [regErrors, setRegErrors]       = useState({});
  const [regLoading, setRegLoading]     = useState(false);
  const [regSuccess, setRegSuccess]     = useState('');

  // Demo quick fill
  const fillDemo = (role) => {
    const d = DEMO[role];
    setLoginEmail(d.email);
    setLoginPassword(d.password);
    setLoginError('');
  };

  // ── Login submit ──────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter your email and password.');
      return;
    }
    setLoginLoading(true);
    setLoginError('');

    const { data, error } = await api.login(loginEmail.trim(), loginPassword);
    setLoginLoading(false);

    if (error || !data) {
      setLoginError(error || 'Login failed. Please check your credentials and try again.');
      return;
    }

    // api client already unwraps the Flask envelope, data IS the user object
    const user = data;
    const role = (user.role || 'GENERATOR').toLowerCase();
    onLogin(role, user);
  };

  // ── Register validation ───────────────────────────────────
  const validateReg = () => {
    const errs = {};
    if (!regName.trim())      errs.name     = 'Full name is required.';
    if (!regEmail.trim())     errs.email    = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(regEmail)) errs.email = 'Enter a valid email address.';
    if (!regPassword)         errs.password = 'Password is required.';
    else if (regPassword.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (regPassword !== regConfirm) errs.confirm = 'Passwords do not match.';
    return errs;
  };

  // ── Register submit ───────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = validateReg();
    if (Object.keys(errs).length) { setRegErrors(errs); return; }

    setRegLoading(true);
    setRegErrors({});
    setRegSuccess('');

    const { data, error } = await api.register(regName.trim(), regEmail.trim().toLowerCase(), regPassword, regRole, regPhone.trim());
    setRegLoading(false);

    if (error || !data) {
      setRegErrors({ api: error || 'Registration failed. Please try again.' });
      return;
    }

    // api client already unwraps the Flask envelope, data IS the user object
    const user = data;
    const role = (user.role || regRole).toLowerCase();
    setRegSuccess('Account created! Signing you in…');
    setTimeout(() => onLogin(role, user), 800);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #071910 0%, #0b2818 45%, #071910 100%)', position: 'relative', overflow: 'hidden', color: 'white', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* Keyframe styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes orb1 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(30px,-20px) scale(1.1);} }
        @keyframes orb2 { 0%,100%{transform:translate(0,0) scale(1);} 50%{transform:translate(-25px,15px) scale(0.95);} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px);} to{opacity:1;transform:translateY(0);} }
        @keyframes shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
        .auth-card { animation: fadeUp 0.45s ease both; }
        .tab-btn { transition: all 0.22s ease !important; }
        .tab-btn:hover { opacity: 0.85; }
        .role-pill { transition: all 0.2s ease; cursor: pointer; }
        .role-pill:hover { transform: translateY(-2px); }
        .demo-pill { cursor: pointer; transition: all 0.15s; border: 1px solid rgba(74,222,128,0.25); border-radius: 8px; padding: 4px 10px; font-size: 0.74rem; background: rgba(74,222,128,0.06); color: #86efac; font-weight: 600; }
        .demo-pill:hover { background: rgba(74,222,128,0.15); border-color: rgba(74,222,128,0.5); }
        .submit-btn { transition: all 0.2s ease; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(34,197,94,0.4) !important; }
        .submit-btn:active { transform: translateY(0); }
        input::placeholder { color: rgba(255,255,255,0.25); }
      `}</style>

      {/* Ambient orbs */}
      <div style={{ position: 'absolute', top: -100, left: -100, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 70%)', animation: 'orb1 12s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, right: '10%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(20,184,166,0.13) 0%, transparent 70%)', animation: 'orb2 15s ease-in-out infinite', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', right: '30%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,222,128,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', flexWrap: 'wrap', width: '100%', zIndex: 1 }}>

        {/* ── Left Hero Panel ── */}
        <div style={{ flex: '1 1 520px', padding: 'clamp(40px,6vw,80px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 28px rgba(34,197,94,0.45)', fontSize: 26 }}>
              ♻️
            </div>
            <div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
                Waste<span style={{ color: '#4ade80' }}>Loop</span>
              </h1>
              <div style={{ fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6b8a76', marginTop: 2 }}>
                Circular Economy Platform
              </div>
            </div>
          </div>

          <h2 style={{ fontSize: 'clamp(1.9rem,4vw,3rem)', fontWeight: 800, lineHeight: 1.12, marginBottom: 18, maxWidth: 560 }}>
            Intelligent Waste<br />
            <span style={{ background: 'linear-gradient(90deg, #4ade80, #22c55e, #14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% auto', animation: 'shimmer 4s linear infinite' }}>
              Collection & Circularity
            </span>
          </h2>

          <p style={{ fontSize: '1.02rem', color: '#7da68a', maxWidth: 500, lineHeight: 1.65, marginBottom: 40 }}>
            Empowering municipal infrastructure, smart IoT bins, route optimization, and verifiable closed-loop material reclamation at city scale.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '📡', text: 'Real-time IoT fill monitoring with overflow alerts' },
              { icon: '🛣️', text: 'Dynamic collector dispatch & Haversine route optimization' },
              { icon: '🔗', text: 'Verifiable chain-of-custody from bin to secondary product' },
              { icon: '📊', text: 'Live WasteLoop Circularity Index & ESG analytics' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.88rem', color: '#b2d8be', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 14px' }}>
                <span style={{ fontSize: '1.05rem' }}>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Auth Card ── */}
        <div style={{ flex: '0 0 clamp(340px,38vw,460px)', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', borderLeft: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(32px,5vw,56px) clamp(24px,4vw,44px)' }}>
          <div className="auth-card" style={{ width: '100%', maxWidth: 380 }}>

            {/* Tab switcher */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: 5, marginBottom: 28 }}>
              {[['login','Sign In'],['register','Register']].map(([t, label]) => (
                <button key={t} className="tab-btn" type="button" onClick={() => { setTab(t); setLoginError(''); setRegErrors({}); setRegSuccess(''); }}
                  style={{ padding: '9px 0', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', background: tab === t ? 'linear-gradient(135deg,#22c55e,#16a34a)' : 'transparent', color: tab === t ? 'white' : '#6b8a76', boxShadow: tab === t ? '0 4px 14px rgba(34,197,94,0.3)' : 'none' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── LOGIN FORM ── */}
            {tab === 'login' && (
              <div key="login">
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 4 }}>Welcome back</h3>
                <p style={{ fontSize: '0.83rem', color: '#6b8a76', marginBottom: 24 }}>Sign in to your WasteLoop account</p>

                {/* Quick demo access */}
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: '0.73rem', color: '#4d6b57', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 600 }}>Quick Demo Access</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ROLES.map(r => (
                      <button key={r.id} className="demo-pill" type="button" onClick={() => fillDemo(r.id)}>
                        {r.icon} {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <Field label="Email Address" id="login-email" type="email" value={loginEmail} onChange={e => { setLoginEmail(e.target.value); setLoginError(''); }} placeholder="you@example.com" required />
                  <Field label="Password" id="login-password" type="password" value={loginPassword} onChange={e => { setLoginPassword(e.target.value); setLoginError(''); }} placeholder="••••••••" required />

                  {loginError && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 9, padding: '10px 14px', fontSize: '0.83rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>⚠️</span> {loginError}
                    </div>
                  )}

                  <button type="submit" className="submit-btn" disabled={loginLoading}
                    style={{ marginTop: 4, padding: '12px 0', borderRadius: 11, border: 'none', background: loginLoading ? 'rgba(34,197,94,0.4)' : 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: loginLoading ? 'wait' : 'pointer', boxShadow: '0 4px 16px rgba(34,197,94,0.3)' }}>
                    {loginLoading ? <><Spinner />Verifying…</> : 'Sign In →'}
                  </button>
                </form>

                <p style={{ marginTop: 18, textAlign: 'center', fontSize: '0.8rem', color: '#4d6b57' }}>
                  New to WasteLoop?{' '}
                  <span onClick={() => setTab('register')} style={{ color: '#4ade80', cursor: 'pointer', fontWeight: 600 }}>Create an account</span>
                </p>
              </div>
            )}

            {/* ── REGISTER FORM ── */}
            {tab === 'register' && (
              <div key="register">
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 4 }}>Create account</h3>
                <p style={{ fontSize: '0.83rem', color: '#6b8a76', marginBottom: 22 }}>Join the WasteLoop circular economy platform</p>

                {/* Role selector */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: '0.73rem', color: '#4d6b57', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 9, fontWeight: 600 }}>I am a…</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 7 }}>
                    {ROLES.map(r => (
                      <button key={r.id} type="button" className="role-pill"
                        onClick={() => setRegRole(r.id)}
                        title={r.desc}
                        style={{ padding: '9px 6px', borderRadius: 10, border: `1.5px solid ${regRole === r.id ? '#4ade80' : 'rgba(255,255,255,0.1)'}`, background: regRole === r.id ? 'rgba(74,222,128,0.12)' : 'rgba(255,255,255,0.04)', color: regRole === r.id ? '#4ade80' : '#7a9b86', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>{r.icon}</div>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                  <Field label="Full Name" id="reg-name" value={regName} onChange={e => { setRegName(e.target.value); setRegErrors(p => ({...p, name: ''})); }} placeholder="Your full name" required error={regErrors.name} />
                  <Field label="Email Address" id="reg-email" type="email" value={regEmail} onChange={e => { setRegEmail(e.target.value); setRegErrors(p => ({...p, email: ''})); }} placeholder="you@example.com" required error={regErrors.email} />
                  <Field label="Phone (optional)" id="reg-phone" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="+91 98765 43210" hint="Used for dispatch notifications" />
                  <Field label="Password" id="reg-password" type="password" value={regPassword} onChange={e => { setRegPassword(e.target.value); setRegErrors(p => ({...p, password: ''})); }} placeholder="Min. 6 characters" required error={regErrors.password} />
                  <Field label="Confirm Password" id="reg-confirm" type="password" value={regConfirm} onChange={e => { setRegConfirm(e.target.value); setRegErrors(p => ({...p, confirm: ''})); }} placeholder="Repeat password" required error={regErrors.confirm} />

                  {regErrors.api && (
                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 9, padding: '10px 14px', fontSize: '0.83rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>⚠️</span> {regErrors.api}
                    </div>
                  )}

                  {regSuccess && (
                    <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 9, padding: '10px 14px', fontSize: '0.83rem', color: '#86efac', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>✅</span> {regSuccess}
                    </div>
                  )}

                  <button type="submit" className="submit-btn" disabled={regLoading}
                    style={{ marginTop: 4, padding: '12px 0', borderRadius: 11, border: 'none', background: regLoading ? 'rgba(34,197,94,0.4)' : 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', fontWeight: 700, fontSize: '0.95rem', cursor: regLoading ? 'wait' : 'pointer', boxShadow: '0 4px 16px rgba(34,197,94,0.3)' }}>
                    {regLoading ? <><Spinner />Creating account…</> : `Create ${regRole.charAt(0) + regRole.slice(1).toLowerCase()} Account →`}
                  </button>
                </form>

                <p style={{ marginTop: 16, textAlign: 'center', fontSize: '0.8rem', color: '#4d6b57' }}>
                  Already have an account?{' '}
                  <span onClick={() => setTab('login')} style={{ color: '#4ade80', cursor: 'pointer', fontWeight: 600 }}>Sign in</span>
                </p>
              </div>
            )}

            {/* Trust badge */}
            <div style={{ marginTop: 24, padding: '10px 14px', background: 'rgba(34,197,94,0.06)', borderRadius: 9, border: '1px solid rgba(34,197,94,0.15)', textAlign: 'center', fontSize: '0.76rem', color: '#4d6b57' }}>
              🔒 Session-secured · Role-based access · PostgreSQL backed
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
