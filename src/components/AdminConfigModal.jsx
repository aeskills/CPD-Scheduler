import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Clock, Link2, Tag, AlertCircle, User } from 'lucide-react';
import { normalizeSessions, isSessionExpired, getSessionEffectiveStatus } from '../utils/sessionUtils';

export { normalizeSessions, isSessionExpired, getSessionEffectiveStatus };

const TIME_PRESETS = [
  '10:00 AM - 11:30 AM',
  '11:30 AM - 01:00 PM',
  '02:00 PM - 03:30 PM',
  '04:00 PM - 05:30 PM'
];

function time24To12h(t24) {
  if (!t24) return '';
  const parts = t24.split(':');
  if (parts.length < 2) return '';
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  const hStr = h < 10 ? '0' + h : '' + h;
  return `${hStr}:${m} ${ampm}`;
}

function time12hTo24(t12) {
  if (!t12) return '';
  const match = t12.trim().toUpperCase().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);
  if (!match) return '';
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = match[3];
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const hStr = h < 10 ? '0' + h : '' + h;
  return `${hStr}:${m}`;
}

function extractStartEnd24h(timeRangeStr) {
  if (!timeRangeStr) return { start: '10:00', end: '11:30' };
  const parts = timeRangeStr.split(/-|to/i);
  const start12 = parts[0] ? parts[0].trim() : '';
  const end12 = parts[1] ? parts[1].trim() : '';
  return {
    start: time12hTo24(start12) || '10:00',
    end: time12hTo24(end12) || '11:30'
  };
}

export default function AdminConfigModal({ isOpen, dateStr, currentAdminState, existingConfig, onClose, onSave }) {
  const [targetState, setTargetState] = useState('CR');
  const [sessions, setSessions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Custom End Session Popup state
  const [showEndPrompt, setShowEndPrompt] = useState(false);
  const [endSessionIndex, setEndSessionIndex] = useState(null); // null = end all, index = end specific session
  const [endTeachersInput, setEndTeachersInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      const defaultSt = currentAdminState !== 'ALL' ? currentAdminState : 'CR';
      setTargetState(existingConfig?.state || defaultSt);
      const norm = normalizeSessions(existingConfig);
      if (norm.length === 0) {
        setSessions([{
          id: 's_' + Date.now(),
          organiserName: 'Surbhi Tyagi',
          sessionName: '',
          sessionTime: '10:00 AM - 11:30 AM',
          tutorialLink: '',
          slotStatus: 'SCHEDULE',
          teachersPresent: ''
        }]);
      } else {
        setSessions(norm);
      }
      setShowEndPrompt(false);
      setEndTeachersInput('');
      setEndSessionIndex(null);
    }
  }, [isOpen, dateStr, currentAdminState, existingConfig]);

  if (!isOpen) return null;

  const parts = dateStr.split('-');
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const stateNames = {
    'CR': 'Chain/Retail (CR)',
    'UP': 'Uttar Pradesh (UP)',
    'GA': 'Goa (GA)',
    'DL': 'Delhi (DL)',
    'UT': 'Uttarakhand (UT)',
    'GJ': 'Gujarat (GJ)'
  };

  const handleAddSession = () => {
    setSessions(prev => [
      ...prev,
      {
        id: 's_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        organiserName: prev[0]?.organiserName || 'Surbhi Tyagi',
        sessionName: '',
        sessionTime: prev.length === 1 ? '02:00 PM - 03:30 PM' : '04:00 PM - 05:30 PM',
        tutorialLink: prev[0]?.tutorialLink || '',
        slotStatus: 'SCHEDULE',
        teachersPresent: ''
      }
    ]);
  };

  const handleUpdateSessionField = (index, field, value) => {
    setSessions(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveSession = (index) => {
    if (sessions.length <= 1) return;
    setSessions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    
    // Filter out completely blank sessions
    const validSessions = sessions.filter(s => (s.sessionName || '').trim().length > 0 || (s.organiserName || '').trim().length > 0);
    const finalSessions = validSessions.length > 0 ? validSessions : sessions;

    await onSave({
      dateStr,
      state: targetState,
      sessions: finalSessions,
      // For backwards compatibility:
      organiserName: finalSessions[0]?.organiserName?.trim() || 'Surbhi Tyagi',
      sessionName: finalSessions[0]?.sessionName?.trim() || '',
      sessionTime: finalSessions[0]?.sessionTime?.trim() || '',
      tutorialLink: finalSessions[0]?.tutorialLink?.trim() || '',
      slotStatus: finalSessions[0]?.slotStatus || 'SCHEDULE',
      teachersPresent: finalSessions[0]?.teachersPresent || ''
    });
    setIsSaving(false);
    onClose();
  };

  const handleOpenEndSessionPrompt = (sIndex = null) => {
    setEndSessionIndex(sIndex);
    const initialTeachers = sIndex !== null ? (sessions[sIndex]?.teachersPresent || '0') : (sessions[0]?.teachersPresent || '0');
    setEndTeachersInput(initialTeachers);
    setShowEndPrompt(true);
  };

  const handleConfirmEndSession = async (e) => {
    if (e) e.preventDefault();
    const tPresent = endTeachersInput.trim() || '0';
    setIsSaving(true);

    let updatedSessions = [...sessions];
    if (endSessionIndex !== null && updatedSessions[endSessionIndex]) {
      updatedSessions[endSessionIndex] = {
        ...updatedSessions[endSessionIndex],
        slotStatus: 'SESSION_COMPLETED',
        teachersPresent: tPresent
      };
    } else {
      updatedSessions = updatedSessions.map(s => ({
        ...s,
        slotStatus: 'SESSION_COMPLETED',
        teachersPresent: tPresent
      }));
    }

    await onSave({
      dateStr,
      state: targetState,
      sessions: updatedSessions,
      organiserName: updatedSessions[0]?.organiserName?.trim() || 'Surbhi Tyagi',
      sessionName: updatedSessions[0]?.sessionName?.trim() || 'CPD Session',
      sessionTime: updatedSessions[0]?.sessionTime?.trim() || '',
      tutorialLink: updatedSessions[0]?.tutorialLink?.trim() || '',
      slotStatus: 'SESSION_COMPLETED',
      teachersPresent: tPresent
    });

    setIsSaving(false);
    setShowEndPrompt(false);
    onClose();
  };

  return (
    <>
      <div className="modal-overlay active" style={{ display: 'flex', opacity: 1, pointerEvents: 'auto', zIndex: 1000 }}>
        <div className="modal-card" style={{ maxWidth: '640px', width: '92%' }}>
          <div className="modal-header" style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
                <Plus size={20} color="#E52E06" />
                Configure Sessions for <span style={{ color: '#E52E06' }}>{formattedDate}</span>
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.15rem' }}>
                Add single or multiple sessions with specific time slots for teachers.
              </div>
            </div>
            <button type="button" className="btn-close-modal" onClick={onClose}><X size={20} /></button>
          </div>

          <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E52E06', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Target State (Auto-Selected)
                </div>
                <div style={{
                  background: '#FFF1F0', border: '1px solid #FFC4BC', color: '#E52E06',
                  padding: '0.65rem 0.9rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.92rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  📍 {stateNames[targetState] || targetState}
                </div>
              </div>

              {/* Sessions List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {sessions.map((sess, idx) => (
                  <div key={sess.id || idx} style={{
                    background: '#FFFFFF',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '12px',
                    padding: '1.1rem 1.25rem',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.9rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{
                          background: '#E52E06', color: '#FFFFFF', borderRadius: '50%', width: '22px', height: '22px',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800
                        }}>{idx + 1}</span>
                        Session #{idx + 1} Configuration
                      </div>
                      {sessions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSession(idx)}
                          style={{
                            background: '#FEF2F2', border: '1px solid #FECACA', color: '#EF4444',
                            borderRadius: '6px', padding: '0.25rem 0.6rem', fontSize: '0.76rem', fontWeight: 700,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem'
                          }}
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </div>

                    {isSessionExpired(dateStr, sess.sessionTime) && (
                      <div style={{ background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#475569', padding: '0.4rem 0.65rem', borderRadius: '6px', fontSize: '0.76rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={13} color="#64748B" /> Time Passed: This session has automatically ended.
                      </div>
                    )}

                    {/* Organiser Name */}
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label htmlFor={`sess_org_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.84rem' }}>
                        <User size={14} color="#E52E06" /> Organiser Name
                      </label>
                      <input
                        type="text"
                        id={`sess_org_${idx}`}
                        className="input-control"
                        placeholder="e.g. John Doe / AE Skills Team"
                        value={sess.organiserName || ''}
                        onChange={(e) => handleUpdateSessionField(idx, 'organiserName', e.target.value)}
                      />
                    </div>

                    {/* Session Name */}
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label htmlFor={`sess_name_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.84rem' }}>
                        <Tag size={14} color="#E52E06" /> Session Name / Title <span style={{ color: '#E52E06' }}>*</span>
                      </label>
                      <input
                        type="text"
                        id={`sess_name_${idx}`}
                        className="input-control"
                        placeholder="e.g. Socio emotional Learning (Session 1)"
                        value={sess.sessionName}
                        onChange={(e) => handleUpdateSessionField(idx, 'sessionName', e.target.value)}
                        required
                      />
                    </div>

                    {/* Session Time Field with Clock Pickers & Presets */}
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label htmlFor={`sess_time_${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Clock size={14} color="#E52E06" /> Session Time Range <span style={{ color: '#E52E06' }}>*</span>
                        </span>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>Pick clock time or use preset</span>
                      </label>

                      {/* Clock Time Pickers (Start & End Time) */}
                      {(() => {
                        const times24 = extractStartEnd24h(sess.sessionTime);

                        const handleClockChange = (newVal, type) => {
                          let s24 = times24.start;
                          let e24 = times24.end;
                          if (type === 'start') s24 = newVal;
                          if (type === 'end') e24 = newVal;
                          const formatted12h = `${time24To12h(s24)} - ${time24To12h(e24)}`;
                          handleUpdateSessionField(idx, 'sessionTime', formatted12h);
                        };

                        return (
                          <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: '0.65rem 0.85rem', borderRadius: '10px', marginBottom: '0.6rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                              <div style={{ flex: 1, minWidth: '130px' }}>
                                <label style={{ fontSize: '0.73rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                                  🕒 Start Time (Clock)
                                </label>
                                <input
                                  type="time"
                                  className="input-control"
                                  value={times24.start}
                                  onChange={(e) => handleClockChange(e.target.value, 'start')}
                                  style={{ fontWeight: 800, padding: '0.45rem 0.65rem', fontSize: '0.88rem', background: '#FFFFFF', border: '1.5px solid #CBD5E1', borderRadius: '8px', width: '100%', cursor: 'pointer' }}
                                />
                              </div>

                              <div style={{ fontWeight: 800, color: '#E52E06', marginTop: '0.85rem', fontSize: '1rem' }}>➔</div>

                              <div style={{ flex: 1, minWidth: '130px' }}>
                                <label style={{ fontSize: '0.73rem', fontWeight: 800, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                                  🕓 End Time (Clock)
                                </label>
                                <input
                                  type="time"
                                  className="input-control"
                                  value={times24.end}
                                  onChange={(e) => handleClockChange(e.target.value, 'end')}
                                  style={{ fontWeight: 800, padding: '0.45rem 0.65rem', fontSize: '0.88rem', background: '#FFFFFF', border: '1.5px solid #CBD5E1', borderRadius: '8px', width: '100%', cursor: 'pointer' }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      <input
                        type="text"
                        id={`sess_time_${idx}`}
                        className="input-control"
                        placeholder="e.g. 10:00 AM - 11:30 AM"
                        value={sess.sessionTime}
                        onChange={(e) => handleUpdateSessionField(idx, 'sessionTime', e.target.value)}
                        required
                      />

                      {/* Quick Presets */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.45rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700, marginRight: '0.2rem' }}>Quick Presets:</span>
                        {TIME_PRESETS.map((pTime) => (
                          <button
                            key={pTime}
                            type="button"
                            onClick={() => handleUpdateSessionField(idx, 'sessionTime', pTime)}
                            style={{
                              background: sess.sessionTime === pTime ? '#FFF1F0' : '#F1F5F9',
                              border: `1px solid ${sess.sessionTime === pTime ? '#FFC4BC' : '#CBD5E1'}`,
                              color: sess.sessionTime === pTime ? '#E52E06' : '#334155',
                              padding: '0.18rem 0.5rem', borderRadius: '50px', fontSize: '0.73rem', fontWeight: 700,
                              cursor: 'pointer', transition: 'all 0.15s ease'
                            }}
                          >
                            {pTime}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tutorial Link */}
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label htmlFor={`sess_link_${idx}`} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.84rem' }}>
                        <Link2 size={14} color="#E52E06" /> Teams / Tutorial Meeting Link
                      </label>
                      <input
                        type="url"
                        id={`sess_link_${idx}`}
                        className="input-control"
                        placeholder="https://teams.microsoft.com/l/meetup-join/..."
                        value={sess.tutorialLink}
                        onChange={(e) => handleUpdateSessionField(idx, 'tutorialLink', e.target.value)}
                      />
                    </div>

                    {/* Slot Status */}
                    <div className="form-group" style={{ marginBottom: '0.25rem' }}>
                      <label htmlFor={`sess_status_${idx}`} style={{ fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.35rem', fontSize: '0.84rem' }}>
                        Session Slot Availability
                      </label>
                      <select
                        id={`sess_status_${idx}`}
                        className="input-control"
                        style={{ background: '#FAFAFC', color: '#0F172A', fontWeight: 700, padding: '0.65rem', borderRadius: '8px', width: '100%', fontSize: '0.88rem', cursor: 'pointer' }}
                        value={sess.slotStatus}
                        onChange={(e) => handleUpdateSessionField(idx, 'slotStatus', e.target.value)}
                      >
                        <option value="SCHEDULE" style={{ color: '#00897B', fontWeight: 700 }}>🟢 SCHEDULE — Open for Booking</option>
                        <option value="FILLING_FAST" style={{ color: '#D97706', fontWeight: 700 }}>🟠 FILLING FAST — Slot will be full shortly</option>
                        <option value="SLOT_FULL" style={{ color: '#DC2626', fontWeight: 700 }}>🔴 SLOT IS FULL — Blocked (No new bookings allowed)</option>
                        <option value="SESSION_COMPLETED" style={{ color: '#475569', fontWeight: 700 }}>⚫ SESSION COMPLETED — Ended & blocked</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Session Button */}
              <button
                type="button"
                onClick={handleAddSession}
                style={{
                  width: '100%', marginTop: '1.25rem', padding: '0.75rem',
                  background: '#F8FAFC', border: '2px dashed #CBD5E1', borderRadius: '12px',
                  color: '#E52E06', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#E52E06'; e.currentTarget.style.background = '#FFF1F0'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#F8FAFC'; }}
              >
                <Plus size={18} /> Add Another Session Slot to Date
              </button>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn-submit" disabled={isSaving} style={{ flex: 2 }}>
                  <span>{isSaving ? 'Saving...' : `Save ${sessions.length > 1 ? `${sessions.length} Sessions` : 'Session Configuration'}`}</span>
                  {isSaving && <div className="spinner"></div>}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEndSessionPrompt(null)}
                  disabled={isSaving}
                  style={{
                    flex: 1, background: '#334155', color: '#FFFFFF', border: 'none',
                    borderRadius: '50px', fontWeight: 800, fontSize: '0.88rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem'
                  }}
                >
                  🏁 End Session
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* End Session Confirmation Popup */}
      {showEndPrompt && (
        <div className="modal-overlay active" style={{ display: 'flex', opacity: 1, pointerEvents: 'auto', zIndex: 1100, background: 'rgba(15, 23, 42, 0.65)' }}>
          <div className="modal-card" style={{ maxWidth: '460px', width: '90%' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <h3 style={{ color: '#0F172A', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🏁 End Session Confirmation
              </h3>
              <button type="button" className="btn-close-modal" onClick={() => setShowEndPrompt(false)}><X size={20} /></button>
            </div>

            <div className="modal-body" style={{ paddingTop: '1.2rem' }}>
              <div style={{ fontSize: '0.86rem', color: '#475569', marginBottom: '1.2rem', lineHeight: 1.5 }}>
                Ending CPD Session for <strong style={{ color: '#E52E06' }}>{stateNames[targetState] || targetState}</strong> on <strong style={{ color: '#0F172A' }}>{formattedDate}</strong>.
              </div>

              <form onSubmit={handleConfirmEndSession}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label htmlFor="inputEndTeachersPresent" style={{ fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: '0.4rem', fontSize: '0.88rem' }}>
                    Total Number of Teachers Attended
                  </label>
                  <input
                    type="number"
                    id="inputEndTeachersPresent"
                    className="input-control"
                    placeholder="e.g. 25"
                    min="0"
                    value={endTeachersInput}
                    onChange={(e) => setEndTeachersInput(e.target.value)}
                    required
                    style={{ fontSize: '1rem', fontWeight: 700, padding: '0.75rem', borderRadius: '8px' }}
                    autoFocus
                  />
                  <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: '0.35rem' }}>
                    Enter the total count of teachers present in this session before ending.
                  </div>
                </div>

                <div style={{ background: '#FFF1F0', border: '1px solid #FFC4BC', borderRadius: '10px', padding: '0.9rem 1rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontWeight: 800, color: '#DC2626', fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                    ⚠️ Confirm Session Completion
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#991B1B', lineHeight: 1.4 }}>
                    Do you want to end this session now? The slot will be marked as completed on the user portal.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={isSaving}
                    style={{ flex: 1, background: '#334155', color: '#FFFFFF', fontWeight: 800, borderRadius: '8px', padding: '0.75rem', border: 'none', cursor: 'pointer' }}
                  >
                    {isSaving ? 'Ending Session...' : '✓ Yes, End Session'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEndPrompt(false)}
                    disabled={isSaving}
                    style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1', fontWeight: 700, borderRadius: '8px', cursor: 'pointer', padding: '0.75rem' }}
                  >
                    ✕ No, Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

