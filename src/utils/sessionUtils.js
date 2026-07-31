/**
 * CPD Session Utility Functions
 */

/**
 * Normalizes session config into an array of session objects
 */
export function normalizeSessions(config) {
  if (!config) return [];
  if (Array.isArray(config.sessions) && config.sessions.length > 0) {
    return config.sessions.map((s, idx) => ({
      id: s.id || `s_${idx}_${Date.now()}`,
      organiserName: s.organiserName || config.organiserName || 'Surbhi Tyagi',
      sessionName: s.sessionName || '',
      sessionTime: s.sessionTime || '',
      tutorialLink: s.tutorialLink || config.tutorialLink || '',
      slotStatus: s.slotStatus || 'SCHEDULE',
      teachersPresent: s.teachersPresent || ''
    }));
  }
  if (config.sessionName || config.organiserName) {
    return [{
      id: 's_default',
      organiserName: config.organiserName || 'Surbhi Tyagi',
      sessionName: config.sessionName || '',
      sessionTime: config.sessionTime || '',
      tutorialLink: config.tutorialLink || '',
      slotStatus: config.slotStatus || 'SCHEDULE',
      teachersPresent: config.teachersPresent || ''
    }];
  }
  return [];
}

/**
 * Parses time string like "10:00 AM - 11:30 AM" or "02:00 PM" into hours and minutes.
 */
function parseTime12h(timeStr) {
  if (!timeStr) return null;
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)?/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const ampm = match[3];

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return { hours, minutes };
}

/**
 * Checks if a session has automatically ended based on dateStr and sessionTime
 */
export function isSessionExpired(dateStr, sessionTime) {
  if (!dateStr) return false;

  const parts = dateStr.split('-');
  if (parts.length < 3) return false;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const now = new Date();
  const todayZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateZero = new Date(year, month, day);

  // If the date is strictly in the past, all sessions are expired
  if (dateZero < todayZero) {
    return true;
  }

  // If the date is in the future, sessions are not expired yet
  if (dateZero > todayZero) {
    return false;
  }

  // Same day: check if sessionTime has ended
  if (!sessionTime || !sessionTime.trim()) return false;

  // Extract end time portion if there is a range ("10:00 AM - 11:30 AM" or "10:00 AM to 11:30 AM")
  let endTimeStr = sessionTime;
  if (sessionTime.includes('-')) {
    const rangeParts = sessionTime.split('-');
    endTimeStr = rangeParts[rangeParts.length - 1];
  } else if (sessionTime.toLowerCase().includes('to')) {
    const rangeParts = sessionTime.toLowerCase().split('to');
    endTimeStr = rangeParts[rangeParts.length - 1];
  }

  const parsedTime = parseTime12h(endTimeStr);
  if (!parsedTime) return false;

  const sessionEnd = new Date(year, month, day, parsedTime.hours, parsedTime.minutes, 0);

  return now > sessionEnd;
}

/**
 * Returns effective status for a session considering auto-expiration
 */
export function getSessionEffectiveStatus(dateStr, session) {
  if (!session) return 'SCHEDULE';
  if (session.slotStatus === 'SESSION_COMPLETED') return 'SESSION_COMPLETED';
  if (isSessionExpired(dateStr, session.sessionTime)) {
    return 'SESSION_COMPLETED';
  }
  return session.slotStatus || 'SCHEDULE';
}
