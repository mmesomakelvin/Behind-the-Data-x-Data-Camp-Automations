# Analytics Engineering Fellowship Cohort 2 Registration Email Design

## Objective

Create the first layer of the Analytics Engineering Fellowship Cohort 2 automation: immediately acknowledge each new application by email, explain that the application is under review, and clarify that the commitment deposit is payable only if the applicant is selected.

## Project Isolation

Add an isolated Apps Script project at:

```text
projects/AEF_Cohort_2_Registration/
  .clasp.json
  README.md
  src/
    appsscript.json
    Code.js
    EmailTemplate.js
```

The project will use Apps Script ID `1sQPRvPdhyaKp9CFCcw1MiRoHNnHur34uMQDWEqSuF61hBI2RLHkDhDxl`. It will not share a `.clasp.json`, global Apps Script namespace, or deployment target with `AEF_Submission_Form` or any other repository project.

The Apps Script manifest will use the V8 runtime and the `Africa/Lagos` time zone, matching the other repository automations.

## Spreadsheet Contract

The automation targets this spreadsheet:

- Title: `Analytics Engineering Fellowship Cohort 2 – Application Form (Responses)`
- Spreadsheet ID: `1BIA59dL4-hx8Io7JbVB0nXshOwG0I_8i8KK0GORdm30`
- Source tab: `Form responses 1`
- Source tab ID: `2083070818`

The live header row contains:

- Column B: `Email address`, used as the primary recipient address
- Column D: `Full Name`, used for personalization
- Column E: `Email Address`, used only as a fallback when Column B is empty

Header matching will be case-insensitive and based on labels rather than hard-coded column numbers. The source-tab name will also be validated before a form-submit event is processed.

## Registration Email

The subject will be:

```text
Application Received – Analytics Engineering Fellowship Cohort 2
```

The email will:

1. Address the applicant by first name when available.
2. Confirm that the application was received successfully.
3. Explain that the application is being reviewed.
4. State that the applicant will receive a separate decision email after review.
5. Explain that selected applicants must pay a ₦30,100 commitment deposit within 24 hours of acceptance.
6. Explain that ₦30,000 is refundable after successful completion and ₦100 is the processing fee.
7. Clearly instruct the applicant not to make payment until an acceptance email is received.

No bank details, payment link, acceptance form, or instruction to pay immediately will appear in the registration email. Both HTML and plain-text versions will be provided. The sender name will be `Behind the Data Academy`.

## Trigger and Data Flow

An installable spreadsheet form-submit trigger will call `handleRegistrationSubmit(e)`.

For each new response:

1. Acquire a script lock to prevent concurrent duplicate sends.
2. Verify that the event belongs to `Form responses 1`.
3. Ensure the tracking columns exist.
4. Resolve and normalize the recipient email.
5. Check whether an earlier row for that normalized email is already marked `Sent` or `Sending`.
6. Reserve the row as `Sending` and flush that sheet write before calling Gmail.
7. Send the acknowledgement only when the email has not already received one.
8. Record the final result on the submitted row.
9. Release the lock.

The setup function will install at most one matching form-submit trigger for the current trigger-owning account. Re-running setup from that account will not create duplicate triggers. Because Apps Script returns installable triggers only for the current user, one designated account must own the automation and be the only account permitted to run setup or trigger installation.

## Duplicate Handling

Email comparison will trim whitespace and ignore case. Only one registration acknowledgement will be sent per unique email address.

When a later submission repeats an email whose earlier row is marked `Sent` or `Sending`, the new row will be recorded as `Skipped - Duplicate`. It will not receive another email.

The script lock ensures that two near-simultaneous submissions using the same address cannot both pass the duplicate check before either is recorded.

## Tracking Columns

The automation will append these columns to the end of `Form responses 1` when they do not already exist:

- `Registration Email Status`
- `Registration Email Error`
- `Registration Email Sent At`

Supported status values are:

- `Sending`
- `Sent`
- `Failed`
- `Skipped - Duplicate`
- `Skipped - No Email`

The error column will be cleared after a successful send and will contain a truncated error message after a failure. The sent-at column will contain a real spreadsheet date/time value for successful sends only.

## Manual Controls

The spreadsheet menu will provide:

- `Setup Registration Automation`
- `Set Test Email Recipient`
- `Send Test Registration Email`
- `Preview Pending Registrations`
- `Process Existing Registrations`
- `Install Auto Trigger`
- `Clear Auto Trigger`

The test recipient will be stored explicitly in Script Properties. There will be no default address or active-user fallback. Test sends will not change any applicant row or tracking status.

The custom menu requires the Apps Script project to be bound to the response spreadsheet. The trigger and processing functions will remain compatible with a standalone project through the fixed spreadsheet ID; in that case setup is run from the Apps Script editor and the test-recipient Script Property is entered manually.

`Process Existing Registrations` will provide a safe catch-up path for rows submitted before the trigger is installed or for rows whose earlier send failed. It will skip rows already marked `Sent` or `Sending` and will apply the same unique-email rule as live submissions.

`Preview Pending Registrations` will be read-only. If setup has not yet created the tracking columns, preview will stop with a clear instruction to run setup rather than modifying the sheet.

## Error Handling

- A missing email will be recorded as `Skipped - No Email`.
- A mail-service or template failure will be recorded as `Failed`, with the error text stored in `Registration Email Error`.
- A failed row remains eligible for a later catch-up attempt.
- A `Sending` row is not retried automatically. It requires checking the Gmail Sent folder. If delivered, the operator sets `Sent`, clears the error, and records the delivery time; if not delivered, the operator sets `Failed`, records the reason, and clears the sent-at value.
- A successful Gmail call followed by a tracking failure will never be converted to `Failed`; this prevents an automatic duplicate email.
- A run that cannot acquire the script lock will log the condition without sending.
- Missing required headers or an unavailable source sheet will stop the run with a clear error instead of guessing a different sheet.

## Verification and Deployment

Before live use:

1. Validate the manifest and `.clasp.json` files.
2. Run JavaScript syntax checks on all source files.
3. Confirm the clasp configuration contains the Cohort 2 Script ID and `rootDir: src`.
4. Confirm the source-sheet resolver finds `Form responses 1` and the expected name/email headers.
5. Send a test email to the configured test recipient.
6. Run setup once to create the tracking columns and install the trigger.
7. Submit a controlled form response and confirm `Sent` plus a timestamp.
8. Submit the same normalized email again and confirm `Skipped - Duplicate` with no second email.

The repository project will be committed and pushed to Git, and its source will be pushed with clasp to the supplied Apps Script ID. Installing the trigger and sending the live test require Google authorization in the account that owns the script and spreadsheet; the owner will run `Setup Registration Automation` once from the spreadsheet menu after authorizing the script.

## Out of Scope

This specification covers only the immediate registration acknowledgement layer. Applicant review decisions, acceptance emails, rejection emails, payment instructions, payment confirmation, onboarding, and reminder workflows will be designed separately when requested.
