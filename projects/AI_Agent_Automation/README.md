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

## Menu Actions

- `Open Automation Buttons`
- `Set Test Email Recipient`
- `Setup Automation + Triggers`
- `Refresh Review Tracking`
- `Refresh Color Guide`
- `Process Existing Rows`
- `Send Test Acceptance Email` (sends the current welcome-email template)
- `Install Auto Triggers`
- `Clear Auto Triggers`

## Push

```powershell
.\scripts\clasp-project.ps1 -Project AI_Agent_Automation -Action push
```
