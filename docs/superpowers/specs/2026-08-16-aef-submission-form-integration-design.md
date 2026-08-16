# AEF Submission Form Repository Integration Design

## Objective

Integrate the existing `C:\Users\okoro\Documents\aef-submission-form` Google Apps Script project into the Behind the Data x Data Camp Automations repository without changing its Apps Script deployment target.

## Repository Layout

Create a fifth project at:

```text
projects/
  AEF_Submission_Form/
    .clasp.json
    README.md
    src/
      appsscript.json
      Code.js
```

The source `.clasp.json` will remain inside `projects/AEF_Submission_Form/` and retain Script ID `1-TFUJZrjDhNocEDXV_EcBqZw1ghcceb3jZwyfQEq2waDi-w3SqoItFZP` with `rootDir` set to `src`.

## Deployment Isolation

Each folder under `projects/` is an independent Apps Script project with exactly one `.clasp.json` and one Script ID. The repository can therefore contain several Script IDs without conflict because clasp resolves its configuration from the selected project directory.

The named helper command for this project will be:

```powershell
.\scripts\clasp-project.ps1 -Project AEF_Submission_Form -Action push
```

This command changes into `projects/AEF_Submission_Form` before invoking clasp, ensuring that only the AEF submission-form Script ID is targeted. Integrating the project into Git does not automatically deploy it to Apps Script.

## File Handling

Copy the incoming `.clasp.json`, `src/appsscript.json`, and `src/Code.js` without changing their behavior. Add a project-specific `README.md` that explains the form setup workflow, stored Script ID, key files, and named push command.

Update the root `README.md` and `projects/README.md` so the fifth project appears in the workspace structure, current-project list, and command examples.

Leave the original `C:\Users\okoro\Documents\aef-submission-form` folder untouched during integration. The user may delete it after verifying the repository copy and GitHub push.

## Verification

Before committing the integrated project:

1. Compare the copied `.clasp.json`, manifest, and `Code.js` against the source files.
2. Parse both JSON files successfully.
3. Run a JavaScript syntax check on `Code.js`.
4. Confirm the copied `.clasp.json` contains the expected Script ID and `rootDir`.
5. Confirm the project helper resolves `AEF_Submission_Form` to the correct folder.
6. Review the Git diff and ensure no unrelated files are included.

No live `clasp push`, form creation, trigger installation, or email sending is part of this integration. The final approved repository changes will be committed and pushed to the existing GitHub `origin` on `main`.

## Error and Recovery Behavior

If file comparison or validation fails, stop before committing and correct the repository copy. Because the original source folder remains untouched, it is the recovery source until integration is verified.

