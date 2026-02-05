# Behind the Data x Data Camp Automations

Google Apps Script that automates welcome emails for new registrations captured in a Google Form and tracked in a Google Sheet. It syncs form responses into an "Auto-Reg Email" sheet, sends a branded HTML email with a Discord invite, and can auto-send on new form submissions. It also assigns a simple sequential ID to each registrant.

## Files
- `src/Code.js` registration workflow: setup sheet, sync, send test, send all, trigger creation, onFormSubmit, and custom menu.
- `src/Emailtemplate.js` HTML and plain-text email templates plus logo URL.
- `src/IdAssigner.js` ID assignment workflow and trigger.
- `src/appsscript.json` Apps Script manifest.

## Column Layout (Auto-Reg Email)
- A: ID (e.g., `BTD-000123`)
- B: Email Address
- C: Full Name
- D: Country
- E: Status
- F: Error

## Configuration
Edit the `CONFIG` object in `src/Code.js`:
- `sourceSheet`: name of the form responses sheet
- `destSheet`: name of the auto-registration sheet
- `sourceColumns`: column indexes for email, full name, country
- `senderName` and `emailSubject`

Edit `LOGO_URL` in `src/Emailtemplate.js` if needed.

## Setup (in Google Sheets)
1. Open the spreadsheet bound to this Apps Script project.
2. Ensure the sheet names match `CONFIG.sourceSheet` and `CONFIG.destSheet`.
3. From the sheet menu **Email Manager**:
   - **Step 0: Add ID Column** (adds column A)
   - **Step 2: Setup Sheet** (adds headers/formatting)
   - **Step 3: Sync Data** (pulls existing form responses)
   - **Step 6: Assign Missing IDs** (fills IDs for existing rows)
   - **Step 5: Create Trigger** (auto-send emails on new form submit)
   - **Step 7: Create ID Trigger** (auto-assign IDs on new form submit)
4. Run **Step 1: Send Test Email** to verify delivery.
5. Grant the required Google permissions when prompted.

## Usage
- Manual batch send: run `sendAllEmails`. It marks each row as Sent or Failed and logs errors.
- Automatic send: `onFormSubmit` sends an email and updates status for new registrations.
- Automatic ID assignment: `assignIdOnFormSubmit` assigns a sequential ID on new registrations.

## Notes
- Emails are sent via `GmailApp`, so Gmail quotas apply.
- Running **Sync Data** rewrites the sheet and clears IDs; re-run **Assign Missing IDs** after syncing.

## Troubleshooting
- **"Service invoked too many times for one day: email"**: You hit Gmail’s daily send quota. Wait for the next day (timezone: `Africa/Lagos`) or use a higher‑quota account.
- **ID not assigned on new registration**: Re-run **Step 7: Create ID Trigger**, then submit a new test response. Check Apps Script **Executions** for errors.
- **IDs missing after Sync Data**: `Sync Data` rewrites the sheet and clears IDs. Run **Step 6: Assign Missing IDs** afterward.
- **clasp push error about API**: Enable Apps Script API in `https://script.google.com/home/usersettings`.
