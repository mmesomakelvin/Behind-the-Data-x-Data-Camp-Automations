# AI_Agent_Automation

Apps Script project folder for Applied AI registration automation in Google Sheets.

## Script ID

`1Svwq6XL6wtRWaelfveObXuytUwb5nhrxMkGO6ZteBzcZSh-MoIO5k4aL`

## What This Project Does

- Watches new form-registration rows (auto trigger)
- Sends a welcome email with Discord onboarding instructions
- Moves successful email sends to `Mail sent`
- Writes these columns in `Mail sent`:
  - `Email address`
  - `Full Name`
  - `WhatsApp Number (Include country code)`
  - `Email Sent At`

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

## Menu Actions

- `Open Automation Buttons`
- `Set Test Email Recipient`
- `Setup Automation + Trigger`
- `Process Existing Rows`
- `Send Test Acceptance Email` (sends the current welcome-email template)
- `Install Auto Trigger`
- `Clear Auto Trigger`

## Push

```powershell
.\scripts\clasp-project.ps1 -Project AI_Agent_Automation -Action push
```
