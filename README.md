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
sites/
  certificates/      (certificate check website - Next.js on Vercel)
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

## AEF Cohort 1 Certificates and the Certificate Check Website

Certificates for Analytics Engineering Fellowship Cohort 1, plus a public website where anyone
can confirm a certificate is genuine. Both are working; the certificates have not been emailed yet.

### How the pieces fit together

1. **Review Tracker (AEF Submissions spreadsheet).** The team marks a submission **Ok** in the
   Status dropdown. That person is added straight away to a **Certificates** tab and given a
   permanent certificate number such as `AEF-2026-C1-0004-3APP` (running number plus a random
   code, so numbers cannot be guessed). The same number is written back into a **Certificate ID**
   column on the tracker. A fellow who submitted several times gets one row and one number.
2. **Check and approve.** The team corrects the spelling in **Name on certificate** and ticks
   **Approved**. Nothing is emailed by ticking.
3. **Make the PDFs (no email).** One button creates each approved fellow's certificate, saves it in
   the **AEF Cohort 1 Certificates** Google Drive folder and fills in the **PDF Link** column, so
   every certificate can be checked before anyone receives it.
4. **Send.** The LIVE button emails each approved fellow their PDF once, and records `Sent`, the
   time and the link. Nobody is ever emailed twice.
5. **Verify.** From the moment a certificate is `Sent`, its number and QR code work on the website.

### The certificate

- **Design:** `artifacts/certificates/aef-cohort-1-certificate-sample.html`, A4 landscape
  (29.7 x 21 cm), Poppins font, ivory paper with navy, teal and gold.
- **Signatory:** Ayoade Adegbite, Founder, Behind The Data Academy.
- **On every certificate:** the fellow's name, their certificate number, an **AEF Verified** seal,
  a **QR code** that opens that fellow's own check page, and the printed line
  **Verify at bit.ly/4xwnpM4** (the short link to the website's search page).
- **Preview any name:** `artifacts/certificates/aef-cohort-1-certificate-preview.html`
  (serve the repo with `python -m http.server 8765`).
- **Design image:** `scripts/render-certificate-background.ps1` renders the design without the name,
  number and QR code. The result is uploaded to the Drive folder and used for every certificate.
- **Private files:** signature images and the rendered design live in `assets/signatures/`, which is
  **not stored in git**, because they contain the signature.

### The certificate check website

- **Live:** https://btd-certificates.vercel.app (short link **bit.ly/4xwnpM4**).
- **Code:** `sites/certificates/` (Next.js, hosted on Vercel in the **Mmes V1** account). Every push
  to `main` that changes that folder updates the live site automatically.
- Anyone enters a certificate number and sees either "This certificate is genuine", with the details,
  a picture of the certificate and a PDF download, or "No certificate matches this ID". If the records
  cannot be reached it says so plainly, and never calls a real certificate fake.
- **Where its data comes from:** it asks the certificate automation about one number at a time, using
  a secret key, and only ever receives public details (name, programme, cohort, award, issue date and
  PDF link). Emails are never sent to the website. Only certificates marked `Sent` verify.
- Certificate pages are hidden from search engines, so fellows' names do not appear in Google.

### Full instructions

- Certificate automation and its buttons: `projects/AEF_Cohort_1_Certificates/README.md`
- Website: `sites/certificates/README.md`
- Background and decisions: `docs/brainstorms/2026-09-18-certificate-verification-platform-brainstorm.md`
  and `docs/plans/2026-09-18-feat-certificate-verification-website-plan.md`

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

## Contributors

| Name | GitHub | Role |
| --- | --- | --- |
| Mmesoma Okoronkwo | [@mmesomakelvin](https://github.com/mmesomakelvin) | Repository owner and maintainer |
| Adegbite Ayoade Abel | [@tripleaceme](https://github.com/tripleaceme) | Founder, Behind The Data Academy |
| Behind The Data Academy | [@BehindTheDataAcademy](https://github.com/BehindTheDataAcademy) | Academy account |

New collaborators are invited from the repository's **Settings > Collaborators** page. They appear
in GitHub's Contributors list once they push their first commit.

## Working Rule

Always confirm the project folder name before editing or pushing.

