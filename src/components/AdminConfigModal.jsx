import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

export default function AdminConfigModal({ isOpen, dateStr, currentAdminState, existingConfig, onClose, onSave }) {
  const [targetState, setTargetState] = useState('UP');
  const [sessionName, setSessionName] = useState('');
  const [tutorialLink, setTutorialLink] = useState('');
  const [slotStatus, setSlotStatus] = useState('SCHEDULE');
  const [teachersPresent, setTeachersPresent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const defaultSt = currentAdminState !== 'ALL' ? currentAdminState : 'CR';
      setTargetState(existingConfig?.state || defaultSt);
      setSessionName(existingConfig?.sessionName || '');
      setTutorialLink(existingConfig?.tutorialLink || '');
      setSlotStatus(existingConfig?.slotStatus || 'SCHEDULE');
      setTeachersPresent(existingConfig?.teachersPresent || '');
    }
  }, [isOpen, dateStr, currentAdminState, existingConfig]);

  if (!isOpen) return null;

  const parts = dateStr.split('-');
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
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

  return (
    <div class="modal-overlay active" style={{ display: 'flex', opacity: 1, pointerEvents: 'auto' }}>
      <div class="modal-card">
        <div class="modal-header">
          <h3>
            <Plus size={20} color="#E52E06" />
            Configure Session for <span>{formattedDate}</span>
          </h3>
          <button type="button" class="btn-close-modal" onClick={onClose}><X size={20} /></button>
        </div>

        <div class="modal-body">
          <form onSubmit={handleSubmit}>
            <div class="form-group" style={{ marginBottom: '1.15rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#E52E06', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Target State (Auto-Selected)
              </div>
              <div style={{
                background: '#FFF1F0', border: '1px solid #FFC4BC', color: '#E52E06',
                padding: '0.75rem 1rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.95rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                📍 {
                  targetState === 'CR' ? 'Chain/Retail (CR)' :
                  targetState === 'GA' ? 'Goa (GA)' :
                  targetState === 'DL' ? 'Delhi (DL)' :
                  targetState === 'RJ' ? 'Rajasthan (RJ)' :
                  targetState === 'GJ' ? 'Gujarat (GJ)' :
                  targetState === 'UP' ? 'Uttar Pradesh (UP)' : 'Chain/Retail (CR)'
                }
              </div>
            </div>

            <div class="form-group">
              <label htmlFor="inputConfigSessionName">Session Name / Title</label>
              <input
                type="text"
                id="inputConfigSessionName"
                class="input-control"
                placeholder="e.g. Series 1 - Session 2 (Digital Literacy)"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                required
              />
            </div>

            <div class="form-group">
              <label htmlFor="inputConfigTutorialLink">Tutorial / Teams Meeting Link</label>
              <input
                type="url"
                id="inputConfigTutorialLink"
                class="input-control"
                placeholder="https://teams.microsoft.com/l/meetup-join/..."
                value={tutorialLink}
                onChange={(e) => setTutorialLink(e.target.value)}
                required
              />
            </div>

            <div class="form-group">
              <label htmlFor="inputConfigTeachersPresent">Total Teacher Present in Session</label>
              <input
                type="number"
                id="inputConfigTeachersPresent"
                class="input-control"
                placeholder="e.g. 40"
                min="0"
                value={teachersPresent}
                onChange={(e) => setTeachersPresent(e.target.value)}
              />
            </div>

            <div class="form-group" style={{ marginTop: '1.25rem' }}>
              <label htmlFor="selectConfigSlotStatus" style={{ fontWeight: 700, color: '#E52E06', display: 'block', marginBottom: '0.4rem' }}>
                Slot Status & Availability
              </label>
              <select
                id="selectConfigSlotStatus"
                class="input-control"
                style={{ background: '#FAFAFC', color: '#0F172A', fontWeight: 700, padding: '0.75rem', borderRadius: '8px', width: '100%', fontSize: '0.92rem', cursor: 'pointer' }}
                value={slotStatus}
                onChange={(e) => setSlotStatus(e.target.value)}
              >
                <option value="SCHEDULE" style={{ background: '#FFFFFF', color: '#00897B', fontWeight: 700 }}>🟢 SCHEDULE — Open for Booking</option>
                <option value="FILLING_FAST" style={{ background: '#FFFFFF', color: '#D97706', fontWeight: 700 }}>🟠 FILLING FAST — Slot will be full shortly</option>
                <option value="SLOT_FULL" style={{ background: '#FFFFFF', color: '#DC2626', fontWeight: 700 }}>🔴 SLOT IS FULL / BLOCKED — Blocked (No new bookings allowed)</option>
              </select>
            </div>

            <button type="submit" class="btn-submit" disabled={isSaving} style={{ marginTop: '1.5rem' }}>
              <span>{isSaving ? 'Saving...' : 'Save Session Configuration'}</span>
              {isSaving && <div class="spinner"></div>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
