# AEF Cohort 1 Refund Email Automation

This Apps Script sends refund confirmation emails from the AEF Cohort 1 refund spreadsheet.

Everyone included in a live run is marked `Refund = Yes`. People whose `Portfolio Status` says `Submitted` are also told that their certificate will be sent by the weekend.

## Safe first-time test

1. Refresh the refund spreadsheet so the `AEF Cohort 1 Refund` menu appears.
2. Open the menu and click `Setup Refund Email Automation`.
3. Confirm that the Refund column has a Yes/No dropdown and that these columns were added:
   - Refund Email Status
   - Refund Email Error
   - Refund Email Sent At
4. Click `Set Test Email Recipient` and enter your own email address.
5. Click `Preview Refund Email`.
6. Click `Send Test Refund Email` and check your inbox.

The test email uses a sample submitted participant so you can see the certificate message. It does not change any participant's row.

## Send the real emails

1. Click `Count Refund Emails Waiting` and check the number.
2. When ready, click `LIVE: Mark All Refunded and Send Emails`.
3. Read the warning and click Yes only when you want the real emails to go out.
4. Review the three tracking columns after the run.

`Sent` means the email was delivered to Gmail for sending. `Error` means that row needs attention. Running the live option again retries Error rows but skips Sent and Sending rows.

## Important safety notes

- Publishing or setting up the script does not send participant emails.
- There are no automatic edit, form, or timed email triggers.
- The live menu option is the only action that sends participant emails.
- Do not clear a Sent status unless you deliberately want that person to receive the email again.

## Local checks

Run these commands from this project folder:

```powershell
node --test tests\refund-email.test.js
node --check src\Code.js
node --check src\RefundEmailTemplate.js
```
