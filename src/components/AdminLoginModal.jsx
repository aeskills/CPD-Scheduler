import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export default function AdminLoginModal({ isOpen, onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() === 'admin' && password.trim() === '7777') {
      setErrorMsg('');
      sessionStorage.setItem('cpd_admin_logged_in', 'true');
      onLoginSuccess();
    } else {
      setErrorMsg('Invalid Credentials. Access Denied.');
    }
  };

  return (
    <div class="login-overlay">
      <div class="login-card">
        <div style={{
          width: '56px', height: '56px', borderRadius: '50%',
          background: '#FFF1F0', border: '1px solid #FFC4BC', color: '#E52E06',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <Lock size={26} />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.4rem' }}>
          CPD Admin Authentication
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1.5rem' }}>
          Please enter administrator credentials to access management tools.
        </p>

        <form onSubmit={handleSubmit}>
          <div class="form-group" style={{ textAlign: 'left' }}>
            <label htmlFor="loginUsername">Username</label>
            <input
              type="text"
              id="loginUsername"
              class="input-control"
              placeholder="e.g. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div class="form-group" style={{ textAlign: 'left' }}>
            <label htmlFor="loginPassword">Password</label>
            <input
              type="password"
              id="loginPassword"
              class="input-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {errorMsg && (
            <div style={{ color: '#EF4444', fontSize: '0.82rem', fontWeight: 700, marginBottom: '1rem' }}>
              {errorMsg}
            </div>
          )}

          <button type="submit" class="btn-submit" style={{ borderRadius: '50px', fontWeight: 800 }}>
            Authorize & Access Admin Portal
          </button>
        </form>
      </div>
    </div>
  );
}
