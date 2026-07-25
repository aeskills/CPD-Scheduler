# CPD Session Scheduler & Admin Portal

A web-based **CPD (Continuing Professional Development) Session Scheduler** built for **AE Skills Portal** ([aeskills.github.io/CPD](https://aeskills.github.io/CPD/)).

---

## 🌟 Key Features

1. **Teacher Booking Portal (`scheduler.html`)**:
   - Allows school SPOCs to view available dates and register their teachers.
   - Automatically uses the **Admin-Configured Session Title & Tutorial Link** set for each date.
   - DPDP Act 2023 compliant (Explicit data processing consent, no public exposure of phone numbers or emails).

2. **Password-Protected Admin Portal (`admin.html`)**:
   - **Access Credentials**: Username: `admin` | Password: `7777`
   - **Plus (+) Icon on Every Date Cell**: Configure Session Title & Tutorial/Meeting Link.
   - **Teacher Count Summary**: Displays total booked teachers for every date.
   - **Edit Icon (✏️)**: Modify SPOC details or teacher counts anytime.

3. **Google Sheets & Email Automation (`Code.gs`)**:
   - **Tab 1: `CPD Bookings`**: Stores registered school bookings & SPOC details.
   - **Tab 2: `Admin Sessions`**: Stores all session titles and tutorial links configured by the admin.
   - **Instant Email Confirmation**: Dispatched automatically from `cpd.adobeforeducation@gmail.com`.
   - **Daily Reminder Trigger**: Automatically emails SPOCs 1 day prior to their scheduled session.

---

## 📊 Google Sheet Schema

The Apps Script automatically creates two tabs in your spreadsheet:

### 1. `CPD Bookings` Tab
| Column | Header Name | Description |
|---|---|---|
| A | Timestamp | Booking creation date and time |
| B | Session Date | Scheduled date (`YYYY-MM-DD`) |
| C | Session Name | Admin-configured session title |
| D | SPOC Name | School contact person |
| E | SPOC Phone | 10-digit mobile number |
| F | SPOC Email | Contact email ID |
| G | School Name | Institution name |
| H | Total Teachers | Number of teachers participating |
| I | Reminder Sent | `Y` or `N` flag |
| J | Teams Link | Session meeting URL |

### 2. `Admin Sessions` Tab
| Column | Header Name | Description |
|---|---|---|
| A | Timestamp | Config creation/update timestamp |
| B | Session Date | Configured date (`YYYY-MM-DD`) |
| C | Session Name | Title set by admin (e.g. *Series 1 - Session 2*) |
| D | Tutorial Link | Microsoft Teams meeting / tutorial URL |

---

## 🚀 Setup & Deployment

1. Open **[Google Sheets](https://sheets.new)** and create a new spreadsheet.
2. Go to **Extensions ➔ Apps Script**.
3. Replace all code in `Code.gs` with the updated [`Code.gs`](Code.gs).
4. Click **Deploy ➔ New deployment**:
   - **Select type**: Web app
   - **Execute as**: Me (`cpd.adobeforeducation@gmail.com`)
   - **Who has access**: Anyone
5. Copy your Web App URL and configure it in the application (Default Endpoint: `https://script.google.com/macros/s/AKfycbyUTaKgdOHXTShNzOHMhIXWaop8J-yiwbDPg677S9wEGpDUSs9zm5NRQE6wlUAcz5kK/exec`).
