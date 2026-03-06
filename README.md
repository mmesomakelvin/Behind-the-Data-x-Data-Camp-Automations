# Behind the Data x Data Camp Automations

Multi-project Google Apps Script workspace for Behind the Data Academy.

## Workspace Structure

Each automation has its own folder, own `.clasp.json`, and own Script ID.

```text
projects/
  Reg_Automations/
  Payment_Receipt_Onboarding/
  AI_Agent_Automation/
scripts/
  clasp-project.ps1
  new-project.ps1
```

## Current Projects

- `Reg_Automations` (registration + selection email workflows)
- `Payment_Receipt_Onboarding` (green-row onboarding email workflow)
- `AI_Agent_Automation` (auto registration welcome-email + Discord onboarding workflow)

Project-specific details are documented in each project folder `README.md`.

## Common Commands

Push a specific project:

```powershell
.\scripts\clasp-project.ps1 -Project Reg_Automations -Action push
.\scripts\clasp-project.ps1 -Project Payment_Receipt_Onboarding -Action push
.\scripts\clasp-project.ps1 -Project AI_Agent_Automation -Action push
```

Create a new project:

```powershell
.\scripts\new-project.ps1 -Project New_Project_Name -ScriptId <NEW_SCRIPT_ID>
```

## Working Rule

Always confirm the project folder name before editing or pushing.

