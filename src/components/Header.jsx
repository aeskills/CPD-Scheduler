import React from 'react';
import { ArrowLeft, Lock, Calendar } from 'lucide-react';

const PRELOADED_URL_MAP = {
  'UP': 'https://aeskills.github.io/CPD/up',
  'GA': 'https://aeskills.github.io/CPD/goa',
  'DL': 'https://aeskills.github.io/CPD/delhi',
  'UT': 'https://aeskills.github.io/CPD/ut',
  'GJ': 'https://aeskills.github.io/CPD/gujarat',
  'CR': 'https://aeskills.github.io/CPD/'
};

export default function Header({ isAdmin, activeStateName, activeStateCode = 'CR', onLogout }) {
  const preloadedUrl = PRELOADED_URL_MAP[activeStateCode] || 'https://aeskills.github.io/CPD/';

  return (
    <header>
      <a href="/" class="brand" title="Return to CPD Scheduler">
        <div class="brand-logo">CPD</div>
        <div class="brand-text">
          <h1>{isAdmin ? 'CPD Admin Dashboard' : 'CPD Scheduler'}</h1>
          <p>
            {isAdmin ? '' : (activeStateName || 'Chain/Retail')}
          </p>
        </div>
      </a>
      <div class="header-actions">
        {isAdmin ? (
          <button type="button" class="btn-logout" onClick={onLogout}>Logout</button>
        ) : (
          <a href={preloadedUrl} class="btn-back" target="_blank" rel="noreferrer" style={{
            background: '#E52E06', color: '#FFFFFF', border: 'none', padding: '0.6rem 1.4rem',
            borderRadius: '50px', fontWeight: 800, fontSize: '0.88rem', textDecoration: 'none',
            boxShadow: '0 4px 12px rgba(229, 46, 6, 0.3)', display: 'inline-block'
          }}>
            Back to home
          </a>
        )}
      </div>
    </header>
  );
}

