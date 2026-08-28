# AEF_Cohort_2_Payment_Confirmation

Google Apps Script project for confirming Analytics Engineering Fellowship Cohort 2 commitment-deposit payments.

## Script ID

`1Qr0SzfzYm3m0Rg_E62inOC61lsP7iuPvFlPlZMFmWC9RdlLYTj4K24BJ`

## Bound Spreadsheet

- Spreadsheet: `Analytics Engineering Fellowship Cohort 2 - Acceptance Form (Responses)`
- URL: `https://docs.google.com/spreadsheets/d/10v2U9Sn6JpcPP3Zr1d_z46s7PIuuJQlgjj7VY2mb0Y4/edit`
- Source tab: `Form_Responses`

## What It Does

- Adds a `Payment Confirmed` dropdown with `Yes` and `No` choices.
- Sends the Cohort 2 payment-confirmation email when `Payment Confirmed` becomes `Yes`.
- Records `Sending`, `Sent`, `Failed`, or `Skipped - No Email` beside each applicant.
- Prevents rows already marked `Sent` or `Sending` from being emailed again.
- Safely retries a confirmed edit within about five minutes if another automation is busy.
- Provides preview, test-email and manual catch-up actions.

## First-Time Setup

1. Push this project to Apps Script.
2. Refresh the payment-response spreadsheet.
3. Click `AEF Cohort 2 Payment Confirmation` -> `Setup Payment Confirmation Automation`.
4. Approve the Google permissions.
5. Set your test email recipient.
6. Preview the email and send yourself a test.
7. After approving the email, change a participant's `Payment Confirmed` value to `Yes` to send it live.

Selecting `Yes` is the live-send action. There is no confirmation box, and a sent email cannot be recalled. Check the tracking columns after each selection.

`Send Payment Confirmation Emails (Pending)` is also a live bulk-send action. It shows the number of emails and asks for confirmation before sending.

Only one designated Google account should run setup or install the triggers. The emails are sent from the account that installs them. The same account must use `Clear Auto Trigger` if the automation needs to be removed; another editor cannot remove triggers owned by the first account.

If a row remains `Sending`, check the Gmail Sent folder before changing anything. If the email was delivered, mark it `Sent`; if it was not delivered, mark it `Failed` before retrying.

## Push

```powershell
.\scripts\clasp-project.ps1 -Project AEF_Cohort_2_Payment_Confirmation -Action push
```
