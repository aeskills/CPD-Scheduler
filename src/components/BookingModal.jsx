import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function BookingModal({ isOpen, dateStr, config, stateCode, onClose, onSubmitSuccess }) {
  const [registrantType, setRegistrantType] = useState('SPOC'); // 'SPOC' or 'Teacher'
  const [spocName, setSpocName] = useState('');
  const [spocPhone, setSpocPhone] = useState('');
  const [spocEmail, setSpocEmail] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [totalTeachers, setTotalTeachers] = useState('');
  const [dpdpConsent, setDpdpConsent] = useState(false);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const sessionTitle = config?.sessionName || 'CPD Session';
  const slotStatus = config?.slotStatus || 'SCHEDULE';

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

    let tNum = 1;
    if (registrantType === 'SPOC') {
      const parsedNum = parseInt(totalTeachers, 10);
      if (isNaN(parsedNum) || parsedNum <= 0) {
        newErrors.totalTeachers = true;
      } else {
        tNum = parsedNum;
      }
    }

    if (!dpdpConsent) newErrors.dpdpConsent = true;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setIsSubmitting(true);
    await onSubmitSuccess({
      sessionDate: dateStr,
      sessionName: sessionTitle,
      registrantType: registrantType,
      spocName: spocName.trim(),
      spocPhone: spocPhone.trim(),
      spocEmail: spocEmail.trim(),
      schoolName: schoolName.trim(),
      totalTeachers: tNum,
      state: stateCode || 'CR'
    });
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const handleDone = () => {
    setIsSuccess(false);
    setRegistrantType('SPOC');
    setSpocName('');
    setSpocPhone('');
    setSpocEmail('');
    setSchoolName('');
    setTotalTeachers('');
    setDpdpConsent(false);
    onClose();
  };

  return (
    <div class="modal-overlay active" style={{ display: 'flex', opacity: 1, pointerEvents: 'auto' }}>
      <div class="modal-card">
        <div class="modal-header">
          <h3>📅 Schedule CPD Session</h3>
          <button type="button" class="btn-close-modal" onClick={onClose}><X size={20} /></button>
        </div>

        <div class="modal-body">
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
                Successfully registered {registrantType === 'Teacher' ? 'Teacher' : 'SPOC'} <strong>{spocName}</strong> ({schoolName}) for <strong>{sessionTitle}</strong> on <strong>{formattedDate}</strong>.<br /><br />
                A confirmation email with the Microsoft Teams link has been dispatched to <strong>{spocEmail}</strong>.
              </p>
              <button type="button" class="btn-submit" onClick={handleDone}>
                Done & Return to Calendar
              </button>
            </div>
          ) : (
            <>
              <div style={{
                background: '#FFF1F0', border: '1px solid #FFC4BC', padding: '1.15rem 1.25rem',
                borderRadius: '12px', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: '1rem', flexWrap: 'wrap'
              }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                    Session Name & Date
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#E52E06', marginTop: '0.2rem' }}>
                    {sessionTitle}
                  </div>
                  <div style={{ fontSize: '0.92rem', color: '#0F172A', marginTop: '0.25rem', fontWeight: 700 }}>
                    📅 {formattedDate}
                  </div>
                </div>
                <div>
                  {slotStatus === 'FILLING_FAST' ? (
                    <span style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FDE68A', padding: '0.3rem 0.75rem', borderRadius: '50px', fontWeight: 800, fontSize: '0.78rem' }}>
                      🟠 Slot Filling Fast
                    </span>
                  ) : (
                    <span style={{ background: '#E6F9F6', color: '#00897B', border: '1px solid #B2DFDB', padding: '0.3rem 0.75rem', borderRadius: '50px', fontWeight: 800, fontSize: '0.78rem' }}>
                      🟢 Schedule Available
                    </span>
                  )}
                </div>
              </div>

              {/* Registrant Role Segmented Toggle */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>
                  Registering As <span style={{ color: '#E52E06' }}>*</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', background: '#F1F5F9', padding: '0.3rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                  <button
                    type="button"
                    onClick={() => { setRegistrantType('SPOC'); setErrors({}); }}
                    style={{
                      flex: 1, padding: '0.65rem 0.5rem', borderRadius: '8px', border: 'none',
                      fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                      background: registrantType === 'SPOC' ? '#FFFFFF' : 'transparent',
                      color: registrantType === 'SPOC' ? '#E52E06' : '#64748B',
                      boxShadow: registrantType === 'SPOC' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    🏢 SPOC (Group Booking)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRegistrantType('Teacher'); setErrors({}); }}
                    style={{
                      flex: 1, padding: '0.65rem 0.5rem', borderRadius: '8px', border: 'none',
                      fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                      background: registrantType === 'Teacher' ? '#FFFFFF' : 'transparent',
                      color: registrantType === 'Teacher' ? '#E52E06' : '#64748B',
                      boxShadow: registrantType === 'Teacher' ? '0 2px 5px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    👨‍🏫 Teacher (Individual)
                  </button>
                </div>
              </div>

              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '0.85rem 1.1rem', borderRadius: '10px', marginBottom: '1.25rem', fontSize: '0.84rem', color: '#334155', lineHeight: 1.6 }}>
                <strong style={{ color: '#991B1B' }}>Please fill all your details carefully.</strong><br/>
                <span style={{ color: '#475569' }}>
                  {registrantType === 'SPOC'
                    ? 'The Microsoft Teams meeting link will be dispatched directly to your SPOC email address.'
                    : 'The Microsoft Teams meeting link will be dispatched directly to your Teacher email address.'
                  }
                </span>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div class="form-group">
                  <label htmlFor="inputSpocName">
                    {registrantType === 'SPOC' ? 'SPOC Name' : 'Teacher Name'} <span style={{ color: '#E52E06' }}>*</span>
                  </label>
                  <input
                    type="text"
                    id="inputSpocName"
                    class={`input-control ${errors.spocName ? 'error' : ''}`}
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

                <div class="form-group">
                  <label htmlFor="inputSpocPhone">
                    {registrantType === 'SPOC' ? 'SPOC Phone Number' : 'Teacher Phone Number'} <span style={{ color: '#E52E06' }}>*</span>
                  </label>
                  <input
                    type="tel"
                    id="inputSpocPhone"
                    class={`input-control ${errors.spocPhone ? 'error' : ''}`}
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

                <div class="form-group">
                  <label htmlFor="inputSpocEmail">
                    {registrantType === 'SPOC' ? 'SPOC Email ID' : 'Teacher Email ID'} <span style={{ color: '#E52E06' }}>*</span>
                  </label>
                  <input
                    type="email"
                    id="inputSpocEmail"
                    class={`input-control ${errors.spocEmail ? 'error' : ''}`}
                    placeholder={registrantType === 'SPOC' ? 'spoc@school.edu.in' : 'teacher@school.edu.in'}
                    value={spocEmail}
                    onChange={(e) => setSpocEmail(e.target.value)}
                  />
                  {errors.spocEmail && (
                    <div style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: '0.35rem' }}>
                      Please enter a valid email address.
                    </div>
                  )}
                </div>

                <div class="form-group">
                  <label htmlFor="inputSchoolName">School Name <span style={{ color: '#E52E06' }}>*</span></label>
                  <input
                    type="text"
                    id="inputSchoolName"
                    class={`input-control ${errors.schoolName ? 'error' : ''}`}
                    placeholder="e.g. St. Xavier's High School"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                  />
                  {errors.schoolName && <div style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: '0.35rem' }}>Please enter your school name.</div>}
                </div>

                {/* Total Teachers field only for SPOC type */}
                {registrantType === 'SPOC' && (
                  <div class="form-group">
                    <label htmlFor="inputTotalTeachers">Total Teachers Attending <span style={{ color: '#E52E06' }}>*</span></label>
                    <input
                      type="number"
                      id="inputTotalTeachers"
                      class={`input-control ${errors.totalTeachers ? 'error' : ''}`}
                      placeholder="e.g. 15"
                      min="1"
                      value={totalTeachers}
                      onChange={(e) => setTotalTeachers(e.target.value)}
                    />
                    {errors.totalTeachers && <div style={{ color: '#EF4444', fontSize: '0.78rem', marginTop: '0.35rem' }}>Please enter a positive number of teachers.</div>}
                  </div>
                )}

                {/* Consent Checkbox / Radio */}
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

                <button type="submit" class="btn-submit" disabled={isSubmitting}>
                  <span>{isSubmitting ? 'Scheduling Session...' : 'Confirm & Schedule Session'}</span>
                  {isSubmitting && <div class="spinner"></div>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
