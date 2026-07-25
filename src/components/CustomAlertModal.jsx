import React from 'react';

export default function CustomAlertModal({ isOpen, title, message, icon = '🔒', onClose }) {
  if (!isOpen) return null;

  return (
    <div class="modal-overlay active" style={{ display: 'flex', opacity: 1, pointerEvents: 'auto' }}>
      <div class="modal-card" style={{ maxWidth: '440px', textAlign: 'center', padding: '2rem 1.5rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          fontSize: '1.5rem',
          background: '#FEF2F2',
          border: '1px solid #FECACA'
        }}>
          {icon}
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>
          {title}
        </h3>
        <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          {message}
        </p>
        <button
          type="button"
          class="btn-submit"
          onClick={onClose}
          style={{ width: '100%', maxWidth: '200px', margin: '0 auto', borderRadius: '50px', fontWeight: 800 }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
