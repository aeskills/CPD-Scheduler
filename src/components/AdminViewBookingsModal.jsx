import React from 'react';
import { X, Edit2, Trash2 } from 'lucide-react';

export default function AdminViewBookingsModal({ isOpen, dateStr, bookingsList, onClose, onEdit, onDelete }) {
  if (!isOpen) return null;

  const parts = dateStr.split('-');
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const totalTeachers = bookingsList.reduce((acc, b) => acc + (parseInt(b.totalTeachers, 10) || 1), 0);

  return (
    <div class="modal-overlay active" style={{ display: 'flex', opacity: 1, pointerEvents: 'auto' }}>
      <div class="modal-card" style={{ maxWidth: '640px' }}>
        <div class="modal-header">
          <h3>Scheduled Bookings for <span>{formattedDate}</span></h3>
          <button type="button" class="btn-close-modal" onClick={onClose}><X size={20} /></button>
        </div>

        <div class="modal-body">
          <div style={{ background: '#FFF1F0', border: '1px solid #FFC4BC', padding: '0.85rem 1.1rem', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#E52E06' }}>Total Registered Teachers:</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#E52E06', background: '#FFFFFF', padding: '0.2rem 0.75rem', borderRadius: '50px', border: '1px solid #FFC4BC' }}>
              {totalTeachers} Teachers
            </span>
          </div>

          {bookingsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748B' }}>
              No school bookings registered for this date yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {bookingsList.map((b, idx) => (
                <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>{b.schoolName}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#E6F9F6', color: '#00897B', border: '1px solid #B2DFDB', padding: '0.15rem 0.5rem', borderRadius: '50px' }}>
                        {b.totalTeachers || 1} Teachers
                      </span>
                      {b.state && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#FFF1F0', color: '#E52E06', border: '1px solid #FFC4BC', padding: '0.15rem 0.5rem', borderRadius: '50px' }}>
                          {b.state}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.25rem' }}>
                      👤 SPOC: <strong>{b.spocName}</strong> | 📞 {b.spocPhone} | ✉️ {b.spocEmail}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => onEdit(dateStr, idx, b)}
                      style={{ background: '#FFFFFF', border: '1px solid #CBD5E1', color: '#2563EB', padding: '0.4rem 0.65rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(dateStr, idx)}
                      style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444', padding: '0.4rem 0.65rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
