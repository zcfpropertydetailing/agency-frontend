import React, { useState } from 'react';

const API = process.env.REACT_APP_API_URL;

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    email: '', password: '', businessName: '', industry: 'HVAC',
    location: '', phone: '', subscriptionTier: 'bundle'
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      onLogin(data.session, data.client);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email, password: form.password,
          businessName: form.businessName, industry: form.industry,
          location: form.location, phone: form.phone,
          subscriptionTier: form.subscriptionTier
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      await handleLogin();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">⚡</div>
          <div className="login-logo-text">TopStep Digital</div>
        </div>

        <h1>{mode === 'login' ? 'Welcome back' : 'Get started'}</h1>
        <p>{mode === 'login' ? 'Sign in to your client portal' : 'Create your account to access your AI agents'}</p>

        {error && <div className="error-msg">{error}</div>}

        {mode === 'register' && (
          <>
            <div className="form-group">
              <label>Business name</label>
              <input placeholder="Kowalski Heating & Air" value={form.businessName} onChange={e => update('businessName', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Industry</label>
              <select value={form.industry} onChange={e => update('industry', e.target.value)}>
                <option>HVAC</option>
                <option>Plumbing</option>
                <option>Landscaping</option>
                <option>Electrical</option>
                <option>Painting</option>
                <option>Cleaning</option>
                <option>Roofing</option>
              </select>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input placeholder="Wayne, PA" value={form.location} onChange={e => update('location', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input placeholder="(610) 555-0100" value={form.phone} onChange={e => update('phone', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Plan</label>
              <select value={form.subscriptionTier} onChange={e => update('subscriptionTier', e.target.value)}>
                <option value="bundle">Full Bundle — All 4 Agents</option>
                <option value="website">Website Agent Only</option>
                <option value="social">Social Media Agent Only</option>
                <option value="gbp">Google Business Profile Only</option>
                <option value="ads">Ads Agent Only</option>
              </select>
            </div>
          </>
        )}

        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="you@business.com" value={form.email} onChange={e => update('email', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())} />
        </div>

        <button className="btn-primary" disabled={loading}
          onClick={mode === 'login' ? handleLogin : handleRegister}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <div className="login-switch">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
