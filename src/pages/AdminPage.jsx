import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import AdminLoginModal from '../components/AdminLoginModal';
import AdminConfigModal from '../components/AdminConfigModal';
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

  const [currentAdminState, setCurrentAdminState] = useState('UP');
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
    const { dateStr, state, sessionName, tutorialLink, slotStatus } = data;
    const stKey = state + '_' + dateStr;

    const newConfig = { sessionName, tutorialLink, slotStatus, state };

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
      sessionName: sessionName,
      tutorialLink: tutorialLink,
      slotStatus: slotStatus
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
      state: currentAdminState !== 'ALL' ? currentAdminState : 'UP',
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
      state: currentAdminState !== 'ALL' ? currentAdminState : 'UP',
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
              { code: 'UP', name: 'Uttar Pradesh' },
              { code: 'GA', name: 'Goa' },
              { code: 'DL', name: 'Delhi' },
              { code: 'RJ', name: 'Rajasthan' },
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
        <div class="calendar-toolbar">
          <div class="current-month-display">
            <h2 class="month-title">{monthNames[month]} {year}</h2>
            <div class="nav-buttons">
              <button class="btn-nav" onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}>&lt;</button>
              <button class="btn-today" onClick={() => setCurrentDate(new Date())}>Today</button>
              <button class="btn-nav" onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}>&gt;</button>
            </div>
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
              const sessionTitle = item.config.sessionName;

              return (
                <div key={`day-${item.day}`} class="day-cell">
                  <div class="day-header">
                    <span class="day-number">{item.day}</span>
                    <button
                      type="button"
                      class="btn-add-session"
                      title="Setup CPD Session for this date"
                      onClick={() => setConfigModalDate(item.dateStr)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {sessionTitle && (
                    <div
                      class="session-title-badge"
                      title={sessionTitle}
                      onClick={() => setConfigModalDate(item.dateStr)}
                    >
                      🏷️ {sessionTitle}
                    </div>
                  )}

                  {item.totalTeachers > 0 && (
                    <div
                      class="teacher-count-badge"
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
              <div key={`next-${nextNum}`} class="day-cell other-month">
                <span class="day-number">{nextNum}</span>
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
          onClose={() => setViewBookingsDate(null)}
          onEdit={(dStr, idx, bData) => {
            setEditBookingData({ dateStr: dStr, index: idx, bookingData: bData });
          }}
          onDelete={handleDeleteBooking}
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
