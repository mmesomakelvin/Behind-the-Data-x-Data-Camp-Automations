# Certificate Verification Platform - Brainstorm

**Date:** 2026-09-18
**Status:** Ready for planning

## What We're Building

A public website, hosted on Vercel, where anyone can type a **certificate ID**
(for example `AEF-2026-C1-0001`) and see whether it is a genuine Behind the Data
Academy certificate.

- **One search box, one input: the certificate ID.** Fellows and verifiers (employers,
  recruiters) use the same search. There is no search by name or email.
- **A valid ID shows:** a "Verified" badge, the fellow's name, programme, cohort,
  award type, issue date, a picture of the certificate, and a **Download PDF** button.
- **An unknown ID shows** a clear "no certificate matches" page with tips (check the
  dashes, certificates appear only after they are issued, who to contact).
- **Each certificate has its own page address** (for example `/verify/AEF-2026-C1-0001`)
  so it can be shared.
- **Extras in the first version:**
  - A QR code printed on each certificate PDF that opens its verification page.
  - A "View or verify your certificate online" link in the certificate email.
  - An **Add to LinkedIn** button that pre-fills LinkedIn's "Add licence or certification" form.
  - A **Copy verification link** button.
- **Built for every programme and cohort**, not just AEF Cohort 1. The certificate ID
  says which programme and cohort it belongs to.

## Why This Approach

The data stays in the Google Sheet the team already uses. The existing
`AEF_Cohort_1_Certificates` Apps Script project gets a small lookup service: the
website asks it about one certificate ID, and it replies with **only the public
details** for that one certificate. The website never receives fellows' emails
or the full list.

We rejected the alternatives:
- **Reading the sheet directly from Vercel** needs a Google Cloud robot account and
  a secret key, and would give the website access to every email.
- **Publishing the sheet as a public file** would expose every fellow's email.

A lookup takes 1-2 seconds, which is fine for occasional verification.

## Key Decisions

1. **Lookup by certificate ID only.** Nobody can browse or search by name, which
   protects fellows' privacy. Fellows find their ID in their certificate email and on the PDF.
2. **A certificate counts as genuine only once its Status is "Sent".** Draft,
   unapproved or failed rows are never shown.
3. **The result page shows the full details, a picture of the certificate and a PDF download.**
4. **The data source is the Apps Script lookup service (approach A).** It returns public
   fields only: ID, name, programme, cohort, award, issue date and PDF link.
5. **The free Vercel address for now** (for example `btd-certificates.vercel.app`). A custom
   domain can be added later, and the Vercel address keeps working, so printed
   QR codes never break.
6. **The picture of the certificate on the site is drawn from the same design** as the
   PDF, so it is sharp on every screen. The Download button serves the real PDF.
7. **The PDF download link must work for anyone**, so each PDF's Drive sharing is set to
   "anyone with the link can view" when it is sent.
8. **Hold sending Cohort 1 certificates until the site is live**, because the QR code
   and email link need the final site address.
9. **Look and feel matches the certificate:** ivory paper, navy text, teal and gold
   accents, and the Poppins font.

## Resolved Questions

- *Should fellows search with their email?* No. The certificate ID is the only lookup.
- *Should unapproved certificates verify?* No. Only rows with Status "Sent" verify.
- *Just this cohort, or all?* All programmes and cohorts.
- *Own domain now?* No. Use the free Vercel address; a custom domain can come later.
- *Remove a certificate?* If a row is deleted, or its Status changes from "Sent",
  its ID stops verifying. No separate "revoked" feature for now.

- *Can someone list every fellow by counting through certificate numbers?* Not any more.
  Decided during planning: IDs get a random 4-character code, for example `AEF-2026-C1-0001-K7QX`.

## Open Questions

None. Everything else is implementation detail for the plan.
