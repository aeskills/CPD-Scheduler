/**
 * CPD Scheduler & Admin Portal Backend (Code.gs)
 * AE Skills Portal (aeskills.github.io/CPD)
 *
 * Professional Multi-State Architecture:
 * 1. Admin Sessions Sheet ("Admin Sessions"):
 *    Row 1: Merged State Headers (A-E: Chain/Retail, F-J: UP, K-O: Goa, P-T: Delhi, U-Y: Rajasthan, Z-AD: Gujarat)
 *    Row 2: Sub-headers (Timestamp | Session Date | Session Name | Tutorial Link | Slot Status)
 *
 * 2. Per-State Booking Tabs:
 *    - "CPD Bookings (Chain/Retail)"
 *    - "CPD Bookings (UP)"
 *    - "CPD Bookings (GA)"
 *    - "CPD Bookings (DL)"
 *    - "CPD Bookings (RJ)"
 *    - "CPD Bookings (GJ)"
 *    Columns: A: Timestamp | B: Session Date | C: Session Name | D: SPOC Name | E: SPOC Phone | F: SPOC Email | G: School Name | H: Total Teachers | I: Reminder Sent | J: Teams Link
 */

const SHEET_BOOKINGS_NAME = 'CPD Bookings';
const SHEET_ADMIN_TAB_NAME = 'Admin Sessions';
const DEFAULT_TEAMS_MEETING_LINK = 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_CPDSession_AEskills%40thread.v2/0';

const STATE_TAB_MAP = {
  'CR': 'CPD Bookings (Chain/Retail)',
  'UP': 'CPD Bookings (UP)',
  'GA': 'CPD Bookings (GA)',
  'DL': 'CPD Bookings (DL)',
  'RJ': 'CPD Bookings (RJ)',
  'GJ': 'CPD Bookings (GJ)'
};

const STATE_COL_OFFSETS = {
  'CR': 1,
  'UP': 7,
  'GA': 13,
  'DL': 19,
  'RJ': 25,
  'GJ': 31
};

/**
 * Handle incoming GET requests
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? safeString(e.parameter.action) : 'getBookings';

    setupAdminSessionsLayout();

    const sessionConfigs = fetchAdminSessionsMap();
    const bookingsMap = fetchBookingsMap(action === 'getAdminData');

    if (action === 'getAdminData') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        sessionConfigs: sessionConfigs,
        bookings: bookingsMap
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const publicBookingsList = [];
    Object.keys(bookingsMap).forEach(stKey => {
      const list = bookingsMap[stKey];
      list.forEach(b => {
        if (b.schoolName && b.schoolName !== 'undefined') {
          const parts = stKey.split('_');
          const st = parts.length > 1 ? parts[0] : (b.state || 'UP');
          const dateVal = parts.length > 1 ? parts[1] : stKey;

          publicBookingsList.push({
            date: dateVal,
            state: st,
            sessionName: b.sessionName || (sessionConfigs[stKey] ? sessionConfigs[stKey].sessionName : 'CPD Session'),
            schoolName: b.schoolName || 'Scheduled School',
            spocName: b.spocName || 'SPOC Contact'
          });
        }
      });
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      sessionConfigs: sessionConfigs,
      bookings: publicBookingsList
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle incoming POST requests
 */
function doPost(e) {
  try {
    let payload;
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      payload = e.parameter;
    } else {
      throw new Error('No post payload received');
    }

    const action = safeString(payload.action) || 'createBooking';
    const state = safeString(payload.state || 'CR').toUpperCase();

    setupAdminSessionsLayout();

    // CLEAR ALL DATA & START FRESH
    if (action === 'clearAllData') {
      const adminSheet = setupAdminSessionsLayout();
      const lastAdminRow = adminSheet.getLastRow();
      if (lastAdminRow >= 3) {
        adminSheet.deleteRows(3, lastAdminRow - 2);
      }

      ['CR', 'UP', 'GA', 'DL', 'RJ', 'GJ'].forEach(st => {
        const bSheet = getOrCreateBookingsSheet(st);
        const lastBRow = bSheet.getLastRow();
        if (lastBRow >= 2) {
          bSheet.deleteRows(2, lastBRow - 1);
        }
      });

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'All session configurations and bookings cleared. Fresh start initialized.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 1. Admin Saving Session Title, Tutorial Link & Slot Status into "Admin Sessions" Tab
    if (action === 'saveSessionConfig') {
      const dateStr = safeString(payload.sessionDate);
      const sessionName = safeString(payload.sessionName);
      const tutorialLink = safeString(payload.tutorialLink);
      const slotStatus = safeString(payload.slotStatus) || 'SCHEDULE';
      const teachersPresent = safeString(payload.teachersPresent);

      if (!dateStr || !sessionName) {
        throw new Error('Missing session date or session name');
      }

      saveAdminSessionToSheet(dateStr, sessionName, tutorialLink, slotStatus, teachersPresent, state);

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Admin session configuration saved for ' + state + ' on ' + dateStr
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Admin Updating an Existing Booking Record
    if (action === 'updateBooking') {
      const dateStr = safeString(payload.sessionDate);
      const index = parseInt(payload.index, 10);
      const bData = payload.bookingData;

      if (!dateStr || isNaN(index) || !bData) {
        throw new Error('Invalid update parameters');
      }

      updateBookingInSheet(dateStr, index, bData, state);

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Booking record updated successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Admin Deleting a Booking Record
    if (action === 'deleteBooking') {
      const dateStr = safeString(payload.sessionDate);
      const index = parseInt(payload.index, 10);

      if (!dateStr || isNaN(index)) {
        throw new Error('Invalid delete parameters');
      }

      deleteBookingFromSheet(dateStr, index, state);

      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Booking deleted successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. Create New Booking (SPOC or Teacher)
    const sessionDate    = safeString(payload.sessionDate);
    const registrantType = safeString(payload.registrantType || 'SPOC'); // 'SPOC' or 'Teacher'
    const spocName       = safeString(payload.spocName || payload.name);
    const spocPhone      = safeString(payload.spocPhone || payload.phone);
    const spocEmail      = safeString(payload.spocEmail || payload.email);
    const schoolName     = safeString(payload.schoolName);
    let totalTeachers    = safeString(payload.totalTeachers);

    if (registrantType === 'Teacher') {
      totalTeachers = '1';
    } else if (!totalTeachers) {
      totalTeachers = '1';
    }

    const configsMap = fetchAdminSessionsMap();
    const activeConfig = configsMap[state + '_' + sessionDate] || {};
    if (activeConfig.slotStatus === 'SLOT_FULL') {
      throw new Error('Booking Closed: This slot has been marked as full or blocked by the administrator.');
    }

    if (!sessionDate || !spocName || !spocEmail || !schoolName) {
      throw new Error('Invalid submission: Missing required booking details.');
    }

    const sessionName = activeConfig.sessionName || safeString(payload.sessionName) || 'CPD Session';
    const teamsLink = activeConfig.tutorialLink || DEFAULT_TEAMS_MEETING_LINK;

    const sheet = getOrCreateBookingsSheet(state);
    const timestamp = new Date();
    const reminderSent = 'N';

    sheet.appendRow([
      timestamp,       // Col A: Timestamp
      registrantType,  // Col B: Type ('SPOC' or 'Teacher')
      sessionDate,     // Col C: Session Date
      sessionName,     // Col D: Session Name
      spocName,        // Col E: Name
      spocPhone,       // Col F: Phone
      spocEmail,       // Col G: Email
      schoolName,      // Col H: School Name
      totalTeachers,   // Col I: Total Teachers (empty for Teacher)
      reminderSent,    // Col J: Reminder Sent (Y/N)
      teamsLink        // Col K: Teams Link
    ]);

    formatSheetColumns(sheet, 11);

    sendConfirmationEmail({
      sessionName: sessionName,
      registrantType: registrantType,
      spocName: spocName,
      spocEmail: spocEmail,
      schoolName: schoolName,
      sessionDate: sessionDate,
      totalTeachers: totalTeachers,
      teamsLink: teamsLink,
      state: state
    });

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Booking scheduled and confirmation email sent.',
      sessionDate: sessionDate,
      sessionName: sessionName
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Send Immediate Confirmation Email
 */
function sendConfirmationEmail(details) {
  const formattedDate = formatHumanReadableDate(details.sessionDate);
  const sessionTitle = details.sessionName || 'CPD Session';
  const subject = `Confirmed: ${sessionTitle} (${details.state || 'CPD'}) — ${formattedDate}`;

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f7fa; color: #1e293b; margin: 0; padding: 20px; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
        .header { background: #0A1628; color: #ffffff; padding: 24px; text-align: center; }
        .header h2 { margin: 0; font-size: 22px; color: #E52E06; }
        .header p { margin: 6px 0 0 0; color: #94A3B8; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
        .content { padding: 28px; line-height: 1.6; font-size: 15px; }
        .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; }
        .btn-container { text-align: center; margin: 30px 0 20px 0; }
        .btn-join { background: #E52E06; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 50px; font-weight: 700; display: inline-block; font-size: 16px; box-shadow: 0 4px 12px rgba(229,46,6,0.3); }
        .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h2>${escapeHtml(sessionTitle)} Confirmed</h2>
          <p>AE Skills Professional Development (${escapeHtml(details.state || 'CPD')})</p>
        </div>
        <div class="content">
          <p>Dear <strong>${escapeHtml(details.spocName)}</strong>,</p>
          <p>Thank you for scheduling your school's CPD session with AE Skills! We are pleased to confirm your registration for <strong>${escapeHtml(sessionTitle)}</strong>.</p>
          
          <div class="details-box">
            <div style="font-weight: 600; color: #0A1628; margin-bottom: 10px; font-size: 14px; text-transform: uppercase;">Session Details</div>
            <div><strong>Session Name:</strong> <span style="color: #E52E06; font-weight: 700;">${escapeHtml(sessionTitle)}</span></div>
            <div><strong>School Name:</strong> ${escapeHtml(details.schoolName)}</div>
            <div><strong>Scheduled Date:</strong> ${formattedDate}</div>
            <div><strong>Teachers Attending:</strong> ${escapeHtml(details.totalTeachers)}</div>
          </div>

          <p>Please use the button below to join the virtual Microsoft Teams meeting on your scheduled date:</p>

          <div class="btn-container">
            <a href="${details.teamsLink}" class="btn-join" target="_blank">Join Microsoft Teams Session</a>
          </div>

          <p style="margin-top: 25px;">
            Warm regards,<br>
            <strong>The AE Skills CPD Team</strong>
          </p>
        </div>
        <div class="footer">
          AE Skills CPD Portal &bull; <a href="https://aeskills.github.io/CPD/" style="color: #E52E06;">aeskills.github.io/CPD</a>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    MailApp.sendEmail({
      to: details.spocEmail,
      subject: subject,
      body: `Confirmed: ${sessionTitle} for ${details.schoolName} on ${formattedDate}. Teams Link: ${details.teamsLink}`,
      htmlBody: htmlBody
    });
  } catch (emailErr) {
    Logger.log('Confirmation email note: ' + emailErr.toString());
  }
}

/**
 * Sheet Helper 1: "Admin Sessions" Tab (Strict State Isolation & Timezone Precision)
 */
function fetchAdminSessionsMap() {
  const sheet = setupAdminSessionsLayout();
  const data = sheet.getDataRange().getValues();
  const map = {};

  const stateKeys = ['CR', 'UP', 'GA', 'DL', 'RJ', 'GJ'];

  for (let r = 2; r < data.length; r++) {
    const row = data[r];
    for (let sIdx = 0; sIdx < stateKeys.length; sIdx++) {
      const st = stateKeys[sIdx];
      const colOffset = STATE_COL_OFFSETS[st] - 1;

      let rDate = row[colOffset + 1];
      const sessionName = safeString(row[colOffset + 2]);
      const tutorialLink = safeString(row[colOffset + 3]);
      const slotStatus = safeString(row[colOffset + 4]) || 'SCHEDULE';
      const teachersPresent = safeString(row[colOffset + 5]);

      if (rDate) {
        rDate = formatDateISO(rDate);

        if (rDate && rDate.length >= 10 && sessionName) {
          const cleanDate = rDate.substring(0, 10);
          map[st + '_' + cleanDate] = {
            sessionName: sessionName,
            tutorialLink: tutorialLink,
            slotStatus: slotStatus,
            teachersPresent: teachersPresent,
            state: st
          };
        }
      }
    }
  }

  return map;
}

function saveAdminSessionToSheet(dateStr, sessionName, tutorialLink, slotStatus, teachersPresent, state) {
  const sheet = setupAdminSessionsLayout();
  const st = (state || 'CR').toUpperCase();
  const colOffset = STATE_COL_OFFSETS[st] || 1;

  const data = sheet.getDataRange().getValues();
  const statusVal = slotStatus || 'SCHEDULE';
  const timestamp = new Date();

  let targetRow = -1;

  // 1. Search if dateStr already exists for target state
  for (let r = 2; r < data.length; r++) {
    let rDate = data[r][colOffset]; // date column for state (0-indexed)
    if (rDate) {
      rDate = formatDateISO(rDate);
      if (rDate && rDate.substring(0, 10) === dateStr) {
        targetRow = r + 1; // 1-indexed row
        break;
      }
    }
  }

  // 2. If date not found, find the first available row (starting at Row 3) where this state's date cell is empty!
  if (targetRow === -1) {
    for (let r = 2; r < data.length; r++) {
      let rDate = data[r][colOffset];
      if (!rDate || safeString(rDate) === '') {
        targetRow = r + 1;
        break;
      }
    }
  }

  // 3. If no empty row exists in existing range, target the next new row directly
  if (targetRow === -1) {
    targetRow = data.length < 2 ? 3 : data.length + 1;
  }

  // Set values directly into targetRow at colOffset (6 columns: Timestamp, Date, Name, Link, Status, Total Teacher Present in Session)
  sheet.getRange(targetRow, colOffset).setValue(timestamp);
  sheet.getRange(targetRow, colOffset + 1).setValue(dateStr);
  sheet.getRange(targetRow, colOffset + 2).setValue(sessionName);
  sheet.getRange(targetRow, colOffset + 3).setValue(tutorialLink);
  sheet.getRange(targetRow, colOffset + 4).setValue(statusVal);
  sheet.getRange(targetRow, colOffset + 5).setValue(safeString(teachersPresent));

  formatSheetColumns(sheet, 36);
}

function updateBookingInSheet(dateStr, index, bData, state) {
  const sheet = getOrCreateBookingsSheet(state);
  const data = sheet.getDataRange().getValues();
  let matchCount = 0;
  const is11Col = data.length > 0 && safeString(data[0][1]) === 'Type';

  for (let i = 1; i < data.length; i++) {
    let rDate = is11Col ? data[i][2] : data[i][1];
    if (rDate) {
      rDate = formatDateISO(rDate);
      if (rDate && rDate.substring(0, 10) === dateStr) {
        if (matchCount === index) {
          const typeVal = bData.registrantType || (is11Col ? safeString(data[i][1]) : 'SPOC');
          const tTeachers = typeVal === 'Teacher' ? '1' : (bData.totalTeachers || '1');

          if (is11Col) {
            sheet.getRange(i + 1, 2).setValue(typeVal);
            sheet.getRange(i + 1, 5).setValue(bData.spocName);
            sheet.getRange(i + 1, 6).setValue(bData.spocPhone);
            sheet.getRange(i + 1, 7).setValue(bData.spocEmail);
            sheet.getRange(i + 1, 8).setValue(bData.schoolName);
            sheet.getRange(i + 1, 9).setValue(tTeachers);
          } else {
            sheet.getRange(i + 1, 4).setValue(bData.spocName);
            sheet.getRange(i + 1, 5).setValue(bData.spocPhone);
            sheet.getRange(i + 1, 6).setValue(bData.spocEmail);
            sheet.getRange(i + 1, 7).setValue(bData.schoolName);
            sheet.getRange(i + 1, 8).setValue(tTeachers);
          }
          break;
        }
        matchCount++;
      }
    }
  }
}

function deleteBookingFromSheet(dateStr, index, state) {
  const sheet = getOrCreateBookingsSheet(state);
  const data = sheet.getDataRange().getValues();
  let matchCount = 0;
  const is11Col = data.length > 0 && safeString(data[0][1]) === 'Type';

  for (let i = 1; i < data.length; i++) {
    let rDate = is11Col ? data[i][2] : data[i][1];
    if (rDate) {
      rDate = formatDateISO(rDate);
      if (rDate && rDate.substring(0, 10) === dateStr) {
        if (matchCount === index) {
          sheet.deleteRow(i + 1);
          break;
        }
        matchCount++;
      }
    }
  }
}

/**
 * Sheet Helper 2: Per-State Bookings Map Parser (Strict State Isolation & Timezone Precision)
 */
function fetchBookingsMap(includeAdminDetails) {
  const states = ['CR', 'UP', 'GA', 'DL', 'RJ', 'GJ'];
  const map = {};

  states.forEach(st => {
    const sheet = getOrCreateBookingsSheet(st);
    const data = sheet.getDataRange().getValues();
    const is11Col = data.length > 0 && safeString(data[0][1]) === 'Type';

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      let rowDate = is11Col ? row[2] : row[1];

      if (rowDate) {
        rowDate = formatDateISO(rowDate);

        if (rowDate && rowDate.length >= 10) {
          const cleanDate = rowDate.substring(0, 10);
          let registrantType = is11Col ? safeString(row[1]) : 'SPOC';
          if (!registrantType) registrantType = 'SPOC';

          let sessionName   = is11Col ? safeString(row[3]) : safeString(row[2]);
          let spocName      = is11Col ? safeString(row[4]) : safeString(row[3]);
          let spocPhone     = is11Col ? safeString(row[5]) : safeString(row[4]);
          let spocEmail     = is11Col ? safeString(row[6]) : safeString(row[5]);
          let schoolName    = is11Col ? safeString(row[7]) : safeString(row[6]);
          let totalTeachers = is11Col ? safeString(row[8]) : safeString(row[7]);

          if (!schoolName) schoolName = 'Registered School';
          if (!spocName || spocName === 'undefined') spocName = schoolName;

          const dateKey = st + '_' + cleanDate;
          if (!map[dateKey]) map[dateKey] = [];

          const bItem = {
            sessionName: sessionName || 'CPD Session',
            registrantType: registrantType,
            spocName: spocName,
            spocPhone: spocPhone,
            spocEmail: spocEmail,
            schoolName: schoolName,
            totalTeachers: registrantType === 'Teacher' ? '1' : (totalTeachers || '1'),
            state: st
          };

          map[dateKey].push(bItem);
        }
      }
    }
  });

  return map;
}

/**
 * Get or Create Per-State Bookings Sheet (11-column layout)
 */
function getOrCreateBookingsSheet(state) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const st = (state || 'CR').toUpperCase();
  const tabName = STATE_TAB_MAP[st] || `CPD Bookings (${st})`;

  let sheet = ss.getSheetByName(tabName);
  
  const subHeaders = [
    'Timestamp',
    'Type',
    'Session Date',
    'Session Name',
    'Name',
    'Phone',
    'Email',
    'School Name',
    'Total Teachers',
    'Reminder Sent',
    'Teams Link'
  ];

  if (!sheet) {
    sheet = ss.insertSheet(tabName);
    sheet.appendRow(subHeaders);
    formatSheetColumns(sheet, 11);
  } else {
    // If existing sheet has 10 columns, auto-upgrade header to 11 columns
    const col2Header = safeString(sheet.getRange(1, 2).getValue());
    if (col2Header !== 'Type') {
      upgradeBookingsSheetHeaders(sheet);
    }
  }

  return sheet;
}

/**
 * Upgrade existing 10-column booking sheet to 11-column layout (inserts Type column at Col B)
 */
function upgradeBookingsSheetHeaders(sheet) {
  if (!sheet) return;
  const col2Header = safeString(sheet.getRange(1, 2).getValue());
  if (col2Header === 'Type') return;

  sheet.insertColumnBefore(2);

  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    const types = [];
    for (let i = 2; i <= lastRow; i++) {
      types.push(['SPOC']);
    }
    sheet.getRange(2, 2, types.length, 1).setValues(types);
  }

  const subHeaders = [
    ['Timestamp', 'Type', 'Session Date', 'Session Name', 'Name', 'Phone', 'Email', 'School Name', 'Total Teachers', 'Reminder Sent', 'Teams Link']
  ];
  sheet.getRange(1, 1, 1, 11).setValues(subHeaders);
  sheet.getRange(1, 1, 1, 11).setBackground('#0F172A').setFontColor('#00D2C4').setFontWeight('bold');

  formatSheetColumns(sheet, 11);
}

/**
 * Standalone Helper: Upgrades all per-state booking tabs to 11 columns
 */
function runBookingsSheetUpgrade() {
  const states = ['CR', 'UP', 'GA', 'DL', 'RJ', 'GJ'];
  states.forEach(st => {
    const sheet = getOrCreateBookingsSheet(st);
    upgradeBookingsSheetHeaders(sheet);
  });
  Logger.log('All per-state booking sheets upgraded to 11-column layout with Type.');
}

/**
 * Get or Create Merged Admin Sessions Sheet (6-State Layout including Chain/Retail)
 */
function setupAdminSessionsLayout() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ADMIN_TAB_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ADMIN_TAB_NAME);
  }

  // Ensure sheet dimension has at least 36 columns (cols A to AJ)
  const maxCols = sheet.getMaxColumns();
  if (maxCols < 36) {
    sheet.insertColumnsAfter(maxCols, 36 - maxCols);
  }

  const col6Val = safeString(sheet.getRange(2, 6).getValue());
  const needsHeaderUpdate = (sheet.getLastRow() < 2) || (col6Val !== 'Total Teacher Present in Session');

  if (needsHeaderUpdate) {
    runHeaderUpgrade();
  }

  return sheet;
}

/**
 * Standalone Helper: Run this function directly in Apps Script Editor to upgrade headers to 36 columns
 */
function runHeaderUpgrade() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_ADMIN_TAB_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_ADMIN_TAB_NAME);
  }

  // Ensure sheet dimension has at least 36 columns (cols A to AJ)
  const maxCols = sheet.getMaxColumns();
  if (maxCols < 36) {
    sheet.insertColumnsAfter(maxCols, 36 - maxCols);
  }

  // Unmerge previous 5-column merged headers in Row 1
  try {
    sheet.getRange(1, 1, 1, Math.max(maxCols, 36)).breakApart();
  } catch (e) {}

  const stateDisplayNames = ['Chain/Retail', 'UP', 'Goa', 'Delhi', 'Rajasthan', 'Gujarat'];
  const subHeaders = [];
  for (let i = 0; i < 6; i++) {
    subHeaders.push('Timestamp', 'Session Date', 'Session Name', 'Tutorial Link', 'Slot Status', 'Total Teacher Present in Session');
  }

  // Merge 6 columns per state in Row 1
  for (let i = 0; i < 6; i++) {
    const startCol = i * 6 + 1;
    const range = sheet.getRange(1, startCol, 1, 6);
    try { range.merge(); } catch (e) {}
    range.setValue(stateDisplayNames[i]);
    range.setBackground('#DC2626');
    range.setFontColor('#FFFFFF');
    range.setFontWeight('bold');
    range.setFontSize(11);
    range.setHorizontalAlignment('center');
  }

  // Write Row 2 Subheaders
  const row2Range = sheet.getRange(2, 1, 1, 36);
  row2Range.setValues([subHeaders]);
  row2Range.setBackground('#0F172A');
  row2Range.setFontColor('#00D2C4');
  row2Range.setFontWeight('bold');
  row2Range.setFontSize(9);
  row2Range.setHorizontalAlignment('center');

  formatSheetColumns(sheet, 36);
}

function formatSheetColumns(sheet, totalCols) {
  try {
    for (let c = 1; c <= totalCols; c++) {
      sheet.autoResizeColumn(c);
    }
  } catch (e) {
    Logger.log('Formatting note: ' + e.toString());
  }
}

/**
 * Strict Timezone-Aware ISO Date Formatter
 */
function formatDateISO(dateObj) {
  if (!dateObj) return '';
  if (typeof dateObj === 'string') return dateObj.trim().split('T')[0];
  try {
    const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || "Asia/Kolkata";
    return Utilities.formatDate(dateObj, tz, "yyyy-MM-dd");
  } catch (e) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

function formatHumanReadableDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length < 3) return dateStr;
  
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  return `${days[dateObj.getDay()]}, ${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function safeString(val) {
  if (val === undefined || val === null || val === 'undefined' || val === 'null') return '';
  return String(val).trim();
}
