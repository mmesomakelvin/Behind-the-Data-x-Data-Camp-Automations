# Behind the Data x Data Camp Automations

Google Apps Script that automates welcome emails for new registrations captured in a Google Form and tracked in a Google Sheet. It syncs form responses into an "Auto-Reg Email" sheet, sends a branded HTML email with a Discord invite, and can auto-send on new form submissions.

## Files
- `src/Code.js` registration workflow: setup sheet, sync, send test, send all, trigger creation, onFormSubmit, and custom menu.
- `src/Emailtemplate.js` HTML and plain-text email templates plus logo URL.
- `src/appsscript.json` Apps Script manifest.

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
3. In the Apps Script editor, run:
   - `setupSheet` to create headers and formatting.
   - `syncData` to pull existing form responses.
   - `sendTestEmail` to verify delivery and template.
   - `createTrigger` to enable automatic sending on form submit.
4. Grant the required Google permissions when prompted.

A custom menu called "Email Manager" appears when the sheet opens and provides the same steps.

## Usage
- Manual batch send: run `sendAllEmails`. It marks each row as Sent or Failed.
- Automatic send: the `onFormSubmit` trigger sends an email and updates status for new registrations.

## Notes
- Emails are sent via `GmailApp`, so Gmail quotas apply.
- The status column prevents re-sending to the same row.
