# AEF Cohort 1 Refund Email Design

## Purpose

Build a safe, button-controlled Apps Script automation for the AEF Cohort 1 refund sheet. Everyone currently listed has been refunded. The automation will mark them as refunded, email them once, and keep a clear record of what happened.

## Spreadsheet behaviour

The script will find the correct tab by looking for these existing headings:

- Email
- Name
- Account Number
- Bank
- Account Name
- Refund
- Portfolio Status

This means the automation will continue to work if the tab name changes.

The `Refund` column will receive a Yes/No dropdown. The script will add these columns after the existing data:

- Refund Email Status
- Refund Email Error
- Refund Email Sent At

Existing participant information will not be removed or rearranged.

## Sheet menu

The spreadsheet will have an `AEF Cohort 1 Refund` menu with these actions:

1. `Setup Refund Email Automation` adds the dropdown and tracking columns without sending email.
2. `Set Test Email Recipient` saves the administrator's test email address.
3. `Preview Refund Email` displays the message without sending it.
4. `Send Test Refund Email` sends only to the saved test address.
5. `Count Refund Emails Waiting` reports how many participants have not been emailed.
6. `LIVE: Mark All Refunded and Send Emails` asks for confirmation, marks all populated participant rows as `Refund = Yes`, and sends the live messages.

No automatic time-based or edit trigger will be installed. Live messages are sent only when the administrator chooses the live menu action and confirms the warning.

## Email content

The subject will be `Your AEF Cohort 1 Refund Has Been Processed`.

Every participant will be told that their fellowship commitment deposit has been refunded using the account details they submitted.

If `Portfolio Status` is `Submitted` (ignoring uppercase/lowercase differences and extra spaces), the email will also say that their certificate will be sent by the weekend. Participants without `Submitted` in that column will not see a certificate promise.

The message will use the existing Behind the Data Academy sender identity and a simple branded HTML layout, with a plain-text version for email clients that do not display HTML.

## Sending safety

- A live warning will show the number of emails about to be sent.
- A participant already marked `Sent` or `Sending` will be skipped.
- Each row will be marked `Sending` before Gmail is called, reducing the chance of duplicate emails if the button is clicked twice.
- A script lock will prevent two live batches from running at the same time.
- Successful sends will be marked `Sent` with the date and time.
- Missing or invalid addresses will be marked `Error` with a plain explanation.
- Gmail failures will be recorded as `Error`. Running the live action again will retry only unsent/error rows.

## Testing

Automated tests will check:

- The dropdown and tracking columns are created without disturbing existing columns.
- The standard refund email contains no certificate promise.
- A row with `Portfolio Status = Submitted` receives the certificate-by-weekend wording.
- `Sent` and `Sending` rows are skipped.
- Invalid email addresses are recorded without calling Gmail.
- A successful send updates the correct status and date columns.
- Cancelling the live warning sends nothing and changes no refund values.
- Confirming the live warning marks populated rows as refunded and sends only eligible messages.
- The test-email action never changes participant tracking information.

## Delivery

The finished files will be stored in `projects/AEF_Cohort_1_Refund`, tested locally, published to Apps Script project `1yhFI5LAgTdrMAeEHHyd-q1TLow5yKwkNU3NhPz-lpev-_AeVqmY8p-tI`, and backed up in Git.

Publishing the code will not send participant emails. The administrator must run the live menu action from the spreadsheet.
