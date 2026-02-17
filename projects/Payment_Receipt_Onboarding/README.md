# Payment_Receipt_Onboarding

Apps Script project folder for the payment receipt/onboarding workflow.

## What this project does
- Sends a standard onboarding email to people in the source sheet.
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
4. Reload the Google Sheet and use menu: `Onboarding Email Manager` -> `Send Onboarding Emails (Pending)`.

## Push commands
- Push this project:
  - `.\\scripts\\clasp-project.ps1 -Project Payment_Receipt_Onboarding -Action push`

## New files
- `src/Code.js`
- `src/EmailTemplate.js`