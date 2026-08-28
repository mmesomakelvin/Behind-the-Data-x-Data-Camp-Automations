# Behind the Data x Data Camp Automations

Multi-project Google Apps Script workspace for Behind the Data Academy.

## Workspace Structure

Each automation has its own folder, own `.clasp.json`, and own Script ID.

```text
projects/
  Reg_Automations/
  Payment_Receipt_Onboarding/
  AI_Agent_Automation/
  AI_Agents_Cohort_Acceptance/
  AEF_Submission_Form/
  AEF_Cohort_2_Registration/
  AEF_Cohort_2_Payment_Confirmation/
scripts/
  clasp-project.ps1
  new-project.ps1
```

## Current Projects

- `Reg_Automations` (registration + selection email workflows)
- `Payment_Receipt_Onboarding` (green-row onboarding email workflow)
- `AI_Agent_Automation` (registration welcome email, accepted + reminder emails, and rejection email workflow)
- `AI_Agents_Cohort_Acceptance` (cohort acceptance payment-confirmation workflow)
- `AEF_Submission_Form` (Analytics Engineering Fellowship project-submission form workflow)
- `AEF_Cohort_2_Registration` (Cohort 2 application acknowledgement workflow)
- `AEF_Cohort_2_Payment_Confirmation` (Cohort 2 payment-review, receipt, and confirmation workflow)

Project-specific details are documented in each project folder `README.md`.

## Common Commands

Push a specific project:

```powershell
.\scripts\clasp-project.ps1 -Project Reg_Automations -Action push
.\scripts\clasp-project.ps1 -Project Payment_Receipt_Onboarding -Action push
.\scripts\clasp-project.ps1 -Project AI_Agent_Automation -Action push
.\scripts\clasp-project.ps1 -Project AI_Agents_Cohort_Acceptance -Action push
.\scripts\clasp-project.ps1 -Project AEF_Submission_Form -Action push
.\scripts\clasp-project.ps1 -Project AEF_Cohort_2_Registration -Action push
.\scripts\clasp-project.ps1 -Project AEF_Cohort_2_Payment_Confirmation -Action push
```

Create a new project:

```powershell
.\scripts\new-project.ps1 -Project New_Project_Name -ScriptId <NEW_SCRIPT_ID>
```

## Working Rule

Always confirm the project folder name before editing or pushing.

