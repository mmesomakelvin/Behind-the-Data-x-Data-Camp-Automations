# Behind the Data x Data Camp Automations

Google Apps Script that automates welcome emails for new registrations captured in a Google Form and tracked in a Google Sheet. It syncs form responses into an "Auto-Reg Email" sheet, sends a branded HTML email with a Discord invite, and can auto-send on new form submissions. It also assigns a simple sequential ID to each registrant, builds a Data Drill Downs sheet for the remaining form fields, and a Location Master sheet for country/state.

## Files
- `src/Code.js` registration workflow: setup sheet, sync, send test, send all, trigger creation, onFormSubmit, and custom menu.
- `src/Emailtemplate.js` HTML and plain-text email templates plus logo URL.
- `src/IdAssigner.js` ID assignment workflow and trigger.
- `src/DataDrillDowns.js` builds the "Data Drill Downs" sheet by matching IDs to form responses and pulling remaining columns.
- `src/LocationMaster.js` builds the "Location Master" sheet (ID, Country, State / Region).
- `src/Cleaner.js` normalizes case for Country, Full Name, and State / Region across key sheets.
- `src/appsscript.json` Apps Script manifest.

## Column Layout (Auto-Reg Email)
- A: ID (e.g., `BTD-000123`)
- B: Email Address
- C: Full Name
- D: Status
- E: Error

## Column Layout (Data Drill Downs)
- A: ID (matched from Auto-Reg Email via Email Address)
- B+: remaining columns from `Form responses 1`, excluding fields already present in Auto-Reg Email, plus Timestamp and column 2 from the form responses.

## Column Layout (Location Master)
- A: ID (matched from Auto-Reg Email via Email Address)
- B: Country
- C: State / Region

## Configuration
Edit the `CONFIG` object in `src/Code.js`:
- `sourceSheet`: name of the form responses sheet
- `destSheet`: name of the auto-registration sheet
- `sourceColumns`: column indexes for email, full name (country is used for Location Master)
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
   - **Step 8: Build Data Drill Downs** (creates/refreshes the drill-down sheet)
   - **Step 9: Build Location Master** (creates/refreshes the location sheet)
   - **Step 10: Clean Case-Sensitive Columns** (normalizes Country, Full Name, State / Region)
4. Run **Step 1: Send Test Email** to verify delivery.
5. Grant the required Google permissions when prompted.

## Usage
- Manual batch send: run `sendAllEmails`. It marks each row as Sent or Failed and logs errors.
- Automatic send: `onFormSubmit` sends an email and updates status for new registrations.
- Automatic ID assignment: `assignIdOnFormSubmit` assigns a sequential ID on new registrations.
- Build Data Drill Downs: run `buildDataDrillDowns` to refresh with current responses and IDs.
- Build Location Master: run `buildLocationMaster` to refresh with country/state and IDs.
- Case cleanup: run `cleanCaseSensitiveColumns` to normalize Country, Full Name, State / Region.

## Notes
- Emails are sent via `GmailApp`, so Gmail quotas apply.
- Running **Sync Data** rewrites the sheet and clears IDs; re-run **Assign Missing IDs** after syncing.
- **Data Drill Downs** clears and rebuilds the sheet each time it runs.
- **Location Master** clears and rebuilds the sheet each time it runs.

## Troubleshooting
- **"Service invoked too many times for one day: email"**: You hit Gmail’s daily send quota. Wait for the next day (timezone: `Africa/Lagos`) or use a higher-quota account.
- **ID not assigned on new registration**: Re-run **Step 7: Create ID Trigger**, then submit a new test response. Check Apps Script **Executions** for errors.
- **IDs missing after Sync Data**: `Sync Data` rewrites the sheet and clears IDs. Run **Step 6: Assign Missing IDs** afterward.
- **clasp push error about API**: Enable Apps Script API in `https://script.google.com/home/usersettings`.