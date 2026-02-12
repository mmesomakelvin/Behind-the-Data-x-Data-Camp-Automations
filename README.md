# Behind the Data x Data Camp Automations

Google Apps Script project for Behind the Data Academy workflows in Google Sheets.

It now supports **two email workflows**:
1. Registration welcome email flow (existing)
2. **Acceptance email flow** (new), with test mode, eligibility filtering, status tracking, and 6-hour retry scheduling

---

## What This Project Does

- Syncs registration data from `Form responses 1` into `Auto-Reg Email`
- Sends branded registration emails
- Assigns unique IDs
- Builds `Data Drill Downs` and `Location Master`
- Syncs selected people into `Selected People`
- Sends analytics report emails
- Sends **acceptance emails** from `Selection Map`

---

## Acceptance Email (New)

### Current configuration
- Acceptance sending currently reads from: **`Selection Map`**
- Test email recipient is currently: **`mmesomakelvin@gmail.com`**

These are set in `src/Code.js` under `ACCEPTANCE_CONFIG`.

### Eligibility rules
A row is eligible only if all are true:
- `Able to Commit` = `Yes`
- `Decision` = `Yes`
- Email is present

Rows are skipped if:
- Not eligible, or
- Already marked `Sent` in `Acceptance Email Status`

### Auto-tracking columns
The script auto-adds these columns to the source sheet (if missing):
- `Acceptance Email Status`
- `Acceptance Email Error`

---

## Acceptance Email Content

Acceptance template is in `src/Emailtemplate.js`:
- HTML template: `getAcceptanceEmailHTML(fullName)`
- Plain text template: `getAcceptancePlainText(fullName)`

Configured values:
- Logo source: `LOGO_URL` (Google Drive image URL)
- Acceptance form URL:
  `https://docs.google.com/forms/d/e/1FAIpQLSfqr5JO36Vo1R-HPTih64GFVGdoMBeXYPb2wcaq6yHZfmRCyg/viewform`
- Compliance document URL:
  `https://docs.google.com/document/d/1r5aKeScDitYzioKv7fuBS3XWIEL9nXRzQKgSipVSzKM/edit?tab=t.0`
- Payment deadline text:
  `Wednesday, 18 February 2026`

---

## Email Manager Menu Steps (Acceptance)

- **Step 15: Send Acceptance Test Email**
  - Sends one test email to `ACCEPTANCE_CONFIG.testEmail`
  - Subject is prefixed with `[TEST]`

- **Step 16: Send Acceptance Emails (Eligible Only)**
  - Batch sends to eligible rows only from the configured source sheet
  - Updates status/error columns per row

- **Step 17: Schedule Acceptance Retry (Every 6 Hours)**
  - Creates a time trigger for `sendAcceptanceEmails`
  - Runs every 6 hours (auto-retry for failed/unsent eligible rows)
  - Rows already marked `Sent` are skipped automatically

- **Step 18: Clear Acceptance Send Schedule**
  - Removes existing acceptance-send triggers

---

## Recommended Testing Flow (Before Sending to Everyone)

### Phase 1: Single-email content test
1. Confirm `ACCEPTANCE_CONFIG.sourceSheet` is set correctly (currently `Selection Map`)
2. In the sheet menu, run: **Step 15: Send Acceptance Test Email**
3. Confirm email at `mmesomakelvin@gmail.com`:
   - Subject and sender name
   - Branding/logo visibility
   - CTA button and fallback link
   - Compliance document button and fallback link
   - Correct form URL
   - Payment details and deadline text

### Phase 2: Eligibility and batch logic test
1. In `Selection Map`, prepare a few rows:
   - Row A: `Able to Commit=Yes`, `Decision=Yes`, valid email (should send)
   - Row B: `Able to Commit=No`, `Decision=Yes` (should skip)
   - Row C: `Able to Commit=Yes`, `Decision=No` (should skip)
2. Run: **Step 16: Send Acceptance Emails (Eligible Only)**
3. Verify:
   - Sent rows get `Acceptance Email Status = Sent`
   - Failed rows get `Acceptance Email Status = Failed` and error text
   - Re-running does not resend rows already marked `Sent`

### Phase 3: Scheduled run test
1. Run: **Step 17: Schedule Acceptance Retry (Every 6 Hours)**
2. Open Apps Script triggers and confirm a time-based trigger exists for `sendAcceptanceEmails`
3. If needed, run **Step 18** and schedule again

---

## Retry Behavior

- Rows with `Acceptance Email Status = Sent` are never resent
- Rows with failed sends remain eligible for retry
- The 6-hour schedule is useful when Gmail daily send limits are reached

---

## Core Files

- `src/Code.js`
  - Registration flow
  - Acceptance flow config and send logic
  - Acceptance scheduler and trigger cleanup
  - Spreadsheet menu actions

- `src/Emailtemplate.js`
  - Registration email templates
  - Acceptance email templates
  - Shared helper functions for names and HTML escaping

- `src/DataDrillDowns.js`
  - Build and maintain drill-down sheet

- `src/LocationMaster.js`
  - Build country/state summary sheet

- `src/SelectedPeople.js`
  - Keep selected participants list in sync

- `src/Report.js`
  - Build and send report email

---

## Setup and Push Commands

From project directory:

```bash
clasp push
```

Git workflow:

```bash
git add src/Code.js src/Emailtemplate.js src/appsscript.json README.md
git commit -m "Update acceptance email flow and docs"
git push origin main
```

---

## Troubleshooting

### `Script function not found. Please make sure script is deployed as API executable.`
This error affects terminal-based `clasp run`. It does **not** block running menu functions inside Google Sheets.

### Menu not showing new steps
- Reload the spreadsheet
- Re-open from `Extensions -> Apps Script` if needed
- Ensure latest code is pushed with `clasp push`

### Acceptance emails not sending
- Confirm sheet name in `ACCEPTANCE_CONFIG.sourceSheet`
- Confirm required columns exist (`Email address`, `Full Name`, `Able to Commit`, `Decision`)
- Check `Acceptance Email Error` values for row-level failures

---

## Timezone Notes

Script timezone is currently configured as:
- `Africa/Lagos`

Time-based triggers (including 6-hour acceptance retries) run in **Africa/Lagos** timezone.
