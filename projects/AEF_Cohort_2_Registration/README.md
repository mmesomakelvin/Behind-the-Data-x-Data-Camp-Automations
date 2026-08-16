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
