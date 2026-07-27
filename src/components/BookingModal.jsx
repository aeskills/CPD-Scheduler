import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Check } from 'lucide-react';
import { normalizeSessions, getSessionEffectiveStatus } from '../utils/sessionUtils';

export default function BookingModal({ isOpen, dateStr, config, initialSessionId, stateCode, onClose, onSubmitSuccess }) {
  const [spocName, setSpocName] = useState('');
  const [spocPhone, setSpocPhone] = useState('');
  const [spocEmail, setSpocEmail] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [dpdpConsent, setDpdpConsent] = useState(false);

  const normSessions = normalizeSessions(config);
  const [selectedSessId, setSelectedSessId] = useState(initialSessionId || normSessions[0]?.id);

  useEffect(() => {
    if (initialSessionId) {
      setSelectedSessId(initialSessionId);
    } else if (normSessions[0]?.id) {
      setSelectedSessId(normSessions[0].id);
    }
  }, [initialSessionId, config]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const activeSession = normSessions.find(s => s.id === selectedSessId) || normSessions[0] || {};
  const sessionTitle = activeSession.sessionName || config?.sessionName || 'CPD Session';
  const sessionTime = activeSession.sessionTime || config?.sessionTime || '';
  const slotStatus = activeSession.slotStatus || config?.slotStatus || 'SCHEDULE';

  // Format date key nicely
  const parts = dateStr.split('-');
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!spocName.trim()) newErrors.spocName = true;
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(spocPhone.replace(/[\s-]/g, ''))) newErrors.spocPhone = true;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(spocEmail.trim())) newErrors.spocEmail = true;

    if (!schoolName.trim()) newErrors.schoolName = true;

    if (!dpdpConsent) newErrors.dpdpConsent = true;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    await onSubmitSuccess({
      sessionDate: dateStr,
      sessionName: sessionTitle,
      sessionTime: sessionTime,
      registrantType: 'Teacher',
      spocName: spocName.trim(),
      spocPhone: spocPhone.trim(),
      spocEmail: spocEmail.trim(),
      schoolName: schoolName.trim(),
      totalTeachers: 1,
      state: stateCode || 'CR'
    });
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const handleDone = () => {
    setIsSuccess(false);
    setSpocName('');
    setSpocPhone('');
    setSpocEmail('');
    setSchoolName('');
    setDpdpConsent(false);
    onClose();
  };

  return (
    <div className="modal-overlay active" style={{ display: 'flex', opacity: 1, pointerEvents: 'auto', zIndex: 1000 }}>
      <div className="modal-card" style={{ maxWidth: '580px', width: '92%' }}>
        <div className="modal-header">
          <h3>📅 Schedule CPD Session</h3>
          <button type="button" className="btn-close-modal" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body">
          {isSuccess ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#10B981',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.25rem', fontSize: '1.8rem'
              }}>
                ✓
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.6rem' }}>
                CPD Session Scheduled!
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#475569', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                Successfully registered Teacher <strong>{spocName}</strong> ({schoolName}) for <strong>{sessionTitle}</strong> {sessionTime ? `(${sessionTime})` : ''} on <strong>{formattedDate}</strong>.<br /><br />
                A confirmation email with the Microsoft Teams link has been dispatched to <strong>{spocEmail}</strong>.
              </p>
              <button type="button" className="btn-submit" onClick={handleDone}>
                Done & Return to Calendar
              </button>
            </div>
          ) : (
            <>
              {/* If multiple sessions scheduled on this date, show session selector */}
              {normSessions.length > 1 && (
                <div style={{ marginBottom: '1.15rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#E52E06', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
                    Select Session Slot for {formattedDate}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.6rem' }}>
                    {normSessions.map((s, sIdx) => {
                      const isSel = (s.id === activeSession.id);
                      const sEff = getSessionEffectiveStatus(dateStr, s);
                      const isEnded = sEff === 'SESSION_COMPLETED';

                      return (
                        <button
                          key={s.id || sIdx}
                          type="button"
                          disabled={isEnded}
                          onClick={() => !isEnded && setSelectedSessId(s.id)}
                          style={{
                            textAlign: 'left',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '10px',
                            border: isSel ? '2px solid #E52E06' : isEnded ? '1px solid #CBD5E1' : '1px solid #CBD5E1',
                            background: isSel ? '#FFF1F0' : isEnded ? '#F1F5F9' : '#F8FAFC',
                            color: isSel ? '#E52E06' : isEnded ? '#94A3B8' : '#0F172A',
                            cursor: isEnded ? 'not-allowed' : 'pointer',
                            opacity: isEnded ? 0.7 : 1,
                            transition: 'all 0.15s ease',
                            boxShadow: isSel ? '0 2px 8px rgba(229, 46, 6, 0.15)' : 'none'
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: '0.84rem' }}>
                            {s.sessionName} {isEnded && <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 800 }}>(Ended)</span>}
                          </div>
                          {s.sessionTime && (
                            <div style={{ fontSize: '0.74rem', color: isSel ? '#CC2500' : '#64748B', fontWeight: 700, marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              ⏰ {s.sessionTime}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Session Details Card */}
              <div style={{
                background: '#FFF1F0', border: '1px solid #FFC4BC', padding: '1.15rem 1.25rem',
                borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: '1rem', flexWrap: 'wrap'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                    Selected Session & Time Slot
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#E52E06', marginTop: '0.2rem' }}>
                    {sessionTitle}
                  </div>
                  {sessionTime && (
                    <div style={{ fontSize: '0.92rem', color: '#0F172A', marginTop: '0.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      ⏰ Session Time: <span style={{ color: '#E52E06', background: '#FFFFFF', padding: '0.1rem 0.5rem', borderRadius: '4px', border: '1px solid #FFC4BC' }}>{sessionTime}</span>
                    </div>
                  )}
                  <div style={{ fontSize: '0.88rem', color: '#475569', marginTop: '0.25rem', fontWeight: 700 }}>
                    📅 {formattedDate}
                  </div>
                </div>
                <div>
                  {slotStatus === 'FILLING_FAST' ? (
                    <span style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', padding: '0.35rem 0.85rem', borderRadius: '50px', fontWeight: 800, fontSize: '0.78rem' }}>
                      🟠 Slot Filling Fast
                    </span>
                  ) : (
                    <span style={{ background: '#E6F9F6', color: '#00897B', border: '1px solid #B2DFDB', padding: '0.35rem 0.85rem', borderRadius: '50px', fontWeight: 800, fontSize: '0.78rem' }}>
                      🟢 Schedule Available
                    </span>
                  )}
                </div>
              </div>

              <div style={{ background: '#FFF1F0', border: '1px solid #FFC4BC', padding: '0.85rem 1.1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.88rem', color: '#991B1B', fontWeight: 700 }}>
                Please fill all your details carefully.
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="inputSpocName">
                    Teacher Name <span style={{ color: '#E52E06' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="inputSpocName"
                    className={`input-control ${errors.spocName ? 'error' : ''}`}
                    placeholder="e.g. Ananya Sharma"
                    value={spocName}
                    onChange={(e) => setSpocName(e.target.value)}
                  />
                  {errors.spocName && (
                    <div style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: '0.35rem' }}>
                      Please enter full name.
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="inputSpocPhone">
                    Teacher Phone Number <span style={{ color: '#E52E06' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    id="inputSpocPhone"
                    className={`input-control ${errors.spocPhone ? 'error' : ''}`}
                    placeholder="10-digit mobile number (e.g. 9876543210)"
                    value={spocPhone}
                    onChange={(e) => setSpocPhone(e.target.value)}
                  />
                  {errors.spocPhone && (
                    <div style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: '0.35rem' }}>
                      Please enter a valid 10-digit phone number.
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="inputSpocEmail">
                    Teacher Email ID <span style={{ color: '#E52E06' }}>*</span>
                  </label>
                  <input
                    type="email"
                    id="inputSpocEmail"
                    className={`input-control ${errors.spocEmail ? 'error' : ''}`}
                    placeholder="teacher@school.edu.in"
                    value={spocEmail}
                    onChange={(e) => setSpocEmail(e.target.value)}
                  />
                  {errors.spocEmail && (
                    <div style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: '0.35rem' }}>
                      Please enter a valid email address.
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="inputSchoolName">School Name <span style={{ color: '#E52E06' }}>*</span></label>
                  <input
                    type="text"
                    id="inputSchoolName"
                    className={`input-control ${errors.schoolName ? 'error' : ''}`}
                    placeholder="e.g. St. Xavier's High School"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                  />
                  {errors.schoolName && <div style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: '0.35rem' }}>Please enter your school name.</div>}
                </div>

                {/* Consent Checkbox */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.85rem', marginBottom: '1.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.82rem', color: '#475569', cursor: 'pointer', lineHeight: 1.45 }}>
                    <input
                      type="checkbox"
                      checked={dpdpConsent}
                      onChange={(e) => setDpdpConsent(e.target.checked)}
                      style={{ marginTop: '0.15rem', accentColor: '#E52E06', width: '16px', height: '16px' }}
                    />
                    <span>
                      By submitting this form, you consent to your information being used for CPD certification and communication regarding CPD sessions. Your details will be kept confidential and will not be shared with any third party.
                    </span>
                  </label>
                  {errors.dpdpConsent && <div style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: '0.4rem' }}>You must agree to the data protection terms to proceed.</div>}
                </div>

                <button type="submit" className="btn-submit" disabled={isSubmitting}>
                  <span>{isSubmitting ? 'Scheduling Session...' : 'Confirm & Schedule Session'}</span>
                  {isSubmitting && <div className="spinner"></div>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

