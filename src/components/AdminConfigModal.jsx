import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

export default function AdminConfigModal({ isOpen, dateStr, currentAdminState, existingConfig, onClose, onSave }) {
  const [targetState, setTargetState] = useState('UP');
  const [sessionName, setSessionName] = useState('');
  const [tutorialLink, setTutorialLink] = useState('');
  const [slotStatus, setSlotStatus] = useState('SCHEDULE');
  const [teachersPresent, setTeachersPresent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Custom End Session Popup state
  const [showEndPrompt, setShowEndPrompt] = useState(false);
  const [endTeachersInput, setEndTeachersInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      const defaultSt = currentAdminState !== 'ALL' ? currentAdminState : 'CR';
      setTargetState(existingConfig?.state || defaultSt);
      setSessionName(existingConfig?.sessionName || '');
      setTutorialLink(existingConfig?.tutorialLink || '');
      setSlotStatus(existingConfig?.slotStatus || 'SCHEDULE');
      setTeachersPresent(existingConfig?.teachersPresent || '');
      setShowEndPrompt(false);
      setEndTeachersInput('');
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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    await onSave({
      dateStr,
      state: targetState,
      sessionName: sessionName.trim(),
      tutorialLink: tutorialLink.trim(),
      slotStatus,
      teachersPresent: teachersPresent.trim()
    });
    setIsSaving(false);
    onClose();
  };

  const handleOpenEndSessionPrompt = () => {
    setEndTeachersInput(teachersPresent || '0');
    setShowEndPrompt(true);
  };

  const handleConfirmEndSession = async (e) => {
    if (e) e.preventDefault();
    const tPresent = endTeachersInput.trim() || '0';
    setIsSaving(true);
    await onSave({
      dateStr,
      state: targetState,
      sessionName: sessionName.trim() || 'CPD Session',
      tutorialLink: tutorialLink.trim(),
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
        <div className="modal-card">
          <div className="modal-header">
            <h3>
              <Plus size={20} color="#E52E06" />
              Configure Session for <span>{formattedDate}</span>
            </h3>
            <button type="button" className="btn-close-modal" onClick={onClose}><X size={20} /></button>
          </div>

          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#E52E06', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Target State (Auto-Selected)
                </div>
                <div style={{
                  background: '#FFF1F0', border: '1px solid #FFC4BC', color: '#E52E06',
                  padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem',
                  display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                  📍 {stateNames[targetState] || targetState}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="inputConfigSessionName">Session Name / Title</label>
                <input
                  type="text"
                  id="inputConfigSessionName"
                  className="input-control"
                  placeholder="e.g. Series 1 - Session 2 (Digital Literacy)"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="inputConfigTutorialLink">Tutorial / Teams Meeting Link</label>
                <input
                  type="url"
                  id="inputConfigTutorialLink"
                  className="input-control"
                  placeholder="https://teams.microsoft.com/l/meetup-join/..."
                  value={tutorialLink}
                  onChange={(e) => setTutorialLink(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: '1.25rem' }}>
                <label htmlFor="selectConfigSlotStatus" style={{ fontWeight: 700, color: '#E52E06', display: 'block', marginBottom: '0.4rem' }}>
                  Slot Status & Availability
                </label>
                <select
                  id="selectConfigSlotStatus"
                  className="input-control"
                  style={{ background: '#FAFAFC', color: '#0F172A', fontWeight: 700, padding: '0.75rem', borderRadius: '8px', width: '100%', fontSize: '0.92rem', cursor: 'pointer' }}
                  value={slotStatus}
                  onChange={(e) => setSlotStatus(e.target.value)}
                >
                  <option value="SCHEDULE" style={{ background: '#FFFFFF', color: '#00897B', fontWeight: 700 }}>🟢 SCHEDULE — Open for Booking</option>
                  <option value="FILLING_FAST" style={{ background: '#FFFFFF', color: '#D97706', fontWeight: 700 }}>🟠 FILLING FAST — Slot will be full shortly</option>
                  <option value="SLOT_FULL" style={{ background: '#FFFFFF', color: '#DC2626', fontWeight: 700 }}>🔴 SLOT IS FULL / BLOCKED — Blocked (No new bookings allowed)</option>
                  <option value="SESSION_COMPLETED" style={{ background: '#FFFFFF', color: '#475569', fontWeight: 700 }}>⚫ SESSION IS COMPLETED — Session ended & day blocked</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn-submit" disabled={isSaving} style={{ flex: 2 }}>
                  <span>{isSaving ? 'Saving...' : 'Save Session Configuration'}</span>
                  {isSaving && <div className="spinner"></div>}
                </button>

                <button
                  type="button"
                  onClick={handleOpenEndSessionPrompt}
                  disabled={isSaving}
                  style={{
                    flex: 1, background: '#334155', color: '#FFFFFF', border: 'none',
                    borderRadius: '10px', fontWeight: 800, fontSize: '0.88rem',
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

      {/* Custom End Session Confirmation Popup (No native browser prompt/localhost text!) */}
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
