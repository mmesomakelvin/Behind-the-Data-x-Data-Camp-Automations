# AI_Agent_Automation

Apps Script project folder for registration notification automation in Google Sheets.

## Script ID

`1Svwq6XL6wtRWaelfveObXuytUwb5nhrxMkGO6ZteBzcZSh-MoIO5k4aL`

## What This Project Does

- Watches new form-registration rows (auto trigger)
- Sends a confirmation email to the registrant
- Optionally sends a WhatsApp message if API is configured
- Moves successful email sends to `Mail sent`
- Writes these columns in `Mail sent`:
  - `Email address`
  - `Full Name`
  - `WhatsApp Number (Include country code)`
  - `Status`

## Required Source Columns

The registration source sheet must contain:

- `Email address`
- `Full Name`
- `WhatsApp Number (Include country code)`

Supported source-sheet names include:
- `Form responses 1`
- `Form Responses 1`
- `Form_Responses`

## Optional Script Properties (for WhatsApp)

Set these in Apps Script -> Project Settings -> Script properties:

- `WHATSAPP_API_URL`
- `WHATSAPP_API_TOKEN`

If not set, email still sends and status notes WhatsApp as skipped.

## Menu Actions

- `Setup Automation + Trigger`
- `Process Existing Rows`
- `Send Test Email`
- `Install Auto Trigger`
- `Clear Auto Trigger`

## Push

```powershell
.\scripts\clasp-project.ps1 -Project AI_Agent_Automation -Action push
```
