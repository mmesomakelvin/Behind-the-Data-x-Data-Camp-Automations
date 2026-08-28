# AEF Cohort 2 Payment Review Automation

This Google Apps Script project manages the Cohort 2 acceptance-form payment workflow in one review sheet.

## Connected Google files

- Apps Script project ID: `1Qr0SzfzYm3m0Rg_E62inOC61lsP7iuPvFlPlZMFmWC9RdlLYTj4K24BJ`
- Spreadsheet: `Analytics Engineering Fellowship Cohort 2 - Acceptance Form (Responses)`
- Spreadsheet URL: `https://docs.google.com/spreadsheets/d/10v2U9Sn6JpcPP3Zr1d_z46s7PIuuJQlgjj7VY2mb0Y4/edit`
- Form response tab: `Form_Responses`
- Working tab created by setup: `Payment Review`

## What it does

- Copies current and new applicants into `Payment Review` without deleting the original responses.
- Sends a “payment evidence received” email after a new form submission. This email says the evidence is under review; it does not say payment is confirmed.
- Lets you send the same acknowledgement to current applicants after you preview the count and approve the live send.
- Sends the final payment-confirmation email when you change `Payment Review Status` to `Confirmed`.
- Records whether each received or confirmation email is `Sending`, `Sent`, `Failed`, or `Skipped - No Email`.
- Uses a hidden source key to update the correct row and avoid duplicate review rows.

## Payment Review Status

- `Pending`: payment evidence is waiting to be checked. No confirmation email is sent.
- `Confirmed`: payment has been verified. Changing to this value sends the final confirmation email.
- `Rejected`: payment could not be verified. No confirmation email is sent.

## First setup

1. Refresh the payment-response spreadsheet.
2. Open `AEF Cohort 2 Payment Review` from the top menu.
3. Click `Setup Payment Review Automation`.
4. Approve the Google permissions when asked.
5. Wait for the new `Payment Review` tab to appear.

Setup copies all current applicants and installs the automatic triggers. It does not email any participant.

Only one designated Google account should run setup. Emails will come from the account that installed the triggers.

The script saves that account as the trigger owner and blocks a second account from installing another set of triggers. This prevents the same applicant from receiving duplicate automatic emails.

## Safe test before live use

1. Open `AEF Cohort 2 Payment Review` -> `Open Automation Buttons`.
2. Enter your own email address and click `Save Test Email Address`.
3. Preview both email types.
4. Send both email types to your test address and check your inbox.
5. Submit one test response through the acceptance form using an email address you control.
6. Confirm that one row appears in `Payment Review` and its `Received Email Status` becomes `Sent`.
7. On that test row only, change `Payment Review Status` to `Confirmed`.
8. Confirm that its `Confirmation Email Status` becomes `Sent` and the confirmation arrives.

Changing a real person's status to `Confirmed` is a live-send action. Email cannot be recalled after it is sent.

## Email current applicants

After testing:

1. Click `Count Existing Applicants Waiting`.
2. Check that the number looks correct.
3. Click `LIVE: Email Existing Applicants`.
4. Read the warning and choose `Yes` only when ready.

Rows already marked `Sent` or `Sending` are skipped.

## If something goes wrong

- `Failed`: read the nearby error column, correct the issue, then use the appropriate pending-email action to try again.
- `Skipped - No Email`: the row has no valid email address. Correct the address in `Form_Responses`, run `Sync Current Form Submissions`, then retry.
- `Sending` for a long time: check the sender's Gmail Sent folder before changing anything. If the message was sent, manually change the tracking status to `Sent`. This avoids sending it twice.
- Duplicate source-key warning: the script found two responses it cannot safely tell apart. It stops before sending email. Check the named rows in `Form_Responses` or `Payment Review`, correct the duplicate, and run sync again.

## Change the Google account that sends emails

The current trigger owner must do this:

1. Open the sidebar and click `Clear Automatic Triggers`.
2. Click `Release Trigger Ownership` and choose `Yes`.
3. Sign in with the new sender account.
4. Run `Setup Payment Review Automation` from that account.

Do not skip the clear-and-release steps. Google does not let one account remove automatic triggers created by another account.

## Push code to Apps Script

```powershell
.\scripts\clasp-project.ps1 -Project AEF_Cohort_2_Payment_Confirmation -Action push
```
