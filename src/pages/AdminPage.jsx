import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import AdminLoginModal from '../components/AdminLoginModal';
import AdminConfigModal, { normalizeSessions } from '../components/AdminConfigModal';
import AdminViewBookingsModal from '../components/AdminViewBookingsModal';
import AdminEditBookingModal from '../components/AdminEditBookingModal';
import { fetchAdminDataFromBackend, postToBackend, broadcastLiveSync, subscribeLiveSync } from '../services/api';
import { Plus } from 'lucide-react';

function formatDateKey(year, month, day) {
  const m = month < 10 ? '0' + month : month;
  const d = day < 10 ? '0' + day : day;
  return `${year}-${m}-${d}`;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem('cpd_admin_logged_in') === 'true';
  });

  const [currentAdminState, setCurrentAdminState] = useState('CR');
  const [currentDate, setCurrentDate] = useState(new Date());

  const [adminSessionConfigs, setAdminSessionConfigs] = useState(() => {
    return JSON.parse(localStorage.getItem('cpd_admin_session_configs') || '{}');
  });
  const [adminBookings, setAdminBookings] = useState(() => {
    return JSON.parse(localStorage.getItem('cpd_admin_bookings') || '{}');
  });

  // Modal States
  const [configModalDate, setConfigModalDate] = useState(null);
  const [viewBookingsDate, setViewBookingsDate] = useState(null);
  const [editBookingData, setEditBookingData] = useState(null);

  const loadData = async () => {
    const data = await fetchAdminDataFromBackend();
    if (data) {
      const sConfigs = data.sessionConfigs || {};
      const sBookings = data.bookings || {};
      setAdminSessionConfigs(sConfigs);
      setAdminBookings(sBookings);
      localStorage.setItem('cpd_admin_session_configs', JSON.stringify(sConfigs));
      localStorage.setItem('cpd_admin_bookings', JSON.stringify(sBookings));
    }
  };

  const handleClearAllData = async () => {
    if (!window.confirm('⚠️ Are you sure you want to clear ALL test session titles and bookings across ALL states to start fresh?')) return;

    setAdminSessionConfigs({});
    setAdminBookings({});
    localStorage.removeItem('cpd_admin_session_configs');
    localStorage.removeItem('cpd_admin_bookings');
    localStorage.removeItem('cpd_booked_slots');

    broadcastLiveSync({ action: 'data_cleared' });

    await postToBackend({ action: 'clearAllData' });
    loadData();
  };

  useEffect(() => {
    document.title = 'CPD Admin';
    loadData();

    const interval = setInterval(loadData, 4000);
    const unsubscribe = subscribeLiveSync(() => {
      setAdminSessionConfigs(JSON.parse(localStorage.getItem('cpd_admin_session_configs') || '{}'));
      setAdminBookings(JSON.parse(localStorage.getItem('cpd_admin_bookings') || '{}'));
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('cpd_admin_logged_in');
    setIsLoggedIn(false);
  };

  const handleSaveConfig = async (data) => {
    const { dateStr, state, sessions, organiserName, sessionName, sessionTime, tutorialLink, slotStatus, teachersPresent } = data;
    const stKey = state + '_' + dateStr;

    const newConfig = {
      sessions: sessions || [],
      organiserName: organiserName || '',
      sessionName: sessionName || '',
      sessionTime: sessionTime || '',
      tutorialLink: tutorialLink || '',
      slotStatus: slotStatus || 'SCHEDULE',
      teachersPresent: teachersPresent || '',
      state: state
    };

    setAdminSessionConfigs(prev => {
      const next = { ...prev, [stKey]: newConfig, [dateStr]: newConfig };
      localStorage.setItem('cpd_admin_session_configs', JSON.stringify(next));
      return next;
    });

    broadcastLiveSync({ action: 'config_saved', dateStr, config: newConfig });

    await postToBackend({
      action: 'saveSessionConfig',
      sessionDate: dateStr,
      state: state,
      sessions: JSON.stringify(sessions || []),
      organiserName: organiserName,
      sessionName: sessionName,
      sessionTime: sessionTime,
      tutorialLink: tutorialLink,
      slotStatus: slotStatus,
      teachersPresent: teachersPresent
    });

    loadData();
  };

  const handleUpdateTeachersPresent = async (dateStr, teachersPresentVal) => {
    const stKey = currentAdminState + '_' + dateStr;
    const existing = adminSessionConfigs[stKey] || {};
    const existingNorm = normalizeSessions(existing);
    const updatedSessions = existingNorm.map(s => ({ ...s, teachersPresent: teachersPresentVal }));

    const updatedConfig = {
      ...existing,
      sessions: updatedSessions,
      sessionName: existing.sessionName || 'CPD Session',
      sessionTime: existing.sessionTime || '',
      tutorialLink: existing.tutorialLink || '',
      slotStatus: existing.slotStatus || 'SCHEDULE',
      teachersPresent: teachersPresentVal,
      state: currentAdminState
    };

    setAdminSessionConfigs(prev => {
      const next = { ...prev, [stKey]: updatedConfig, [dateStr]: updatedConfig };
      localStorage.setItem('cpd_admin_session_configs', JSON.stringify(next));
      return next;
    });

    broadcastLiveSync({ action: 'config_saved', dateStr, config: updatedConfig });

    await postToBackend({
      action: 'saveSessionConfig',
      sessionDate: dateStr,
      state: currentAdminState,
      sessionName: updatedConfig.sessionName,
      sessionTime: updatedConfig.sessionTime,
      tutorialLink: updatedConfig.tutorialLink,
      slotStatus: updatedConfig.slotStatus,
      teachersPresent: teachersPresentVal
    });

    loadData();
  };

  const handleSaveEditBooking = async (dateStr, index, bData) => {
    const stKey = currentAdminState !== 'ALL' ? (currentAdminState + '_' + dateStr) : dateStr;

    setAdminBookings(prev => {
      const next = { ...prev };
      if (next[stKey] && next[stKey][index]) {
        next[stKey][index] = { ...next[stKey][index], ...bData };
      }
      if (next[dateStr] && next[dateStr][index]) {
        next[dateStr][index] = { ...next[dateStr][index], ...bData };
      }
      localStorage.setItem('cpd_admin_bookings', JSON.stringify(next));
      return next;
    });

    broadcastLiveSync({ action: 'booking_updated', dateStr });

    await postToBackend({
      action: 'updateBooking',
      sessionDate: dateStr,
      state: currentAdminState !== 'ALL' ? currentAdminState : 'CR',
      index: index,
      bookingData: bData
    });

    loadData();
  };

  const handleDeleteBooking = async (dateStr, index) => {
    if (!window.confirm('Are you sure you want to delete this school booking?')) return;

    const stKey = currentAdminState !== 'ALL' ? (currentAdminState + '_' + dateStr) : dateStr;

    setAdminBookings(prev => {
      const next = { ...prev };
      if (next[stKey]) next[stKey].splice(index, 1);
      if (next[dateStr]) next[dateStr].splice(index, 1);
      localStorage.setItem('cpd_admin_bookings', JSON.stringify(next));
      return next;
    });

    broadcastLiveSync({ action: 'booking_deleted', dateStr });

    await postToBackend({
      action: 'deleteBooking',
      sessionDate: dateStr,
      state: currentAdminState !== 'ALL' ? currentAdminState : 'CR',
      index: index
    });

    loadData();
  };

  // Render Grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const prevMonthDays = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    prevMonthDays.push(prevMonthTotalDays - i);
  }

  const currentMonthDays = [];
  for (let day = 1; day <= totalDays; day++) {
    const dateStr = formatDateKey(year, month + 1, day);

    const stKey = currentAdminState + '_' + dateStr;
    const config = adminSessionConfigs[stKey] || {};
    const bookingsList = adminBookings[stKey] || [];

    const totalTeachers = bookingsList.reduce((acc, b) => acc + (parseInt(b.totalTeachers, 10) || 1), 0);

    currentMonthDays.push({
      day,
      dateStr,
      config,
      bookingsList,
      totalTeachers
    });
  }

  const totalCellsRendered = firstDayIndex + totalDays;
  const nextDaysNeeded = (totalCellsRendered > 35 ? 42 : 35) - totalCellsRendered;
  const nextMonthDays = [];
  for (let j = 1; j <= nextDaysNeeded; j++) {
    nextMonthDays.push(j);
  }

  const getExistingConfigForModal = (dateStr) => {
    return adminSessionConfigs[currentAdminState + '_' + dateStr] || null;
  };

  const getBookingsListForModal = (dateStr) => {
    return adminBookings[currentAdminState + '_' + dateStr] || [];
  };

  return (
    <>
      <AdminLoginModal isOpen={!isLoggedIn} onLoginSuccess={() => setIsLoggedIn(true)} />

      <Header isAdmin={true} onLogout={handleLogout} />

      <main>
        {/* Dedicated Standalone State Selector Control Section */}
        <section style={{
          margin: '1.5rem 0 1.75rem 0',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          border: '2px solid #CBD5E1', borderRadius: '20px',
          padding: '1.35rem 1.75rem',
          boxShadow: '0 8px 30px rgba(15, 23, 42, 0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: '1.25rem'
        }}>
          <div>
            <div style={{
              fontSize: '0.8rem', fontWeight: 800, color: '#E52E06',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'flex', alignItems: 'center', gap: '0.4rem'
            }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E52E06', display: 'inline-block', boxShadow: '0 0 8px #E52E06' }}></span>
              STATE DASHBOARD CONTROLLER
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: '0.25rem 0 0 0' }}>
              Select Active State Calendar
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            {[
              { code: 'CR', name: 'Chain/Retail' },
              { code: 'UP', name: 'Uttar Pradesh' },
              { code: 'GA', name: 'Goa' },
              { code: 'DL', name: 'Delhi' },
              { code: 'UT', name: 'Uttarakhand' },
              { code: 'GJ', name: 'Gujarat' }
            ].map(st => (
              <button
                key={st.code}
                type="button"
                className={`state-capsule-btn ${currentAdminState === st.code ? 'active' : ''}`}
                onClick={() => setCurrentAdminState(st.code)}
              >
                {currentAdminState === st.code && <span className="active-dot"></span>}
                {st.name}
              </button>
            ))}
          </div>
        </section>

        {/* Toolbar */}
        <div className="calendar-toolbar">
          <div className="current-month-display">
            <h2 className="month-title">{monthNames[month]} {year}</h2>
            <div className="nav-buttons">
              <button className="btn-nav" onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>&lt;</button>
              <button className="btn-today" onClick={() => setCurrentDate(new Date())}>Today</button>
              <button className="btn-nav" onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>&gt;</button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-container">
          <div className="calendar-weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="weekday">{d}</div>
            ))}
          </div>

          <div className="calendar-days">
            {prevMonthDays.map(prevNum => (
              <div key={`prev-${prevNum}`} className="day-cell other-month">
                <div className="day-header">
                  <span className="day-number">{prevNum}</span>
                </div>
              </div>
            ))}

            {currentMonthDays.map(item => {
              const normSessions = normalizeSessions(item.config);

              return (
                <div key={`day-${item.day}`} className="day-cell">
                  <div className="day-header">
                    <span className="day-number">{item.day}</span>
                    <button
                      type="button"
                      className="btn-add-session"
                      title="Setup CPD Session for this date"
                      onClick={() => setConfigModalDate(item.dateStr)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {normSessions.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      {normSessions.map((sess, sIdx) => {
                        const effStatus = getSessionEffectiveStatus(item.dateStr, sess);
                        const isEnded = effStatus === 'SESSION_COMPLETED';

                        return (
                          <div
                            key={sess.id || sIdx}
                            className="session-title-badge"
                            title={`${sess.sessionName}${sess.sessionTime ? ` (${sess.sessionTime})` : ''} - ${isEnded ? 'Ended' : effStatus}`}
                            onClick={() => setConfigModalDate(item.dateStr)}
                            style={{
                              display: 'flex', flexDirection: 'column', gap: '0.15rem',
                              borderLeft: isEnded ? '3px solid #64748B' : effStatus === 'SLOT_FULL' ? '3px solid #DC2626' : effStatus === 'FILLING_FAST' ? '3px solid #D97706' : '3px solid #E52E06',
                              padding: '0.35rem 0.45rem',
                              background: isEnded ? '#F1F5F9' : '#F8FAFC'
                            }}
                          >
                            <div style={{ fontWeight: 800, fontSize: '0.74rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isEnded ? '#64748B' : '#0F172A' }}>
                              {isEnded ? '⚫' : '🏷️'} {sess.sessionName || 'CPD Session'}
                            </div>
                            {sess.organiserName && (
                              <div style={{ fontSize: '0.67rem', color: isEnded ? '#94A3B8' : '#00897B', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                👤 {sess.organiserName}
                              </div>
                            )}
                            {sess.sessionTime && (
                              <div style={{ fontSize: '0.68rem', color: isEnded ? '#94A3B8' : '#64748B', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                ⏰ {sess.sessionTime} {isEnded && <span style={{ color: '#475569', fontWeight: 800 }}>(Ended)</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Quick inline + button to add more sessions */}
                      <button
                        type="button"
                        onClick={() => setConfigModalDate(item.dateStr)}
                        style={{
                          background: '#FFF1F0', border: '1px dashed #FFC4BC', color: '#E52E06',
                          fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.4rem', borderRadius: '4px',
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem',
                          marginTop: '0.1rem'
                        }}
                      >
                        <Plus size={11} /> Add Session
                      </button>
                    </div>
                  )}

                  {item.totalTeachers > 0 && (
                    <div
                      className="teacher-count-badge"
                      title="Click to view & edit registered school SPOCs"
                      onClick={() => setViewBookingsDate(item.dateStr)}
                    >
                      <span>👥 {item.totalTeachers} Teachers</span>
                      <span>({item.bookingsList.length} Schools)</span>
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

      {/* Admin Config Modal */}
      {configModalDate && (
        <AdminConfigModal
          isOpen={Boolean(configModalDate)}
          dateStr={configModalDate}
          currentAdminState={currentAdminState}
          existingConfig={getExistingConfigForModal(configModalDate)}
          onClose={() => setConfigModalDate(null)}
          onSave={handleSaveConfig}
        />
      )}

      {/* Admin View Bookings Modal */}
      {viewBookingsDate && (
        <AdminViewBookingsModal
          isOpen={Boolean(viewBookingsDate)}
          dateStr={viewBookingsDate}
          bookingsList={getBookingsListForModal(viewBookingsDate)}
          sessionConfig={getExistingConfigForModal(viewBookingsDate)}
          onClose={() => setViewBookingsDate(null)}
          onEdit={(dStr, idx, bData) => {
            setEditBookingData({ dateStr: dStr, index: idx, bookingData: bData });
          }}
          onDelete={handleDeleteBooking}
          onUpdateTeachersPresent={handleUpdateTeachersPresent}
        />
      )}

      {/* Admin Edit Booking Modal */}
      {editBookingData && (
        <AdminEditBookingModal
          isOpen={Boolean(editBookingData)}
          dateStr={editBookingData.dateStr}
          bookingIndex={editBookingData.index}
          bookingData={editBookingData.bookingData}
          onClose={() => setEditBookingData(null)}
          onSave={handleSaveEditBooking}
        />
      )}
    </>
  );
}
