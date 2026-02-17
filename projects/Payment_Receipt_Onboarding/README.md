# Payment_Receipt_Onboarding

Apps Script project folder for the payment receipt/onboarding workflow.

## What this project does
- Sends a standard onboarding email to people in the source sheet.
- Sends only rows marked with green fill in the marker column (`Full Name` by default).
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

## Push commands
- Push this project:
  - `.\\scripts\\clasp-project.ps1 -Project Payment_Receipt_Onboarding -Action push`

## New files
- `src/Code.js`
- `src/EmailTemplate.js`
