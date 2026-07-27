import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import BookingModal from '../components/BookingModal';
import CustomAlertModal from '../components/CustomAlertModal';
import { fetchAdminDataFromBackend, postToBackend, broadcastLiveSync, subscribeLiveSync } from '../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const STATE_NAMES = {
  'CR': 'Chain/Retail',
  'UP': 'Uttar Pradesh',
  'GA': 'Goa',
  'DL': 'Delhi',
  'RJ': 'Rajasthan',
  'GJ': 'Gujarat',
  'ALL': 'All States'
};

const STATE_SLUGS = {
  'cr': 'CR',
  'chain-retail': 'CR',
  'chainretail': 'CR',
  'chain': 'CR',
  'retail': 'CR',
  'up': 'UP',
  'uttar-pradesh': 'UP',
  'goa': 'GA',
  'ga': 'GA',
  'delhi': 'DL',
  'dl': 'DL',
  'raj': 'RJ',
  'rajasthan': 'RJ',
  'rj': 'RJ',
  'gujarat': 'GJ',
  'gj': 'GJ'
};

function InstructionPopup() {
  const [infoState, setInfoState] = useState('open'); // 'open' | 'capsule'

  useEffect(() => {
    if (infoState === 'open') {
      const timer = setTimeout(() => setInfoState('capsule'), 5000);
      return () => clearTimeout(timer);
    }
  }, [infoState]);

  if (infoState === 'capsule') {
    return (
      <div
        onClick={() => setInfoState('open')}
        style={{
          position: 'fixed', bottom: '1.25rem', left: '1.25rem', zIndex: 999,
          background: '#1E40AF', color: '#FFFFFF', padding: '0.55rem 1.1rem',
          borderRadius: '50px', fontSize: '0.8rem', fontWeight: 700,
          cursor: 'pointer', boxShadow: '0 4px 16px rgba(30, 64, 175, 0.35)',
          display: 'flex', alignItems: 'center', gap: '0.5rem'
        }}
      >
        ℹ️ How to use
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', bottom: '1.25rem', left: '1.25rem', zIndex: 999,
      background: '#FFFFFF', border: '1px solid #BFDBFE', borderRadius: '14px',
      padding: '1.1rem 1.25rem', paddingRight: '2.2rem', maxWidth: '380px', fontSize: '0.82rem',
      color: '#1E40AF', lineHeight: 1.6,
      boxShadow: '0 8px 28px rgba(30, 64, 175, 0.15)'
    }}>
      <button
        onClick={() => setInfoState('capsule')}
        style={{
          position: 'absolute', top: '0.5rem', right: '0.6rem',
          background: 'none', border: 'none', fontSize: '1.1rem',
          color: '#94A3B8', cursor: 'pointer', lineHeight: 1, padding: '0.15rem'
        }}
        title="Close"
      >✕</button>
      <strong>Welcome to the CPD Scheduler.</strong><br/>
      The available CPD sessions can be viewed on the dates on which they are scheduled.<br/><br/>
      Navigate to your preferred date to see the available sessions. If a session has available slots, you will see a <strong>'Schedule'</strong> button.<br/><br/>
      Click the <strong>'Schedule'</strong> button to book your session.
    </div>
  );
}

function detectStateFromURL() {
  if (typeof window === 'undefined') return 'CR';
  const urlParams = new URLSearchParams(window.location.search);
  let stateParam = urlParams.get('state');

  if (!stateParam && window.location.hash) {
    stateParam = window.location.hash.replace('#', '');
  }

  if (!stateParam) {
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const lastSeg = pathSegments[pathSegments.length - 1];
    if (lastSeg && lastSeg !== 'scheduler.html' && lastSeg !== 'CPD-Scheduler') {
      stateParam = lastSeg;
    }
  }

  if (stateParam) {
    const cleanParam = stateParam.toLowerCase().trim();
    if (STATE_SLUGS[cleanParam]) {
      return STATE_SLUGS[cleanParam];
    }
  }
  return 'CR';
}

function formatDateKey(year, month, day) {
  const m = month < 10 ? '0' + month : month;
  const d = day < 10 ? '0' + day : day;
  return `${year}-${m}-${d}`;
}

export default function SchedulerPage() {
  const [userSelectedState] = useState(() => detectStateFromURL());
  const [currentDate, setCurrentDate] = useState(new Date());

  const [adminSessionConfigs, setAdminSessionConfigs] = useState(() => {
    return JSON.parse(localStorage.getItem('cpd_admin_session_configs') || '{}');
  });
  const [bookedSlots, setBookedSlots] = useState(() => {
    return JSON.parse(localStorage.getItem('cpd_admin_bookings') || '{}');
  });

  // Modal States
  const [bookingModalDate, setBookingModalDate] = useState(null);
  const [alertModalState, setAlertModalState] = useState({ isOpen: false, title: '', message: '', icon: '🔒' });

  const activeStateName = STATE_NAMES[userSelectedState] || userSelectedState;

  const loadData = async () => {
    const data = await fetchAdminDataFromBackend();
    if (data) {
      const sConfigs = data.sessionConfigs || {};
      const sBookings = data.bookings || {};
      setAdminSessionConfigs(sConfigs);
      setBookedSlots(sBookings);
      localStorage.setItem('cpd_admin_session_configs', JSON.stringify(sConfigs));
      localStorage.setItem('cpd_admin_bookings', JSON.stringify(sBookings));
    }
  };

  useEffect(() => {
    loadData();

    // 4s polling
    const interval = setInterval(loadData, 4000);

    // Live BroadcastSync
    const unsubscribe = subscribeLiveSync(() => {
      setAdminSessionConfigs(JSON.parse(localStorage.getItem('cpd_admin_session_configs') || '{}'));
      setBookedSlots(JSON.parse(localStorage.getItem('cpd_admin_bookings') || '{}'));
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (activeStateName) {
      document.title = `CPD ${activeStateName}`;
    } else {
      document.title = `CPD Scheduler`;
    }
  }, [activeStateName]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleBookingSubmit = async (bookingData) => {
    const { sessionDate, state } = bookingData;
    const stKey = state + '_' + sessionDate;

    // Optimistic local update
    const updatedBookings = { ...bookedSlots };
    if (!updatedBookings[stKey]) updatedBookings[stKey] = [];
    updatedBookings[stKey].push(bookingData);
    if (!updatedBookings[sessionDate]) updatedBookings[sessionDate] = [];
    updatedBookings[sessionDate].push(bookingData);

    setBookedSlots(updatedBookings);
    localStorage.setItem('cpd_admin_bookings', JSON.stringify(updatedBookings));

    broadcastLiveSync({ action: 'booking_added', sessionDate, booking: bookingData });

    // Send POST background request to Apps Script
    await postToBackend({
      action: 'createBooking',
      sessionDate: bookingData.sessionDate,
      state: bookingData.state,
      sessionName: bookingData.sessionName,
      spocName: bookingData.spocName,
      spocPhone: bookingData.spocPhone,
      spocEmail: bookingData.spocEmail,
      schoolName: bookingData.schoolName,
      totalTeachers: bookingData.totalTeachers
    });

    loadData();
  };

  // Render Days Grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonthDays = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    prevMonthDays.push(prevMonthTotalDays - i);
  }

  const currentMonthDays = [];
  for (let day = 1; day <= totalDays; day++) {
    const cellDate = new Date(year, month, day);
    cellDate.setHours(0, 0, 0, 0);
    const dateStr = formatDateKey(year, month + 1, day);
    const isPast = (cellDate < today);
    const isToday = (cellDate.getTime() === today.getTime());

    const stKey = userSelectedState + '_' + dateStr;
    const config = adminSessionConfigs[stKey] || {};

    const slotStatus = config.slotStatus || 'SCHEDULE';

    currentMonthDays.push({
      day,
      cellDate,
      dateStr,
      isPast,
      isToday,
      config,
      slotStatus
    });
  }

  const totalCellsRendered = firstDayIndex + totalDays;
  const nextDaysNeeded = (totalCellsRendered > 35 ? 42 : 35) - totalCellsRendered;
  const nextMonthDays = [];
  for (let j = 1; j <= nextDaysNeeded; j++) {
    nextMonthDays.push(j);
  }

  const handleCellClick = (item) => {
    if (item.isPast) return;
    if (item.slotStatus === 'SLOT_FULL') {
      setAlertModalState({
        isOpen: true,
        title: 'Slot Full / Blocked',
        message: 'This session slot is currently full or blocked by the administrator. Please select another available date.',
        icon: '🔒'
      });
    } else {
      setBookingModalDate(item.dateStr);
    }
  };

  if (!userSelectedState) {
    const states = [
      { code: 'up', name: 'Uttar Pradesh', icon: '🕌', accent: '#E52E06' },
      { code: 'goa', name: 'Goa', icon: '🌴', accent: '#10B981' },
      { code: 'delhi', name: 'Delhi', icon: '🏛️', accent: '#2563EB' },
      { code: 'raj', name: 'Rajasthan', icon: '🏰', accent: '#F59E0B' },
      { code: 'gujarat', name: 'Gujarat', icon: '🦁', accent: '#8B5CF6' }
    ];

    return (
      <>
        <Header isAdmin={false} activeStateName="" />
        <main>
          <div style={{
            textAlign: 'center', padding: '2.5rem 1.5rem 1.5rem'
          }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.4rem 0' }}>
              Select Your State Portal
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: 1.5, maxWidth: '500px', margin: '0 auto' }}>
              Choose your state to access the CPD schedule calendar, register school SPOCs, and book training sessions.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '1.25rem', padding: '1.5rem 2rem 3rem', maxWidth: '1100px', margin: '0 auto'
          }}>
            {states.map(st => (
              <a
                key={st.code}
                href={`/CPD-Scheduler/${st.code.toUpperCase()}`}
                className="state-directory-card"
                style={{
                  textDecoration: 'none', background: '#FFFFFF', borderRadius: '16px',
                  border: '1px solid #E2E8F0', borderTop: `4px solid ${st.accent}`,
                  padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                  gap: '0.75rem', transition: 'all 0.22s ease', cursor: 'pointer',
                  aspectRatio: '1 / 1', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
                }}
              >
                <div className="state-card-icon-wrapper" style={{
                  borderRadius: '14px',
                  background: `${st.accent}14`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center'
                }}>
                  {st.icon}
                </div>
                <div className="state-card-name" style={{ fontWeight: 800, color: '#0F172A' }}>
                  {st.name}
                </div>
                <div className="state-card-subtitle" style={{ color: '#64748B' }}>
                  CPD Scheduler Portal
                </div>
              </a>
            ))}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header isAdmin={false} activeStateName={activeStateName} activeStateCode={userSelectedState} />

      <main>
        {/* Floating Instruction Popup — AIM style */}
        <InstructionPopup />

        {/* Toolbar Navigation */}
        <div class="calendar-toolbar">
          <div class="current-month-display">
            <h2 class="month-title">{monthNames[month]} {year}</h2>
            <div class="nav-buttons">
              <button class="btn-nav" onClick={handlePrevMonth} title="Previous Month">&lt;</button>
              <button class="btn-today" onClick={handleToday}>Today</button>
              <button class="btn-nav" onClick={handleNextMonth} title="Next Month">&gt;</button>
            </div>
          </div>

          <div class="calendar-legend">
            <div class="legend-item"><span class="legend-dot available"></span><span>Schedule</span></div>
            <div class="legend-item"><span class="legend-dot fast"></span><span>Filling Fast</span></div>
            <div class="legend-item"><span class="legend-dot full"></span><span>Slot Full</span></div>
            <div class="legend-item"><span class="legend-dot past"></span><span>Past</span></div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div class="calendar-container">
          <div class="calendar-weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} class="weekday">{d}</div>
            ))}
          </div>

          <div class="calendar-days">
            {prevMonthDays.map(prevNum => (
              <div key={`prev-${prevNum}`} class="day-cell other-month">
                <span class="day-number">{prevNum}</span>
              </div>
            ))}

            {currentMonthDays.map(item => {
              let cellClass = 'day-cell';
              if (item.isToday) cellClass += ' is-today';

              if (item.isPast) {
                cellClass += ' day-past';
              } else if (item.slotStatus === 'SLOT_FULL') {
                cellClass += ' day-blocked';
              } else {
                cellClass += ' day-available';
              }

              const sessionTitle = item.config.sessionName;

              return (
                <div
                  key={`day-${item.day}`}
                  class={cellClass}
                  onClick={() => handleCellClick(item)}
                >
                  <div class="day-header">
                    <span class="day-number">{item.day}</span>
                  </div>

                  {item.isPast ? (
                    <div class="status-badge badge-past">Past</div>
                  ) : item.slotStatus === 'SLOT_FULL' ? (
                    <>
                      {sessionTitle && (
                        <div class="school-name-preview" title={sessionTitle} style={{ color: '#DC2626', fontWeight: 700 }}>
                          <span class="session-pill-tag" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' }}>
                            CPD
                          </span>
                          <span class="session-title-text">{sessionTitle}</span>
                        </div>
                      )}
                      <div class="status-badge badge-full">Slot Is Full</div>
                    </>
                  ) : (
                    <>
                      {sessionTitle && (
                        <div class="school-name-preview" title={sessionTitle} style={{ color: item.slotStatus === 'FILLING_FAST' ? '#D97706' : '#00897B', fontWeight: 700 }}>
                          <span class="session-pill-tag" style={{
                            background: item.slotStatus === 'FILLING_FAST' ? '#FFFBEB' : '#E6F9F6',
                            color: item.slotStatus === 'FILLING_FAST' ? '#D97706' : '#00897B',
                            border: item.slotStatus === 'FILLING_FAST' ? '1px solid #FDE68A' : '1px solid #B2DFDB'
                          }}>
                            CPD
                          </span>
                          <span class="session-title-text">{sessionTitle}</span>
                        </div>
                      )}
                      <div class={`status-badge ${item.slotStatus === 'FILLING_FAST' ? 'badge-fast' : 'badge-available'}`}>
                        {item.slotStatus === 'FILLING_FAST' ? 'Filling Fast' : 'Schedule'}
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {nextMonthDays.map(nextNum => (
              <div key={`next-${nextNum}`} class="day-cell other-month">
                <span class="day-number">{nextNum}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Booking Modal */}
      {bookingModalDate && (
        <BookingModal
          isOpen={Boolean(bookingModalDate)}
          dateStr={bookingModalDate}
          config={
            adminSessionConfigs[userSelectedState + '_' + bookingModalDate] ||
            adminSessionConfigs[bookingModalDate] ||
            {}
          }
          stateCode={userSelectedState}
          onClose={() => setBookingModalDate(null)}
          onSubmitSuccess={handleBookingSubmit}
        />
      )}

      {/* Custom Alert Modal */}
      <CustomAlertModal
        isOpen={alertModalState.isOpen}
        title={alertModalState.title}
        message={alertModalState.message}
        icon={alertModalState.icon}
        onClose={() => setAlertModalState(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
}
