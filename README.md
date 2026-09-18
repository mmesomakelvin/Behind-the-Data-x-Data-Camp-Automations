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
  AEF_Cohort_1_Certificates/
artifacts/
  certificates/
assets/
  branding/
  signatures/        (private - not stored in git)
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
- `AEF_Cohort_1_Certificates` (Cohort 1 certificate list, PDF creation, and certificate emails; attached to the AEF Submissions spreadsheet)

Project-specific details are documented in each project folder `README.md`.

## AEF Cohort 1 Certificates

Certificates for Analytics Engineering Fellowship Cohort 1 fellows who submitted at least one project.

- **Design sample:** `artifacts/certificates/aef-cohort-1-certificate-sample.html` (open in a browser; A4 landscape, Poppins font).
- **Signatory:** Ayoade Adegbite, Founder, Behind The Data Academy (single signatory).
- **Certificate number format:** `AEF-2026-C1-0001-K7QX`: a running number plus a random code, so numbers can't be guessed.
- **Who qualifies:** anyone with at least one submission the team marked **Ok** in the Review Tracker's Status dropdown.
- **Verification website (in progress):** a public site on Vercel where anyone can check a certificate number.
  Plan: `docs/plans/2026-09-18-feat-certificate-verification-website-plan.md`. Hold sending until it is live.
- **How they are sent:** the `AEF_Cohort_1_Certificates` project lists eligible fellows in a "Certificates" tab. The team fixes names and ticks "Approved", then the automation creates each PDF, saves it to Google Drive and emails it to the fellow. Full steps: `projects/AEF_Cohort_1_Certificates/README.md`.
- **Live preview:** `artifacts/certificates/aef-cohort-1-certificate-preview.html` shows how any name will look (serve the repo with `python -m http.server 8765`).
- **Background image:** `scripts/render-certificate-background.ps1` renders the design without the name and number for the automation.
- **Private files:** signature images live in `assets/signatures/`, which is not stored in git. Use `scripts/remove-signature-background.ps1` to make a signature background transparent.

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
.\scripts\clasp-project.ps1 -Project AEF_Cohort_1_Certificates -Action push
```

Create a new project:

```powershell
.\scripts\new-project.ps1 -Project New_Project_Name -ScriptId <NEW_SCRIPT_ID>
```

## Working Rule

Always confirm the project folder name before editing or pushing.

