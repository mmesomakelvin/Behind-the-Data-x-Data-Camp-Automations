# Payment_Receipt_Onboarding

Apps Script project folder for the payment receipt/onboarding workflow.

## What this project does
- Sends a standard onboarding email to people in the source sheet.
- Sends only rows marked with green fill in the marker column (`Full Name` by default).
- Can auto-send immediately when a row is formatted green (installable trigger).
- Adds send tracking columns automatically:
  - `Onboarding Email Status`
  - `Onboarding Email Error`
  - `Onboarding Email Sent At`
- Skips rows already marked `Sent`.

## Expected sheet setup
- Sheet name: `Form_Responses` (change in `src/Code.js` if needed)
- Required columns:
  - `Email address`
  - `Full Name`

## How to test before full send
1. Open the linked Google Sheet -> Extensions -> Apps Script.
2. Run `sendOnboardingTestEmail` once (authorize if prompted).
3. Confirm the test email in: `mmesomakelvin@gmail.com`.
4. Color one row green and leave one row not green.
5. Reload the Google Sheet and use menu: `Onboarding Email Manager` -> `Preview Eligible Green Rows`.
6. Use menu: `Onboarding Email Manager` -> `Send Onboarding Emails (Pending)`.
7. Confirm status columns:
   - Green rows with email become `Sent`.
   - Non-green rows become `Skipped - Not Green`.

## Schedule send at 8:00 AM
1. Open Apps Script for this sheet/project.
2. Run `scheduleOnboardingEmailsFor8amToday`.
3. If 8:00 AM has already passed for today, run `scheduleOnboardingEmailsFor8amTomorrow`.
4. To remove any existing schedule, run `clearOnboardingSendSchedule`.

Note: Scheduled sends also respect the green-row rule.

## Instant send when row is colored green
1. Open Apps Script for this project.
2. Run `enableInstantGreenSendTrigger` once (authorize if prompted).
3. This does two things:
   - Installs an `onChange` trigger (`FORMAT`) so green-format actions auto-run pending sends.
   - Runs an immediate catch-up send for already-green rows that are not `Sent`.
4. To disable this behavior, run `disableInstantGreenSendTrigger`.

## How to test instant trigger
1. Pick a test row with your own email and ensure status is not `Sent`.
2. Color the marker cell (usually `Full Name`) bright green.
3. Wait a few seconds, then check:
   - `Onboarding Email Status` becomes `Sent`
   - `Onboarding Email Sent At` gets a timestamp
4. If it does not send, open Apps Script -> Executions and check the latest `onOnboardingSheetChange` run.

## Push commands
- Push this project:
  - `.\\scripts\\clasp-project.ps1 -Project Payment_Receipt_Onboarding -Action push`

## New files
- `src/Code.js`
- `src/EmailTemplate.js`
