import React, { useState, useEffect } from 'react';
import { X, Edit3 } from 'lucide-react';

export default function AdminEditBookingModal({ isOpen, dateStr, bookingIndex, bookingData, onClose, onSave }) {
  const [schoolName, setSchoolName] = useState('');
  const [spocName, setSpocName] = useState('');
  const [spocPhone, setSpocPhone] = useState('');
  const [spocEmail, setSpocEmail] = useState('');
  const [totalTeachers, setTotalTeachers] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isOpen && bookingData) {
      setSchoolName(bookingData.schoolName || '');
      setSpocName(bookingData.spocName || '');
      setSpocPhone(bookingData.spocPhone || '');
      setSpocEmail(bookingData.spocEmail || '');
      setTotalTeachers(bookingData.totalTeachers || '1');
    }
  }, [isOpen, bookingData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    await onSave(dateStr, bookingIndex, {
      schoolName: schoolName.trim(),
      spocName: spocName.trim(),
      spocPhone: spocPhone.trim(),
      spocEmail: spocEmail.trim(),
      totalTeachers: parseInt(totalTeachers, 10) || 1
    });
    setIsUpdating(false);
    onClose();
  };

  return (
    <div class="modal-overlay active" style={{ display: 'flex', opacity: 1, pointerEvents: 'auto' }}>
      <div class="modal-card">
        <div class="modal-header">
          <h3><Edit3 size={20} color="#E52E06" /> Edit School Booking Details</h3>
          <button type="button" class="btn-close-modal" onClick={onClose}><X size={20} /></button>
        </div>

        <div class="modal-body">
          <form onSubmit={handleSubmit}>
            <div class="form-group">
              <label htmlFor="editSchoolName">School Name</label>
              <input
                type="text"
                id="editSchoolName"
                class="input-control"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                required
              />
            </div>

            <div class="form-group">
              <label htmlFor="editSpocName">SPOC Name</label>
              <input
                type="text"
                id="editSpocName"
                class="input-control"
                value={spocName}
                onChange={(e) => setSpocName(e.target.value)}
                required
              />
            </div>

            <div class="form-group">
              <label htmlFor="editSpocPhone">SPOC Phone</label>
              <input
                type="tel"
                id="editSpocPhone"
                class="input-control"
                value={spocPhone}
                onChange={(e) => setSpocPhone(e.target.value)}
                required
              />
            </div>

            <div class="form-group">
              <label htmlFor="editSpocEmail">SPOC Email</label>
              <input
                type="email"
                id="editSpocEmail"
                class="input-control"
                value={spocEmail}
                onChange={(e) => setSpocEmail(e.target.value)}
                required
              />
            </div>

            <div class="form-group">
              <label htmlFor="editTotalTeachers">Total Teachers Attending</label>
              <input
                type="number"
                id="editTotalTeachers"
                class="input-control"
                value={totalTeachers}
                onChange={(e) => setTotalTeachers(e.target.value)}
                min="1"
                required
              />
            </div>

            <button type="submit" class="btn-submit" disabled={isUpdating} style={{ marginTop: '1.5rem' }}>
              <span>{isUpdating ? 'Updating...' : 'Update Booking Details'}</span>
              {isUpdating && <div class="spinner"></div>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
