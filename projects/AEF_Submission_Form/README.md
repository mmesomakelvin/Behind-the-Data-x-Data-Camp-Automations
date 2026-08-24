# AEF_Submission_Form

Google Apps Script project for creating and processing the Analytics Engineering Fellowship project-submission form.

## Script ID

`1-TFUJZrjDhNocEDXV_EcBqZw1ghcceb3jZwyfQEq2waDi-w3SqoItFZP`

## What This Project Does

- Creates the submission Google Form and response spreadsheet.
- Requires one selected engagement per submission.
- Tells each fellow to submit the form four times, once for each completed engagement.
- Validates GitHub and Google Drive/Docs links.
- Records each engagement submission as its own row in the review tracker.
- Sends either a confirmation email or a correction-request email.

## Setup

Run `setUpForm()` in Apps Script. The first run creates the form, response
spreadsheet, review tracker, and automatic submission trigger.

For an existing form, push the new code and immediately run `setUpForm()` again.
It will safely replace the old four-choice checkbox with the new one-choice
dropdown without creating another form or another trigger. Old four-choice
responses are still accepted during this short changeover, so a response cannot
be rejected just because it arrived while the form was being updated.

The live form uses a single-choice engagement question. Each submission contains one
engagement and its GitHub and/or Google Drive link. Fellows complete the same form four
times to submit four engagements. The form allows corrections and repeat submissions;
the review tracker shows each submission as a separate row, so reviewers can confirm
that each fellow submitted four different engagements.

## Key Files

- `src/Code.js` - form creation, submission validation, review tracking, and email workflows
- `src/appsscript.json` - Apps Script runtime configuration
- `.clasp.json` - deployment target for this project only

## Push

```powershell
.\scripts\clasp-project.ps1 -Project AEF_Submission_Form -Action push
```
