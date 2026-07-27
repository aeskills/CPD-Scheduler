import React from 'react';
import { X, Edit2, Trash2 } from 'lucide-react';

export default function AdminViewBookingsModal({ isOpen, dateStr, bookingsList, sessionConfig, onClose, onEdit, onDelete, onUpdateTeachersPresent }) {
  const [teachersPresentVal, setTeachersPresentVal] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);

  React.useEffect(() => {
    if (sessionConfig) {
      setTeachersPresentVal(sessionConfig.teachersPresent || '');
    } else {
      setTeachersPresentVal('');
    }
  }, [sessionConfig, dateStr]);

  if (!isOpen) return null;

  const parts = dateStr.split('-');
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const totalTeachers = bookingsList.reduce((acc, b) => {
    if (b.registrantType === 'Teacher') return acc + 1;
    const cnt = parseInt(b.totalTeachers, 10);
    return acc + (isNaN(cnt) || cnt <= 0 ? 1 : cnt);
  }, 0);
  const sessionTitle = sessionConfig?.sessionName || 'CPD Session';

  const handleSaveTeachersPresent = async () => {
    if (!onUpdateTeachersPresent) return;
    setIsUpdating(true);
    await onUpdateTeachersPresent(dateStr, teachersPresentVal);
    setIsUpdating(false);
  };

  return (
    <div class="modal-overlay active" style={{ display: 'flex', opacity: 1, pointerEvents: 'auto' }}>
      <div class="modal-card" style={{ maxWidth: '680px' }}>
        <div class="modal-header">
          <h3>Bookings & SPOC Details for <span>{formattedDate}</span></h3>
          <button type="button" class="btn-close-modal" onClick={onClose}><X size={20} /></button>
        </div>

        <div class="modal-body">
          {/* Session Title Banner */}
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1.1rem', borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#E52E06', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SESSION NAME</div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginTop: '0.15rem' }}>{sessionTitle}</div>
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#FFF1F0', color: '#E52E06', border: '1px solid #FFC4BC', padding: '0.25rem 0.65rem', borderRadius: '50px' }}>CPD Session</span>
          </div>

          {/* 3 Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: '0.9rem 1rem', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D97706', textTransform: 'uppercase' }}>Total Registered Teachers</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#D97706', marginTop: '0.2rem' }}>👨‍🏫 {totalTeachers} Teachers</div>
            </div>

            <div style={{ background: '#E6F9F6', border: '1px solid #B2DFDB', padding: '0.9rem 1rem', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#00897B', textTransform: 'uppercase' }}>Total Schools</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#00897B', marginTop: '0.2rem' }}>🏫 {bookingsList.length} Schools</div>
            </div>

            <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', padding: '0.9rem 1rem', borderRadius: '12px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase' }}>Teachers Present in Session</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  value={teachersPresentVal}
                  onChange={(e) => setTeachersPresentVal(e.target.value)}
                  style={{ width: '70px', padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid #A5B4FC', fontWeight: 800, fontSize: '0.92rem', color: '#312E81' }}
                />
                <button
                  type="button"
                  onClick={handleSaveTeachersPresent}
                  disabled={isUpdating}
                  style={{ background: '#4F46E5', color: '#FFFFFF', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '6px', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  {isUpdating ? '...' : 'Save'}
                </button>
              </div>
            </div>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>{b.schoolName}</span>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 800,
                        background: b.registrantType === 'Teacher' ? '#EFF6FF' : '#E6F9F6',
                        color: b.registrantType === 'Teacher' ? '#2563EB' : '#00897B',
                        border: `1px solid ${b.registrantType === 'Teacher' ? '#BFDBFE' : '#B2DFDB'}`,
                        padding: '0.15rem 0.55rem', borderRadius: '50px'
                      }}>
                        {b.registrantType === 'Teacher' ? '👨‍🏫 Teacher (Individual)' : `🏢 SPOC (${b.totalTeachers || 1} Teachers)`}
                      </span>
                      {b.state && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#FFF1F0', color: '#E52E06', border: '1px solid #FFC4BC', padding: '0.15rem 0.5rem', borderRadius: '50px' }}>
                          {b.state}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '0.25rem' }}>
                      👤 {b.registrantType === 'Teacher' ? 'Teacher' : 'SPOC'}: <strong>{b.spocName}</strong> | 📞 {b.spocPhone} | ✉️ {b.spocEmail}
                    </div>
                    {b.sessionName && (
                      <div style={{ fontSize: '0.78rem', color: '#E52E06', fontWeight: 800, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        🏷️ Session: {b.sessionName} {b.sessionTime ? `(⏰ ${b.sessionTime})` : ''}
                      </div>
                    )}
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
