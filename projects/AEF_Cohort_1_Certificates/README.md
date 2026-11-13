# AEF_Cohort_1_Certificates

Google Apps Script project that creates and emails Certificates of Completion and Participation to
Analytics Engineering Fellowship (AEF) Cohort 1 fellows.

## Script ID

`1_vqY0AOpfWI0a3kShqM5CmOzaJiBKUFCoybLMJ7whgSRJkCdSTTU6DhO`

This script is attached to the **AEF Submissions** spreadsheet (the one with the
"Review Tracker" tab), so its menu appears in that spreadsheet.

## What This Project Does

- Adds an **AEF Cohort 1 Certificates** menu and a sidebar of buttons to the AEF Submissions spreadsheet.
- Builds the **Certificates** tab from the separate [Cohort 1 roster](https://docs.google.com/spreadsheets/d/1vPAOd2B_YAVcEnO8hXN7Az7o6bcz4J_UqjUHEfAcSQY/edit?gid=823742110).
  It reads only column A (**Email**) and column B (**Name**), never the bank or refund columns.
  Everyone on that roster gets one row, matched by email. Existing certificate IDs, corrected
  names, approvals and PDF links are kept.
- Gives a roster fellow a **Certificate of Completion** when they have at least one accepted
  project in the AEF Submissions **Review Tracker**. "Accepted" means the team marked the
  project's **Status** dropdown **Ok**. The form's automatic "OK" in **Issues** is ignored.
  Roster fellows without an accepted project receive a **Certificate of Participation**.
- Gives each fellow a permanent certificate number with a random code, such as `AEF-2026-C1-0001-K7QX`,
  numbered in the order they first submitted or were added from the roster. The code stops anyone guessing other fellows'
  numbers on the verification website. Refreshing the list never changes a number.
- Writes each person's certificate number into a **Certificate ID** column at the end of the
  Review Tracker, on every one of their submission rows.
- **Updates automatically:** when a roster fellow's Review Tracker Status becomes **Ok**,
  their project count is refreshed. Nobody is emailed. **Import Roster / Refresh Certificate
  List** brings in the full roster and refreshes all accepted-project counts.
- Tidies names typed all in lower or upper case (`ada lovelace` becomes `Ada Lovelace`).
- Emails nobody until the team ticks **Approved** on that fellow's row.
- For each approved fellow: makes the PDF, saves it in the **AEF Cohort 1 Certificates**
  Google Drive folder, emails it, and records `Sent`, the time and the PDF link.
- Never sends the same fellow twice. If an email fails, the Error column says why and the
  next run reuses the PDF already made.
- Refuses names too long to fit on one line and asks you to shorten them.
- Shares each certificate PDF as "anyone with the link can view", so the verification website can offer downloads.
- Answers the verification website's "is this certificate real?" question (see below).

## Certificates Tab Columns

| Column | Who fills it | Meaning |
| --- | --- | --- |
| Certificate ID | Automation | Permanent number printed on the certificate |
| Name on certificate | Automation, then **you** | Exactly what is printed. Fix spelling here |
| Email | Automation | Where the certificate is sent |
| Name as submitted | Automation | The name from the form for project recipients, or from the roster for participants |
| Projects submitted | Automation | Number of different accepted projects; one or more means Completion, zero means Participation |
| Approved | **You** | Tick when the row is ready to send |
| Certificate Status | Automation | blank, `PDF ready`, `Sent` or `Error` |
| PDF Link | Automation | The saved certificate in Google Drive |
| Sent At | Automation | When the email went out |
| Error | Automation | Why a row could not be sent |
| Award | Automation | Completion or Participation, recorded with the PDF so verification stays accurate after sending |

On the next Setup, Refresh, PDF creation or Send run, the script adds the **Award** heading
in column K if it is missing. Keep column K free before that run. Older certificates already
marked `Sent` keep their original Participation label when this column is blank.

## How The Certificate Is Made

Both designs live in `artifacts/certificates/aef-cohort-1-certificate-sample.html`.
Completion uses a navy and gold frame; Participation has a lighter teal look. Both briefly
cover data literacy, SQL, Python, cloud data tools and version control. Participation does
not claim project work.

1. Run `scripts/render-certificate-background.ps1` with `-Award completion` and then
   `-Award participation`. It saves each design **without** the name and number as
   `assets/signatures/aef-cohort-1-completion-background.png` and
   `assets/signatures/aef-cohort-1-certificate-background.png`. Both images contain the
   signature, so they are private and not stored in git.
   On a computer that blocks PowerShell scripts by default, run:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\render-certificate-background.ps1 -Award completion
   powershell -ExecutionPolicy Bypass -File .\scripts\render-certificate-background.ps1 -Award participation
   ```
2. The automation copies the **AEF Certificate Template** (an A4 landscape Google Slides file), puts that image on it, adds the fellow's
   name and certificate number in Poppins, and saves it as a PDF. The temporary Slides file is deleted.
3. Each fellow's **QR code** is fetched from the verification website (`https://btd-certificates.vercel.app/api/qr/<ID>`)
   and placed above the printed "Scan to verify". Scanning it opens that fellow's own check page. The footer
   also prints **Verify at bit.ly/4xwnpM4** (part of the design image; the Bitly link points to the website's
   home page and is case-sensitive).
4. Text and QR positions are in `src/CertificateLayout.js`. Long names get a smaller size automatically.

The certificate email includes a **View or verify your certificate online** button linking to the fellow's
own check page.

To see how any name will look, run a local server from the repository folder and open the preview page:

```powershell
python -m http.server 8765 --bind 127.0.0.1
# then open http://127.0.0.1:8765/artifacts/certificates/aef-cohort-1-certificate-preview.html
```

If a design changes, render it again, upload the new image to the Drive folder, then use
**Create PDFs for Approved (no email)** to rebuild and inspect the unsent PDFs.

## One-time Setup

Steps 1-3 are done (the script is attached and the code is pushed).

1. Open the **AEF Submissions** spreadsheet, then **Extensions > Apps Script**.
2. In Apps Script, open **Project Settings** and copy the **Script ID**.
3. Put it in `projects/AEF_Cohort_1_Certificates/.clasp.json` and push the code:

   ```powershell
   .\scripts\clasp-project.ps1 -Project AEF_Cohort_1_Certificates -Action push
   ```

4. Reload the spreadsheet. Open **AEF Cohort 1 Certificates > Open Automation Buttons**.
5. Click **1. Setup Certificates** and approve the Google permissions. This creates the
   Certificates tab and the **AEF Cohort 1 Certificates** Drive folder.
6. Upload both background files from `assets/signatures/` into that Drive folder. If an older
   Participation background is already there, replace it with the newly rendered file.
7. In that same Drive folder, make the **certificate template**. This is needed because Google ignores
   page sizes when a script creates a presentation, so the A4 size has to come from a file a person set up:
   - **New > Google Slides > Blank presentation**
   - Rename it exactly **AEF Certificate Template**
   - **File > Page setup > Custom**, enter **29.7 x 21 centimetres**, then **Apply**
   - Leave the slide empty. Each certificate is built on a temporary copy of it.

## Verification Website Lookup

`src/Lookup.js` lets the certificate verification website (live at
`https://btd-certificates.vercel.app`) check a certificate number. The website sends the number plus a
secret key, and gets back only the public details: name, programme, cohort, award, issue date and
PDF download link. It **never** gets emails, approvals or errors. Only certificates whose status is
**Sent** verify.

- Make the secret key with **Create Website Lookup Key** (sidebar or menu). It pops up in a box once; copy it and paste it into Vercel.
  Making a new key stops the old one working.
- The lookup is published as an Apps Script web app (settings in `src/appsscript.json`):
  - Deployment ID: `AKfycbzXbA6zB7uo6B8Wk-2KpqURbr3KKpRe_ZGtE2zuSQdkXBxg5Sn67AwnN52LpqfeYnKg`
  - Address: `https://script.google.com/macros/s/AKfycbzXbA6zB7uo6B8Wk-2KpqURbr3KKpRe_ZGtE2zuSQdkXBxg5Sn67AwnN52LpqfeYnKg/exec`
  - Without the right key it only ever answers `{"ok":false,"error":"unauthorized"}`.
  - **After changing the code**, push it and then update this same deployment so the address stays the same:

    ```powershell
    .\scripts\clasp-project.ps1 -Project AEF_Cohort_1_Certificates -Action push
    .\scripts\clasp-project.ps1 -Project AEF_Cohort_1_Certificates -Action update-deployment -ExtraArgs AKfycbzXbA6zB7uo6B8Wk-2KpqURbr3KKpRe_ZGtE2zuSQdkXBxg5Sn67AwnN52LpqfeYnKg
    ```

Plan: `docs/plans/2026-09-18-feat-certificate-verification-website-plan.md`.

> **Ready to send.** The website is live at https://btd-certificates.vercel.app, and every
> certificate carries its QR code and the printed link bit.ly/4xwnpM4. A certificate shows as
> genuine on the website once its status is `Sent`.

## Sending Certificates

1. Mark accepted submissions **Ok** in the Review Tracker's Status column. Click
   **2. Import Roster / Refresh Certificate List** in the AEF Submissions sidebar. This adds
   everyone from the separate roster to the **Certificates** tab in AEF Submissions. Accepted
   project recipients get Completion; the remaining roster fellows get Participation.
2. Check each **Name on certificate** and tick **Approved** for rows that are ready. Ticking sends nothing.
3. Click **Create PDFs for Approved (no email)**. Each approved person's PDF is made and saved in the Drive
   folder, **PDF Link** is filled in and **Certificate Status** becomes `PDF ready`. Open and check each one.
   Nobody is emailed. Running it again rebuilds the PDFs (for example after a name correction or a design change).
4. Optional: select a row, save your email under **Test email address**, and click **Send Test Certificate to Me**.
5. Click **Count Approved Waiting**, then **LIVE: Send Approved Certificates**. The PDFs already made are reused.
   If a name was changed after its PDF was made, a fresh PDF is made automatically before sending.
6. If it says some are still waiting (large batches), click the LIVE button again.

**Certificate Status** is filled in by the automation:

| Status | Meaning |
| --- | --- |
| *(blank)* | Nothing done yet |
| `PDF ready` | PDF made and saved; not emailed yet |
| `Sent` | Emailed. From now on the certificate shows as genuine on the verification website |
| `Error` | Something went wrong; the **Error** column says what. Fix it and run again |

## Key Files

- `src/Code.js` - certificate list, PDF creation, sending and menu
- `src/CertificateLayout.js` - where the name and number go on the page
- `src/CertificateEmailTemplate.js` - the certificate email
- `src/Lookup.js` - the verification website's lookup (public details only)
- `src/AutomationButtons.html` - sidebar buttons
- `src/appsscript.json` - Apps Script settings (turns on the Google Slides service)
- `tests/certificates.test.js`, `tests/lookup.test.js` - automated checks

## Tests

```powershell
node --test projects/AEF_Cohort_1_Certificates/tests/certificates.test.js projects/AEF_Cohort_1_Certificates/tests/lookup.test.js
```

## Push

```powershell
.\scripts\clasp-project.ps1 -Project AEF_Cohort_1_Certificates -Action push
```
