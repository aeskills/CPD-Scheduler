/**
 * CPD Session Utility Functions
 */

/**
 * Normalizes session config into an array of session objects
 */
function isTimeRangeString(str) {
  if (!str || typeof str !== 'string') return false;
  const clean = str.trim().toUpperCase();
  if (clean.includes('AM') || clean.includes('PM')) return true;
  if (/\d{1,2}:\d{2}/.test(clean) && (clean.includes('-') || clean.includes('TO'))) return true;
  return false;
}

function isUrlString(str) {
  if (!str || typeof str !== 'string') return false;
  const clean = str.trim().toLowerCase();
  return clean.startsWith('http://') || clean.startsWith('https://');
}

function isStatusString(str) {
  if (!str || typeof str !== 'string') return false;
  const clean = str.trim().toUpperCase();
  return ['SCHEDULE', 'FILLING_FAST', 'SLOT_FULL', 'SESSION_COMPLETED'].includes(clean);
}

function cleanSessionObject(raw, idx, configDefaultOrg) {
  let org   = raw.organiserName || '';
  let name  = raw.sessionName || '';
  let time  = raw.sessionTime || '';
  let link  = raw.tutorialLink || '';
  let status = raw.slotStatus || 'SCHEDULE';
  let teachers = raw.teachersPresent || '';

  // Detect column shift from legacy 7-column layout
  if (isTimeRangeString(name) || isUrlString(time) || isStatusString(link)) {
    const actualName = org;
    const actualTime = name;
    const actualLink = isUrlString(time) ? time : (isUrlString(link) ? link : '');
    const actualStatus = isStatusString(link) ? link : (isStatusString(status) ? status : 'SCHEDULE');

    name = actualName;
    time = actualTime;
    link = actualLink;
    status = actualStatus;
    org = configDefaultOrg || 'Surbhi Tyagi';
  } else if (!org || org === name) {
    org = configDefaultOrg || 'Surbhi Tyagi';
  }

  return {
    id: raw.id || `s_${idx}_${Date.now()}`,
    organiserName: org || 'Surbhi Tyagi',
    sessionName: name || '',
    sessionTime: time || '',
    tutorialLink: link || '',
    slotStatus: status || 'SCHEDULE',
    teachersPresent: teachers || ''
  };
}

export function normalizeSessions(config) {
  if (!config) return [];
  const defaultOrg = config.organiserName || 'Surbhi Tyagi';

  if (Array.isArray(config.sessions) && config.sessions.length > 0) {
    return config.sessions.map((s, idx) => cleanSessionObject(s, idx, defaultOrg));
  }

  if (config.sessionName || config.organiserName) {
    return [cleanSessionObject({
      id: 's_default',
      organiserName: config.organiserName || '',
      sessionName: config.sessionName || '',
      sessionTime: config.sessionTime || '',
      tutorialLink: config.tutorialLink || '',
      slotStatus: config.slotStatus || 'SCHEDULE',
      teachersPresent: config.teachersPresent || ''
    }, 0, defaultOrg)];
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
