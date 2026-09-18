# AEF_Cohort_1_Certificates

Google Apps Script project that creates and emails Certificates of Participation to
Analytics Engineering Fellowship (AEF) Cohort 1 fellows.

## Script ID

`1_vqY0AOpfWI0a3kShqM5CmOzaJiBKUFCoybLMJ7whgSRJkCdSTTU6DhO`

This script is attached to the **AEF Submissions** spreadsheet (the one with the
"Review Tracker" tab), so its menu appears in that spreadsheet.

## What This Project Does

- Adds an **AEF Cohort 1 Certificates** menu and a sidebar of buttons to the AEF Submissions spreadsheet.
- Builds a **Certificates** tab listing every fellow with **at least one accepted project**
  (Review Tracker `Status` = `OK`). A fellow who submitted several times appears once.
- Gives each fellow a permanent certificate number: `AEF-2026-C1-0001`, `AEF-2026-C1-0002`, ...
  in the order they first submitted. Refreshing the list never changes a number.
- Tidies names typed all in lower or upper case (`ada lovelace` becomes `Ada Lovelace`).
- Emails nobody until the team ticks **Approved** on that fellow's row.
- For each approved fellow: makes the PDF, saves it in the **AEF Cohort 1 Certificates**
  Google Drive folder, emails it, and records `Sent`, the time and the PDF link.
- Never sends the same fellow twice. If an email fails, the Error column says why and the
  next run reuses the PDF already made.
- Refuses names too long to fit on one line and asks you to shorten them.

## Certificates Tab Columns

| Column | Who fills it | Meaning |
| --- | --- | --- |
| Certificate ID | Automation | Permanent number printed on the certificate |
| Name on certificate | Automation, then **you** | Exactly what is printed. Fix spelling here |
| Email | Automation | Where the certificate is sent |
| Name as submitted | Automation | The name the fellow typed on the form (for comparison) |
| Projects submitted | Automation | Number of different accepted projects |
| Approved | **You** | Tick when the row is ready to send |
| Certificate Status | Automation | blank, `PDF ready`, `Sent` or `Error` |
| PDF Link | Automation | The saved certificate in Google Drive |
| Sent At | Automation | When the email went out |
| Error | Automation | Why a row could not be sent |

## How The Certificate Is Made

The design lives in `artifacts/certificates/aef-cohort-1-certificate-sample.html`.

1. `scripts/render-certificate-background.ps1` saves the design **without** the name and
   number as `assets/signatures/aef-cohort-1-certificate-background.png`. This image contains
   the signature, so it is private and not stored in git.
2. The automation puts that image on an A4 landscape Google Slides page, adds the fellow's
   name and certificate number in Poppins, and saves it as a PDF. The temporary Slides file is deleted.
3. Text positions and sizes are in `src/CertificateLayout.js`. Long names get a smaller size automatically.

To see how any name will look, run a local server from the repository folder and open the preview page:

```powershell
python -m http.server 8765 --bind 127.0.0.1
# then open http://127.0.0.1:8765/artifacts/certificates/aef-cohort-1-certificate-preview.html
```

If the design changes, re-run `scripts/render-certificate-background.ps1` and upload the new image to the Drive folder.

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
6. Upload `assets/signatures/aef-cohort-1-certificate-background.png` into that Drive folder.

## Sending Certificates

1. Click **2. Build / Refresh Certificate List**.
2. Check each **Name on certificate** and tick **Approved** for rows that are ready.
3. Save your email under **Test email address**, select a fellow's row, and click
   **Send Test Certificate to Me**. Check the PDF carefully.
4. Click **Count Approved Waiting**, then **LIVE: Send Approved Certificates**.
5. If it says some are still waiting (large batches), click the LIVE button again.

Fellows who submit later can be added at any time with **Build / Refresh Certificate List**.

## Key Files

- `src/Code.js` - certificate list, PDF creation, sending and menu
- `src/CertificateLayout.js` - where the name and number go on the page
- `src/CertificateEmailTemplate.js` - the certificate email
- `src/AutomationButtons.html` - sidebar buttons
- `src/appsscript.json` - Apps Script settings (turns on the Google Slides service)
- `tests/certificates.test.js` - automated checks

## Tests

```powershell
node --test projects/AEF_Cohort_1_Certificates/tests/certificates.test.js
```

## Push

```powershell
.\scripts\clasp-project.ps1 -Project AEF_Cohort_1_Certificates -Action push
```
