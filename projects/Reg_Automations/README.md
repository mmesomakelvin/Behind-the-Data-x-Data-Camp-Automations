# Reg_Automations

Apps Script project folder for the registration automations workflow.

## Script ID

`1CmiVkmBuN-VUrPKMhTb98KJ2Wn0LjUasIvmRZvMzharuF-nGEuiXljlm`

## What This Project Does

- Syncs registration data from `Form responses 1` into `Auto-Reg Email`
- Sends registration welcome emails
- Assigns participant IDs
- Builds `Data Drill Downs` and `Location Master`
- Syncs selected people into `Selected People`
- Sends analytics report emails
- Sends acceptance and rejection emails from `Selection Map`

## Acceptance Workflow

Configuration lives in `src/Code.js` under `ACCEPTANCE_CONFIG`.

Eligibility:
- `Able to Commit = Yes`
- `Decision = Yes`
- Email exists
- `Acceptance Email Status` is not already `Sent`

Auto-managed columns:
- `Acceptance Email Status`
- `Acceptance Email Error`

Menu actions:
- `Send Acceptance Test Email`
- `Send Acceptance Emails (Eligible Only)`
- `Schedule Acceptance Retry (Every 6 Hours)`
- `Clear Acceptance Send Schedule`

## Rejection Workflow

Configuration lives in `src/Code.js` under `REJECTION_CONFIG`.

Eligibility:
- `Able to Commit = No`
- Email exists
- `Rejection Email Status` is not already `Sent`

Auto-managed columns:
- `Rejection Email Status`
- `Rejection Email Error`

Menu actions:
- `Send Rejection Test Email`
- `Send Rejection Emails (Able to Commit = No)`
- `Schedule Rejection Send (12:00 PM Today/Tomorrow)`
- `Clear Rejection Send Schedule`

## Key Files

- `src/Code.js` - menu actions and workflow logic
- `src/Emailtemplate.js` - registration, acceptance, and rejection templates
- `src/DataDrillDowns.js` - drill-down table builder
- `src/LocationMaster.js` - country/state summary sheet
- `src/SelectedPeople.js` - selected participant sync
- `src/Report.js` - analytics report send logic

## Push

```powershell
.\scripts\clasp-project.ps1 -Project Reg_Automations -Action push
```
