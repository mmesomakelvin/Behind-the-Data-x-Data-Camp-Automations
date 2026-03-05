# Projects Folder

Each subfolder in this directory is one Apps Script project with its own `.clasp.json` and `scriptId`.

Current projects:
- `Reg_Automations` -> `projects/Reg_Automations`
- `Payment_Receipt_Onboarding` -> `projects/Payment_Receipt_Onboarding`
- `AI_Agent_Automation` -> `projects/AI_Agent_Automation`

Rules:
- Do not share one `.clasp.json` across multiple projects.
- Use one folder per script ID.
- Push using the helper script so you always target a named project.

Examples:
- Push original project: `.\scripts\clasp-project.ps1 -Project Reg_Automations -Action push`
- Push new project: `.\scripts\clasp-project.ps1 -Project Payment_Receipt_Onboarding -Action push`
- Push AI agent project: `.\scripts\clasp-project.ps1 -Project AI_Agent_Automation -Action push`
- Create future project: `.\scripts\new-project.ps1 -Project New_Project_Name -ScriptId <SCRIPT_ID>`
