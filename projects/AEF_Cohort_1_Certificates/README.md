# AEF_Cohort_1_Certificates

Google Apps Script project that creates and emails Certificates of Participation to
Analytics Engineering Fellowship (AEF) Cohort 1 fellows.

## Script ID

`1_vqY0AOpfWI0a3kShqM5CmOzaJiBKUFCoybLMJ7whgSRJkCdSTTU6DhO`

This script is attached to the **AEF Submissions** spreadsheet (the one with the
"Review Tracker" tab), so its menu appears in that spreadsheet.

## What This Project Does

- Adds an **AEF Cohort 1 Certificates** menu and a sidebar of buttons to the AEF Submissions spreadsheet.
- Builds a **Certificates** tab listing every fellow with **at least one accepted project**.
  "Accepted" means the team marked the row **Ok** in the Review Tracker's **Status** dropdown
  (column I). Blank or any other value is left out. The form's automatic "OK" in the
  Issues column is ignored on purpose. A fellow who submitted several times appears once (matched by email).
- Gives each fellow a permanent certificate number with a random code, such as `AEF-2026-C1-0001-K7QX`,
  numbered in the order they first submitted. The code stops anyone guessing other fellows'
  numbers on the verification website. Refreshing the list never changes a number.
- Writes each person's certificate number into a **Certificate ID** column at the end of the
  Review Tracker, on every one of their submission rows.
- **Updates automatically:** as soon as someone sets a Review Tracker row's Status to **Ok**, that
  person is added to the Certificates tab (or, if their email is already there, their project count
  is updated) and a small message appears at the bottom right. Nobody is emailed. The
  **Build / Refresh Certificate List** button does the same for all rows at once and is a safe backup.
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

## Verification Website Lookup

`src/Lookup.js` lets the certificate verification website (planned at
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

> **Do not send Cohort 1 certificates yet.** The QR code and website link still need to be
> added to the certificate and the email once the website is live.

## Sending Certificates

1. Mark submissions **Ok** in the Review Tracker's Status column; each person is added to the
   Certificates tab automatically. (Or click **2. Build / Refresh Certificate List** to update everyone at once.)
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
