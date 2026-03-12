# AI_Agent_Automation

Apps Script project folder for Applied AI registration automation in Google Sheets.

## Script ID

`1Svwq6XL6wtRWaelfveObXuytUwb5nhrxMkGO6ZteBzcZSh-MoIO5k4aL`

## What This Project Does

- Watches new form-registration rows (auto trigger)
- Sends a welcome email with Discord onboarding instructions
- Sends only one email per unique email address
- Colors duplicate registrations orange instead of sending another email
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
2. Use `AI Agents Automation` -> `Setup Automation + Trigger`.
3. Approve the Google Apps Script permissions if prompted.
4. If the automation sheets already exist and you only need the trigger, use `AI Agents Automation` -> `Install Auto Trigger`.

`Setup Automation + Trigger` creates or refreshes:
- `Mail sent`
- `Automation color guide`
- the form-submit trigger for new registrations

## Menu Actions

- `Open Automation Buttons`
- `Set Test Email Recipient`
- `Setup Automation + Trigger`
- `Refresh Color Guide`
- `Process Existing Rows`
- `Send Test Acceptance Email` (sends the current welcome-email template)
- `Install Auto Trigger`
- `Clear Auto Trigger`

## Push

```powershell
.\scripts\clasp-project.ps1 -Project AI_Agent_Automation -Action push
```
