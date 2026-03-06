# AI_Agent_Automation

Apps Script project folder for Applied AI registration automation in Google Sheets.

## Script ID

`1Svwq6XL6wtRWaelfveObXuytUwb5nhrxMkGO6ZteBzcZSh-MoIO5k4aL`

## What This Project Does

- Watches new form-registration rows (auto trigger)
- Sends a welcome email with Discord onboarding instructions
- Optionally sends a phone notification if a webhook is configured
- Moves successful email sends to `Mail sent`
- Writes these columns in `Mail sent`:
  - `Email address`
  - `Full Name`
  - `WhatsApp Number (Include country code)`
  - `Status`

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

## Optional Script Properties (for phone notification)

Set these in Apps Script -> Project Settings -> Script properties:

- `PHONE_WEBHOOK_URL`
- `PHONE_WEBHOOK_TOKEN`

If not set, email still sends and status notes phone as pending setup.

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
