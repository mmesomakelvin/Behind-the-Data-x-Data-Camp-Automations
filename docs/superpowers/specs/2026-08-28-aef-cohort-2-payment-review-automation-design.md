# AEF Cohort 2 Payment Review Automation — Specification

## Purpose

This automation will help the team track every Cohort 2 acceptance-form submission in one simple review sheet.

It solves two separate communication needs:

1. When an applicant submits payment evidence, they receive an email saying the evidence was received and is being checked.
2. When the team later marks that payment as `Confirmed`, the applicant receives the final payment-confirmation email.

The first email is only an acknowledgement. It must never tell the applicant that payment has already been confirmed.

## Google files in use

- Apps Script project ID: `1Qr0SzfzYm3m0Rg_E62inOC61lsP7iuPvFlPlZMFmWC9RdlLYTj4K24BJ`
- Spreadsheet ID: `10v2U9Sn6JpcPP3Zr1d_z46s7PIuuJQlgjj7VY2mb0Y4`
- Form response tab: `Form responses 1`
- New working tab: `Payment Review`

The original `Form responses 1` tab remains unchanged. The automation copies the needed information into `Payment Review`; it does not move or delete form responses.

## Payment Review columns

The visible columns will be:

1. `Submission Date`
2. `Email address`
3. `Full Name`
4. `LinkedIn Url`
5. `Payment Evidence`
6. `Payment Review Status`
7. `Received Email Status`
8. `Received Email Error`
9. `Received Email Sent At`
10. `Confirmation Email Status`
11. `Confirmation Email Error`
12. `Confirmation Email Sent At`

`Payment Review Status` will have three choices: `Pending`, `Confirmed`, and `Rejected`. New and existing submissions start as `Pending`, unless an older payment-confirmation column already shows that a record was confirmed.

The sheet will also contain a hidden `Source Response Key` column. This is an internal label made from the response timestamp, account number, and email address. It lets the automation update the correct person without creating duplicate rows. If two responses still produce the same key, the sync stops before sending email and tells the operator which rows need attention.

## New submissions

When a new form submission arrives, the automation will:

1. Find the submitted response in `Form responses 1`.
2. Create or update its row in `Payment Review`.
3. Set its review status to `Pending`.
4. Send the “payment evidence received” email.
5. Record `Sending`, `Sent`, `Failed`, or `Skipped - No Email` in the received-email tracking columns.

The acknowledgement email will clearly say:

- the acceptance form and payment evidence were received;
- the payment evidence is being reviewed;
- a second email will be sent after verification;
- the person does not need to submit the form again unless contacted; and
- this is not payment confirmation.

## Existing submissions

The setup action will copy all current `Form responses 1` rows into `Payment Review`. It will not email them during setup.

The menu will provide:

- a preview showing how many existing applicants are waiting for the acknowledgement; and
- a separate bulk-send action that displays the live-email count and requires a Yes/No confirmation.

Already-sent acknowledgements will be skipped. Duplicate form responses with the same source key will not create duplicate review rows.

## Payment confirmation

When a team member changes `Payment Review Status` to `Confirmed`, the automation will send the existing Cohort 2 payment-confirmation email.

It will:

- send only from the `Payment Review` tab;
- send only when the edited value is `Confirmed`;
- never resend a row already marked `Sent` or `Sending`;
- record failures so they can be reviewed and retried; and
- keep the existing preview, test-email, and safe bulk catch-up options.

Changing the status to `Pending` or `Rejected` will not send an email.

## Triggers

Setup will install three automatic triggers under the Google account that runs setup:

1. A form-submit trigger for copying new submissions and sending the received email.
2. An edit trigger for sending the confirmation email when the review status becomes `Confirmed`.
3. A five-minute retry trigger for work that could not run immediately because another automation was using the sheet.

Only one designated Google account should run setup. This avoids duplicate triggers and makes it clear which Gmail account sends the messages.

The script saves the designated account as the trigger owner and blocks a different account from installing another trigger set. To change accounts, the current owner must clear the triggers, release ownership, and then let the new account run setup.

## Safety rules

- Setup and syncing never send live emails.
- Test emails require a saved test recipient.
- Existing-applicant bulk email requires an explicit Yes/No confirmation.
- A row is marked `Sending` before Gmail is called, which reduces accidental duplicate sends.
- Invalid or missing email addresses are marked `Skipped - No Email`.
- If Gmail fails, the error is recorded in the appropriate error column.
- If final sheet tracking fails after Gmail sends, the row stays reserved for manual review rather than risking a duplicate email.
- The original form response data is never deleted.

## Menu and sidebar actions

The project will provide plain-language actions for:

- setting up the review automation;
- syncing existing form submissions;
- setting a test email address;
- previewing and testing the received email;
- previewing and sending received emails to existing applicants;
- previewing and testing the confirmation email;
- previewing and sending pending confirmation emails; and
- installing or clearing the automatic triggers.

## Completion checks

The work is complete when:

- setup creates and fills `Payment Review` without sending live email;
- a new simulated submission creates one review row and sends one acknowledgement;
- rerunning sync does not duplicate rows;
- existing applicants can be previewed and emailed only after confirmation;
- selecting `Confirmed` sends one confirmation email and records the result;
- selecting `Pending` or `Rejected` sends nothing;
- automated tests pass; and
- the updated files are pushed to the stated Apps Script project and Git repository.
