import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import BookingModal from '../components/BookingModal';
import CustomAlertModal from '../components/CustomAlertModal';
import { normalizeSessions, getSessionEffectiveStatus } from '../utils/sessionUtils';
import { fetchAdminDataFromBackend, postToBackend, broadcastLiveSync, subscribeLiveSync } from '../services/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const STATE_NAMES = {
  'CR': 'Chain/Retail',
  'UP': 'Uttar Pradesh',
  'GA': 'Goa',
  'DL': 'Delhi',
  'UT': 'Uttarakhand',
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
  'ut': 'UT',
  'uttarakhand': 'UT',
  'uttrakhand': 'UT',
  'raj': 'UT',
  'rajasthan': 'UT',
  'gujarat': 'GJ',
  'gj': 'GJ'
};

function InstructionPopup() {
  const [infoState, setInfoState] = useState('open'); // 'open' | 'capsule'

  useEffect(() => {
    if (infoState === 'open') {
      const timer = setTimeout(() => setInfoState('capsule'), 30000);
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
  const [selectedSessionId, setSelectedSessionId] = useState(null);
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
      sessionTime: bookingData.sessionTime,
      registrantType: bookingData.registrantType || 'SPOC',
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
    const config = adminSessionConfigs[stKey] || adminSessionConfigs[dateStr] || {};
    const normSessions = normalizeSessions(config);

    currentMonthDays.push({
      day,
      cellDate,
      dateStr,
      isPast,
      isToday,
      config,
      normSessions
    });
  }

  const totalCellsRendered = firstDayIndex + totalDays;
  const nextDaysNeeded = (totalCellsRendered > 35 ? 42 : 35) - totalCellsRendered;
  const nextMonthDays = [];
  for (let j = 1; j <= nextDaysNeeded; j++) {
    nextMonthDays.push(j);
  }

  const handleSessionClick = (item, sess) => {
    if (item.isPast) return;
    const effStatus = getSessionEffectiveStatus(item.dateStr, sess);

    if (effStatus === 'SESSION_COMPLETED') {
      setAlertModalState({
        isOpen: true,
        title: 'Session Ended / Completed',
        message: `The CPD session "${sess.sessionName}" ${sess.sessionTime ? `(${sess.sessionTime})` : ''} has ended and is no longer accepting new bookings.`,
        icon: '🏁'
      });
      return;
    }
    if (effStatus === 'SLOT_FULL') {
      setAlertModalState({
        isOpen: true,
        title: 'Slot Full / Blocked',
        message: `The session slot "${sess.sessionName}" is currently full or blocked by the administrator. Please select another session slot.`,
        icon: '🔒'
      });
      return;
    }
    setSelectedSessionId(sess.id);
    setBookingModalDate(item.dateStr);
  };

  if (!userSelectedState) {
    const states = [
      { code: 'up', name: 'Uttar Pradesh', icon: '🕌', accent: '#E52E06' },
      { code: 'goa', name: 'Goa', icon: '🌴', accent: '#10B981' },
      { code: 'delhi', name: 'Delhi', icon: '🏛️', accent: '#2563EB' },
      { code: 'ut', name: 'Uttarakhand', icon: '🏔️', accent: '#F59E0B' },
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
              <div key={`prev-${prevNum}`} className="day-cell other-month">
                <div className="day-header">
                  <span className="day-number">{prevNum}</span>
                </div>
              </div>
            ))}

            {currentMonthDays.map(item => {
              const hasActivity = item.normSessions.length > 0;

              let cellClass = 'day-cell';
              if (item.isToday) cellClass += ' is-today';

              return (
                <div
                  key={`day-${item.day}`}
                  className={cellClass}
                  style={{ cursor: hasActivity ? 'pointer' : 'default' }}
                >
                  <div className="day-header">
                    <span className="day-number">{item.day}</span>
                  </div>

                  {/* Render list of sessions scheduled for this date */}
                  {hasActivity && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {item.normSessions.map((sess, sIdx) => {
                        const effStatus = getSessionEffectiveStatus(item.dateStr, sess);
                        const isEnded = effStatus === 'SESSION_COMPLETED';

                        const rawTitle = sess.sessionName || 'CPD Session';
                        const displayTitle = rawTitle.startsWith('http') ? 'CPD Session' : rawTitle;

                        return (
                          <div
                            key={sess.id || sIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSessionClick(item, sess);
                            }}
                            style={{
                              background: isEnded ? '#F8FAFC' : '#FFFFFF',
                              border: isEnded ? '1px solid #CBD5E1' : '1px solid #E2E8F0',
                              borderRadius: '8px',
                              padding: '0.45rem 0.5rem',
                              transition: 'all 0.15s ease',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                              minWidth: 0,
                              maxWidth: '100%',
                              width: '100%',
                              overflow: 'hidden',
                              wordBreak: 'break-word',
                              boxSizing: 'border-box'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.borderColor = isEnded ? '#94A3B8' : '#FFC4BC'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.borderColor = isEnded ? '#CBD5E1' : '#E2E8F0'; e.currentTarget.style.transform = 'none'; }}
                          >
                            <div className="school-name-preview" title={displayTitle} style={{ color: isEnded ? '#64748B' : effStatus === 'SLOT_FULL' ? '#DC2626' : effStatus === 'FILLING_FAST' ? '#D97706' : '#00897B', fontWeight: 700, margin: 0, minWidth: 0, maxWidth: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
                              <span className="session-pill-tag" style={{
                                background: isEnded ? '#F1F5F9' : effStatus === 'SLOT_FULL' ? '#FEF2F2' : effStatus === 'FILLING_FAST' ? '#FFFBEB' : '#E6F9F6',
                                color: isEnded ? '#64748B' : effStatus === 'SLOT_FULL' ? '#DC2626' : effStatus === 'FILLING_FAST' ? '#D97706' : '#00897B',
                                border: isEnded ? '1px solid #CBD5E1' : effStatus === 'SLOT_FULL' ? '1px solid #FECACA' : effStatus === 'FILLING_FAST' ? '1px solid #FDE68A' : '1px solid #B2DFDB',
                                flexShrink: 0
                              }}>
                                CPD
                              </span>
                              <span className="session-title-text" style={{ textDecoration: isEnded ? 'line-through' : 'none', minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', wordBreak: 'break-all' }}>{displayTitle}</span>
                            </div>

                            {/* PROMINENT TIME DISPLAY */}
                            {sess.sessionTime && (
                              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: isEnded ? '#94A3B8' : '#334155', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.25rem', minWidth: 0, maxWidth: '100%', overflow: 'hidden' }}>
                                <span style={{ flexShrink: 0 }}>⏰</span>
                                <span style={{ minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', wordBreak: 'break-all' }}>{sess.sessionTime.startsWith('http') ? sess.sessionTime.substring(0, 20) + '...' : sess.sessionTime}</span>
                              </div>
                            )}

                            {item.isPast ? (
                              <div className="status-badge badge-past" style={{ marginTop: '0.3rem' }}>Past</div>
                            ) : isEnded ? (
                              <div className="status-badge" style={{ background: '#475569', color: '#FFFFFF', border: '1px solid #334155', marginTop: '0.3rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>SESSION ENDED</div>
                            ) : effStatus === 'SLOT_FULL' ? (
                              <div className="status-badge badge-full" style={{ marginTop: '0.3rem' }}>Slot Is Full</div>
                            ) : (
                              <div className={`status-badge ${effStatus === 'FILLING_FAST' ? 'badge-fast' : 'badge-available'}`} style={{ marginTop: '0.3rem' }}>
                                {effStatus === 'FILLING_FAST' ? 'Filling Fast' : 'Schedule'}
                              </div>
                            )}

                            {/* Meeting Link Button */}
                            {sess.tutorialLink && !isEnded && !item.isPast && (
                              <a
                                href={sess.tutorialLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  marginTop: '0.3rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  gap: '0.25rem', background: '#2563EB', color: '#FFFFFF', borderRadius: '5px',
                                  padding: '0.22rem 0.5rem', fontSize: '0.7rem', fontWeight: 800, textDecoration: 'none',
                                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)', width: '100%', maxWidth: '100%',
                                  boxSizing: 'border-box', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis'
                                }}
                              >
                                🔗 Meeting Link
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {nextMonthDays.map(nextNum => (
              <div key={`next-${nextNum}`} className="day-cell other-month">
                <div className="day-header">
                  <span className="day-number">{nextNum}</span>
                </div>
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
          initialSessionId={selectedSessionId}
          stateCode={userSelectedState}
          onClose={() => { setBookingModalDate(null); setSelectedSessionId(null); }}
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
