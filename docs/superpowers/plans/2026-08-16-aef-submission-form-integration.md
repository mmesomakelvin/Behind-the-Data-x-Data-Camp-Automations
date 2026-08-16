# AEF Submission Form Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the existing AEF submission-form Apps Script as a fifth independently deployable project in this repository and publish the integration to GitHub.

**Architecture:** Preserve the incoming Apps Script source, manifest, and clasp configuration under `projects/AEF_Submission_Form/`. Deployment isolation comes from the project-local `.clasp.json`; repository documentation and the named helper command make the correct target explicit.

**Tech Stack:** Google Apps Script V8, clasp, PowerShell, Git, GitHub.

## Global Constraints

- Preserve Script ID `1-TFUJZrjDhNocEDXV_EcBqZw1ghcceb3jZwyfQEq2waDi-w3SqoItFZP`.
- Keep `rootDir` set to `src`.
- Do not modify or delete `C:\Users\okoro\Documents\aef-submission-form`.
- Do not run a live `clasp push`, create a form, install a trigger, or send email.
- Push the validated repository changes to the existing GitHub `origin` on `main`.

---

### Task 1: Add the independent Apps Script project

**Files:**
- Create: `projects/AEF_Submission_Form/.clasp.json`
- Create: `projects/AEF_Submission_Form/src/appsscript.json`
- Create: `projects/AEF_Submission_Form/src/Code.js`
- Create: `projects/AEF_Submission_Form/README.md`

**Interfaces:**
- Consumes: the three files under `C:\Users\okoro\Documents\aef-submission-form`
- Produces: a project directory addressable as `AEF_Submission_Form` by `scripts/clasp-project.ps1`

- [ ] **Step 1: Confirm the target does not already exist**

Run:

```powershell
Test-Path 'projects\AEF_Submission_Form'
```

Expected: `False`.

- [ ] **Step 2: Add the source files without changing their content**

Use `apply_patch` to add exact copies of:

```text
C:\Users\okoro\Documents\aef-submission-form\.clasp.json
C:\Users\okoro\Documents\aef-submission-form\src\appsscript.json
C:\Users\okoro\Documents\aef-submission-form\src\Code.js
```

to the corresponding paths under `projects/AEF_Submission_Form/`.

- [ ] **Step 3: Add the project README**

Create `projects/AEF_Submission_Form/README.md` with this operational contract:

```markdown
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

## Push

```powershell
.\scripts\clasp-project.ps1 -Project AEF_Submission_Form -Action push
```
```

- [ ] **Step 4: Verify content and configuration**

Run:

```powershell
Get-FileHash 'C:\Users\okoro\Documents\aef-submission-form\.clasp.json','projects\AEF_Submission_Form\.clasp.json'
Get-FileHash 'C:\Users\okoro\Documents\aef-submission-form\src\appsscript.json','projects\AEF_Submission_Form\src\appsscript.json'
Get-FileHash 'C:\Users\okoro\Documents\aef-submission-form\src\Code.js','projects\AEF_Submission_Form\src\Code.js'
Get-Content -Raw 'projects\AEF_Submission_Form\.clasp.json' | ConvertFrom-Json | Select-Object scriptId,rootDir
Get-Content -Raw 'projects\AEF_Submission_Form\src\appsscript.json' | ConvertFrom-Json | Select-Object timeZone,runtimeVersion
node --check 'projects\AEF_Submission_Form\src\Code.js'
```

Expected: each source/destination pair has the same SHA-256 hash; the Script ID and `src` root are correct; the manifest reports `Africa/Lagos` and `V8`; Node exits successfully.

### Task 2: Register the project in workspace documentation

**Files:**
- Modify: `README.md`
- Modify: `projects/README.md`

**Interfaces:**
- Consumes: the project name `AEF_Submission_Form`
- Produces: discoverable workspace structure, project summary, and named push examples

- [ ] **Step 1: Update the root workspace README**

Add `AEF_Submission_Form` to the structure and current-project lists, describe it as the Analytics Engineering Fellowship project-submission form workflow, and add:

```powershell
.\scripts\clasp-project.ps1 -Project AEF_Submission_Form -Action push
```

- [ ] **Step 2: Update the projects index**

Add the mapping:

```text
AEF_Submission_Form -> projects/AEF_Submission_Form
```

and its named push example.

- [ ] **Step 3: Verify all documentation references**

Run:

```powershell
rg -n 'AEF_Submission_Form' README.md projects\README.md projects\AEF_Submission_Form\README.md
```

Expected: the new project appears in all three README files with the same folder name.

### Task 3: Validate, commit, and publish

**Files:**
- Verify: all files changed since commit `a356f17`

**Interfaces:**
- Consumes: the integrated project and documentation from Tasks 1–2
- Produces: a clean commit pushed to `origin/main`

- [ ] **Step 1: Run repository validation**

Run:

```powershell
git diff --check
git status --short
git diff --stat a356f17
```

Expected: no whitespace errors; only the implementation plan, new project, and intended README updates are present.

- [ ] **Step 2: Confirm the source backup remains present**

Run:

```powershell
Test-Path 'C:\Users\okoro\Documents\aef-submission-form\.clasp.json'
Test-Path 'C:\Users\okoro\Documents\aef-submission-form\src\Code.js'
```

Expected: both return `True`.

- [ ] **Step 3: Commit the integration**

Run:

```powershell
git add README.md projects/README.md projects/AEF_Submission_Form docs/superpowers/plans/2026-08-16-aef-submission-form-integration.md
git commit -m "Add AEF submission form Apps Script project"
```

Expected: Git creates a commit containing only the planned files.

- [ ] **Step 4: Verify the commit before publication**

Run:

```powershell
git status --short
git show --stat --oneline HEAD
```

Expected: the worktree is clean and the commit contains the new project plus intended documentation.

- [ ] **Step 5: Push to GitHub and verify synchronization**

Run:

```powershell
git push origin main
git status -sb
```

Expected: the push succeeds and `main` is synchronized with `origin/main`.

