# AEF_Cohort_2_Registration

Google Apps Script project for acknowledging Analytics Engineering Fellowship Cohort 2 applications immediately after form submission.

## Script ID

`1sQPRvPdhyaKp9CFCcw1MiRoHNnHur34uMQDWEqSuF61hBI2RLHkDhDxl`

## Bound Spreadsheet

- Spreadsheet: `Analytics Engineering Fellowship Cohort 2 – Application Form (Responses)`
- URL: `https://docs.google.com/spreadsheets/d/1BIA59dL4-hx8Io7JbVB0nXshOwG0I_8i8KK0GORdm30/edit`
- Source tab: `Form responses 1`

## What This Project Does

- Sends an immediate application-received email after a new form submission.
- Tells applicants that their application is under review.
- Explains that only selected applicants pay the ₦30,100 commitment deposit.
- Tells applicants not to pay until they receive an acceptance email.
- Sends only one acknowledgement per normalized email address.
- Provides test, preview, catch-up, trigger-installation, and trigger-removal actions.
- Builds a `Selection Map` containing only applicants who answered `Yes` to the refundable commitment-deposit question.
- Creates a separate Cohort 2 acceptance form by copying the Cohort 1 form and updating its cohort wording.
- Previews and test-sends the Cohort 2 acceptance email without emailing applicants.

## Live Column Handling

- Primary recipient: `Email address`
- Fallback recipient: the later `Email Address` column
- Applicant name: `Full Name`

The response sheet currently contains two email headers that differ only by capitalization. The script intentionally uses the first matching email header as primary and the second as fallback.

## Tracking Columns

Setup appends these columns when they do not already exist:

- `Registration Email Status`
- `Registration Email Error`
- `Registration Email Sent At`

Status values include:

- `Sending` (reserved; do not retry automatically)
- `Sent`
- `Failed`
- `Skipped - Duplicate`
- `Skipped - No Email`

`Sending` is a safety state written before Gmail is called. If a run is interrupted or
final tracking cannot be saved, the row stays non-retryable so the applicant is not
emailed twice. Check the account's Sent folder. If delivered, change the status to
`Sent`, clear the error, and enter the delivery time in `Registration Email Sent At`.
If not delivered, change the status to `Failed`, record the reason in the error column,
and clear the sent-at value.

## Menu Actions

- `Setup Registration Automation`
- `Set Test Email Recipient`
- `Send Test Registration Email`
- `Preview Pending Registrations`
- `Process Existing Registrations`
- `Refresh Selection Map`
- `Setup Cohort 2 Acceptance Form`
- `Preview Acceptance Email`
- `Send Acceptance Test Email`
- `Send Accepted Applicants`
- `Install Auto Trigger`
- `Clear Auto Trigger`

## Setup and Test

1. Push the project to Apps Script.
2. Confirm the supplied Apps Script project is bound to the response spreadsheet.
3. Reload the Google Sheet and choose `AEF Cohort 2 Registration` → `Setup Registration Automation`.
4. Authorize the requested Google permissions.
5. Set your test email recipient.
6. Send the test registration email and review it.
7. Submit one controlled form response and confirm `Registration Email Status` becomes `Sent` with a timestamp.
8. Submit the same normalized email again and confirm the new row becomes `Skipped - Duplicate` without a second email.

## Selection and Acceptance Review

1. Choose `Refresh Selection Map` to create or update the shortlist. It copies applicants; it does not remove them from the response tab.
2. Use the `Decision` dropdown for your manual review. Refreshing the list keeps your decisions and acceptance-email tracking.
3. Choose `Setup Cohort 2 Acceptance Form` once. The script copies the Cohort 1 form, changes Cohort 1 wording to Cohort 2, adds the September 1, 2026 programme note, and saves the new public link.
4. Choose `Preview Acceptance Email` to inspect the email on screen.
5. Choose `Send Acceptance Test Email` to send it only to the saved test address.
6. In the `Decision` column, choose `Accepted` only for applicants you have approved.
7. Choose `Send Accepted Applicants`, review the number shown, and confirm the send.

The live send is manual. Changing the `Decision` dropdown does not send an email by
itself. The button emails only applicants marked `Accepted`. Rows already marked `Sent`
are skipped. Each attempt updates `Acceptance Email Status`, `Acceptance Email Error`,
and `Acceptance Email Sent At`, so failed sends can be corrected and retried safely.
If an acceptance row remains `Sending`, do not clear it and resend immediately. Check
the Gmail Sent folder first. After confirming whether the email was delivered, set the
row to `Sent` with its sent time, or change it to `Failed` before retrying.

Accepted applicants have 72 hours from receiving the acceptance email to pay the
refundable commitment deposit.

Run the setup with a Google account that can edit the Cohort 1 acceptance form. The
original form is only read and copied; its questions and responses are not changed.

The Cohort 2 compliance document used in the preview is:
`https://docs.google.com/document/d/1icI-afhVqYoaV6GLAr9CpU_A_2c26Zg-L3e-0fXKtOM/edit`

The menu is available only when the Apps Script project is bound to the spreadsheet.
If this Script ID is standalone, run `setupRegistrationAutomation()` directly from
the Apps Script editor. Add the Script Property `AEF_COHORT_2_TEST_EMAIL` manually
before running `sendRegistrationTestEmail()`. There is no default or personal fallback
test address.

Only one designated Google account should own this automation's installable trigger.
That account must be the only account that runs `Setup Registration Automation` or
`Install Auto Trigger`; Apps Script trigger listings are scoped to the user who created
them, so other spreadsheet editors must not install another copy.

`Preview Pending Registrations` is read-only and requires setup to have created the
three tracking columns first.

## Push

```powershell
.\scripts\clasp-project.ps1 -Project AEF_Cohort_2_Registration -Action push
```
