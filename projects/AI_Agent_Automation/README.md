# AI_Agent_Automation

Apps Script project folder for Applied AI registration automation in Google Sheets.

## Script ID

`1Svwq6XL6wtRWaelfveObXuytUwb5nhrxMkGO6ZteBzcZSh-MoIO5k4aL`

## What This Project Does

- Watches new form-registration rows (auto trigger)
- Watches manual status updates in the registration sheet (edit trigger)
- Sends a welcome email with Discord onboarding instructions
- Sends only one email per unique email address
- Colors duplicate registrations orange instead of sending another email
- Colors reviewed rows by status:
  - `Accepted` = green
  - `Rejected` = red
  - `May Consider` = yellow
- Keeps an `Accepted` sheet in sync from the source sheet
- Sends accepted emails from rows marked `Accepted`
- Sends accepted reminder emails from rows marked `Accepted`
- Sends rejection emails from source-sheet rows marked `Rejected`
- Creates an `Automation color guide` sheet that explains the row colors
- Moves successful email sends to `Mail sent`
- Writes these columns in `Mail sent`:
  - `Email address`
  - `Full Name`
  - `WhatsApp Number (Include country code)`
  - `Email Sent At`

## Duplicate Email Handling

- Duplicate checks are based on normalized email address only
- The script checks the `Mail sent` sheet to decide whether an email has already been sent
- If the email already exists in `Mail sent`, the new registration row is colored orange
- No new email is sent for that duplicate row
- Orange means: duplicate email already received a registration email

## Review Status Handling

- Status matching is case-insensitive
- Supported review values are `Accepted`, `Rejected`, and `May Consider`
- When a status is changed in the source sheet, the whole row is colored automatically
- `Accepted` is rebuilt from rows whose status is `Accepted`
- Accepted rows are copied, not moved
- `Accepted` keeps the original source headers and copies the full source row

## Accepted Email Flow

- Accepted email design is based on the onboarding layout used in `Payment_Receipt_Onboarding`
- Accepted recipients are sent from the `Accepted` sheet with one menu action
- The `Accepted` sheet is still rebuilt from source rows whose `Status` is `Accepted`
- Send tracking is stored in helper columns on the `Accepted` sheet:
  - `Acceptance Email Status`
  - `Acceptance Email Error`
  - `Acceptance Email Sent At`
- Reminder-email tracking is also stored on the `Accepted` sheet:
  - `Acceptance Reminder Email Status`
  - `Acceptance Reminder Email Error`
  - `Acceptance Reminder Email Sent At`
- `Send Accepted Emails (Pending)` sends only accepted-sheet rows that have not already been marked `Sent`
- `Send Test Accepted Email` sends the accepted email to the saved test recipient
- `Send Accepted Reminder Emails (Pending)` sends the admitted-candidate reminder only to accepted-sheet rows whose reminder status is not already `Sent`
- `Send Test Accepted Reminder Email` sends the admitted-candidate reminder to the saved test recipient
- The `Accepted` sheet remains a synced copy of accepted rows and preserves the accepted-email tracking columns during rebuilds
- Accepted sends now re-sync the `Accepted` sheet from the source sheet before sending, so reminder runs do not depend on a stale accepted-sheet copy
- Source-side rejection helper columns are excluded from the accepted-sheet schema, so reminder sends no longer clear the `Accepted` sheet because of header mismatch

Accepted email links currently used:
- Discord: `https://discord.gg/4mhSUaeTM`
- Compliance document: `https://docs.google.com/document/d/1_Nw_-GE94NsH2VoIaWcJ32NMcgtbXg17jX9I9FdrtWE/edit?usp=sharing`
- Cohort acceptance form: `https://docs.google.com/forms/d/e/1FAIpQLSeFfwQhzVgzRAA4NPNJhpn7Rk9a-2yzaJaBMP0klqIh-_vigQ/viewform?usp=publish-editor`

Accepted reminder email details:
- Tells admitted candidates to accept their admission and pay the commitment fee by the upcoming Friday date at send time
- Includes the exact computed deadline date in the email body and subject
- Repeats the commitment-fee breakdown and bank account details
- Points candidates back to the acceptance form and compliance document

## Welcome Email Flow

Current welcome email instructions are:

1. Join the official Discord community
2. Check the `welcome/announcements` channel first
3. Introduce yourself in `introductions` (full name, location, and learning goals)

Discord invite link in the email: `https://discord.com/invite/yKcVn5m4yt`

## Required Source Columns

The registration source sheet must contain:

- `Email address`
- `Full Name`
- `WhatsApp Number (Include country code)`

Supported source-sheet names include:
- `Form responses 1`
- `Form Responses 1`
- `Form_Responses`

`Email Sent At` is stored as a timestamp string in the spreadsheet timezone using the format `yyyy-MM-dd HH:mm:ss`.

## Trigger Setup

1. Open the Google Sheet and refresh the page after the latest script push.
2. Use `AI Agents Automation` -> `Setup Automation + Triggers`.
3. Approve the Google Apps Script permissions if prompted.
4. If the automation sheets already exist and you only need the triggers, use `AI Agents Automation` -> `Install Auto Triggers`.

`Setup Automation + Triggers` creates or refreshes:
- `Mail sent`
- `Accepted`
- `Automation color guide`
- the form-submit trigger for new registrations
- the edit trigger for status updates

Use `Refresh Review Tracking` if you already have status values in the sheet and want all row colors and the accepted sheet rebuilt immediately.

How to run accepted emails:
1. Mark the relevant rows as `Accepted` in the source sheet.
2. Confirm they appear in the `Accepted` sheet.
3. Use `AI Agents Automation` -> `Send Accepted Emails (Pending)`.
4. Check the helper columns in the `Accepted` sheet for `Sent`, error details, and sent timestamp.

How to run accepted reminder emails:
1. Mark the relevant rows as `Accepted` in the source sheet.
2. Confirm they appear in the `Accepted` sheet.
3. Use `AI Agents Automation` -> `Send Test Accepted Reminder Email`.
4. If the reminder looks correct, use `AI Agents Automation` -> `Send Accepted Reminder Emails (Pending)`.

## Rejection Email Flow

- Rejection recipients are read directly from the source sheet
- A row is eligible when `Status = Rejected`
- Rejection send tracking is stored on the source sheet in these helper columns:
  - `Rejection Email Status`
  - `Rejection Email Error`
  - `Rejection Email Sent At`
- `Send Rejected Emails (Pending)` sends only rejected rows whose rejection status is not already `Sent`
- `Send Test Rejected Email` sends the rejection email to the saved test recipient

How to run rejected emails:
1. Mark the relevant rows as `Rejected` in the source sheet.
2. Use `AI Agents Automation` -> `Send Test Rejected Email`.
3. If the rejection email looks correct, use `AI Agents Automation` -> `Send Rejected Emails (Pending)`.
4. Check the source-sheet helper columns for `Sent`, error details, and sent timestamp.

## Which Button To Use

- `Process Existing Rows`
  Uses the original registration automation. It sends the first welcome / registration email to rows that have not yet been logged in `Mail sent`.
- `Send Test Accepted Email`
  Sends the new accepted email to your saved test recipient only. Use this first when you want to preview the accepted email.
- `Send Accepted Emails (Pending)`
  This is the main button you should use for accepted candidates. It sends the accepted email to everyone currently listed in the `Accepted` sheet whose `Acceptance Email Status` is not already `Sent`.
- `Send Test Accepted Reminder Email`
  Sends the admitted-candidate reminder email to your saved test recipient only.
- `Send Accepted Reminder Emails (Pending)`
  Sends the admitted-candidate reminder to everyone currently listed in the `Accepted` sheet whose `Acceptance Reminder Email Status` is not already `Sent`.
- `Send Test Rejected Email`
  Sends the rejection email to your saved test recipient only.
- `Send Rejected Emails (Pending)`
  Sends the rejection email to source-sheet rows marked `Rejected` whose `Rejection Email Status` is not already `Sent`.
- `Send Test Acceptance Email`
  This is the old registration email test button. It tests the original "thanks for registering / join Discord" email, not the accepted-candidate email.

Recommended usage for accepted candidates:
1. Mark people as `Accepted` in the source sheet.
2. Confirm they appear in `Accepted`.
3. Click `Send Test Accepted Email`.
4. If the test looks correct, click `Send Accepted Emails (Pending)`.

Recommended usage for reminder emails:
1. Confirm the admitted candidates are already in `Accepted`.
2. Click `Send Test Accepted Reminder Email`.
3. If the test looks correct, click `Send Accepted Reminder Emails (Pending)`.

Recommended usage for rejected candidates:
1. Mark people as `Rejected` in the source sheet.
2. Click `Send Test Rejected Email`.
3. If the test looks correct, click `Send Rejected Emails (Pending)`.

## Menu Actions

- `Open Automation Buttons`
- `Set Test Email Recipient`
- `Setup Automation + Triggers`
- `Refresh Review Tracking`
- `Refresh Color Guide`
- `Process Existing Rows`
- `Send Test Accepted Email`
- `Send Accepted Emails (Pending)`
- `Send Test Accepted Reminder Email`
- `Send Accepted Reminder Emails (Pending)`
- `Send Test Rejected Email`
- `Send Rejected Emails (Pending)`
- `Send Test Acceptance Email` (sends the current welcome-email template)
- `Install Auto Triggers`
- `Clear Auto Triggers`

## Local Notes

Reference notes for the accepted email workflow are stored in:
- `accepted_email/README.md`

## Push

```powershell
.\scripts\clasp-project.ps1 -Project AI_Agent_Automation -Action push
```
