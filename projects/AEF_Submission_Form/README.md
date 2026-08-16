# AEF_Submission_Form

Google Apps Script project for creating and processing the Analytics Engineering Fellowship project-submission form.

## Script ID

`1-TFUJZrjDhNocEDXV_EcBqZw1ghcceb3jZwyfQEq2waDi-w3SqoItFZP`

## What This Project Does

- Creates the submission Google Form and response spreadsheet.
- Requires exactly four selected engagements.
- Validates GitHub and Google Drive/Docs links.
- Records submissions in a review tracker.
- Sends either a confirmation email or a correction-request email.

## Setup

Run `setUpForm()` once in Apps Script. The function is safe to rerun after setup because the created Form and spreadsheet IDs are stored in Script Properties.

## Key Files

- `src/Code.js` - form creation, submission validation, review tracking, and email workflows
- `src/appsscript.json` - Apps Script runtime configuration
- `.clasp.json` - deployment target for this project only

## Push

```powershell
.\scripts\clasp-project.ps1 -Project AEF_Submission_Form -Action push
```
