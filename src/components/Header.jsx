import React from 'react';
import { ArrowLeft, Lock, Calendar } from 'lucide-react';

export default function Header({ isAdmin, activeStateName, onLogout }) {
  return (
    <header>
      <a href="/" class="brand" title="Return to CPD Scheduler">
        <div class="brand-logo">CPD</div>
        <div class="brand-text">
          <h1>{isAdmin ? 'CPD Admin Dashboard' : 'CPD Scheduler'}</h1>
          <p>
            {isAdmin ? '' : (activeStateName || 'Select State')}
          </p>
        </div>
      </a>
      <div class="header-actions">
        {isAdmin ? (
          <button type="button" class="btn-logout" onClick={onLogout}>Logout</button>
        ) : (
          <a href="https://aeskills.github.io/CPD/" class="btn-back" target="_blank" rel="noreferrer" style={{
            background: '#E52E06', color: '#FFFFFF', border: 'none', padding: '0.6rem 1.4rem',
            borderRadius: '50px', fontWeight: 800, fontSize: '0.88rem', textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(229, 46, 6, 0.3)', display: 'inline-block'
          }}>
            Preloaded CPD Session
          </a>
        )}
      </div>
    </header>
  );
}
