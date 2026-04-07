# AI_Agents_Cohort_Acceptance

Apps Script project folder for the AI Agents cohort-acceptance payment confirmation workflow.

## Bound Spreadsheet

- Spreadsheet: `AI Agents Fellowship – Cohort Acceptance Form (Responses)`
- URL: `https://docs.google.com/spreadsheets/d/13BI3_O8cBedejcv1-GlCbbHVlspZcCKD7XBv8rSDB9A/edit`
- Source sheet: `Form responses 1`

## What This Project Does

- Adds helper columns at the end of `Form responses 1`:
  - `Payment Confirmed`
  - `Payment Confirmation Email Status`
  - `Payment Confirmation Email Error`
  - `Payment Confirmation Email Sent At`
- Adds a `Yes` / `No` dropdown to `Payment Confirmed`
- Sends a payment confirmation email automatically when `Payment Confirmed` is changed to `Yes`
- Skips rows whose confirmation email has already been marked `Sent`
- Includes a manual catch-up action for rows already marked `Yes`
- Includes a test email action so you can review the message before live sends

## Required Source Columns

The source sheet must contain:

- `Email address`
- `Full Name`

The current live sheet already has both columns.

## Menu Actions

- `Open Automation Buttons`
- `Set Test Email Recipient`
- `Setup Payment Confirmation Automation`
- `Preview Pending Confirmed Rows`
- `Send Test Payment Confirmation Email`
- `Send Payment Confirmation Emails (Pending)`
- `Install Auto Trigger`
- `Clear Auto Trigger`

## How To Test

1. Open the Google Sheet and refresh it after the latest script push.
2. Use `AI Agents Cohort Acceptance` -> `Setup Payment Confirmation Automation`.
3. Use `AI Agents Cohort Acceptance` -> `Set Test Email Recipient` and enter your own email.
4. Use `AI Agents Cohort Acceptance` -> `Send Test Payment Confirmation Email`.
5. Confirm the test email looks correct.
6. Pick one real row and set `Payment Confirmed` to `Yes`.
7. Wait a few seconds, then confirm these helper columns update on that row:
   - `Payment Confirmation Email Status` = `Sent`
   - `Payment Confirmation Email Sent At` has a timestamp
   - `Payment Confirmation Email Error` is blank

## If You Already Marked Some Rows `Yes`

Use:

- `AI Agents Cohort Acceptance` -> `Preview Pending Confirmed Rows`
- `AI Agents Cohort Acceptance` -> `Send Payment Confirmation Emails (Pending)`

That sends only rows where:

- `Payment Confirmed` = `Yes`
- `Payment Confirmation Email Status` is not already `Sent`

## Push

```powershell
.\scripts\clasp-project.ps1 -Project AI_Agents_Cohort_Acceptance -Action push
```
