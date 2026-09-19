# Certificate check website

Public website where anyone can type a certificate ID (for example `AEF-2026-C1-0001-K7QX`)
and see whether it is a genuine Behind the Data Academy certificate.

**Live at https://btd-certificates.vercel.app**, hosted on Vercel (project `btd-certificates`,
team **Mmes V1**, `mmes-v1`). `vercel.json` tells Vercel this is a Next.js site.

**Publishing is automatic:** the project is connected to this GitHub repository (root directory
`sites/certificates`), so every push to `main` that changes this folder updates the live site.
Pushes that only change other folders are skipped. A manual publish is still possible from this
folder with `vercel deploy --prod`.

## What it does

- **Home page (`/`):** one box for the certificate ID and a picture showing where the ID is printed.
- **Certificate page (`/verify/<ID>`):**
  - **Found:** "This certificate is genuine", the details, a picture of the certificate, **Download PDF**,
    **Add to LinkedIn** and **Copy link**.
  - **Unknown ID:** a "No certificate matches this ID" page with tips (a real 404).
  - **Records can't be reached:** "We couldn't check this certificate right now". It never says a
    certificate is fake just because the check failed.
- **QR code (`/api/qr/<ID>`):** a PNG of the certificate's check-page link, used on the PDFs.
- Certificate pages are hidden from search engines, so fellows' names don't appear in Google.
- The picture of the certificate prints the signatory's name. The handwritten signature is only on the PDF.
- The picture also shows the fellow's QR code and the printed short link `bit.ly/4xwnpM4` (`SHORT_VERIFY_LINK` in `lib/links.ts`), matching the PDF.

## Where the data comes from

The site asks the `AEF_Cohort_1_Certificates` Apps Script (its web app, `src/Lookup.js`) about one ID at a
time, using a secret key. It only ever receives public details (name, programme, cohort, award, issue
date, PDF link), and only for certificates whose status is **Sent**.

Settings (Vercel environment variables; never commit them):

| Name | What it is |
| --- | --- |
| `CERT_LOOKUP_SOURCES` | JSON list of lookups by ID prefix: `[{"prefix":"AEF-2026-C1-","url":"<Apps Script web app URL>","key":"<lookup key>"}]`. Add an entry for each future cohort. |
| `NEXT_PUBLIC_SITE_URL` | The site's address, used in QR codes and share links. Default `https://btd-certificates.vercel.app`. |

## Running it on your computer

```powershell
cd sites/certificates
npm install
npm run dev
# open http://localhost:3000
```

Without `CERT_LOOKUP_SOURCES`, the site uses **practice data**, so every screen can be seen:

- `AEF-2026-C1-0001-K7QX` shows a verified certificate for "Ada Lovelace"
- `AEF-2026-C1-0000-DOWN` shows the "couldn't check right now" page
- any other ID shows "No certificate matches this ID"

Practice data is never used on the live site.

## Checks

```powershell
npm test          # automated checks (vitest)
npx tsc --noEmit  # type check (run `npx next typegen` first on a fresh copy)
npm run lint
```

## Key files

- `app/page.tsx` - home page
- `app/verify/[id]/page.tsx` - certificate page (found / couldn't check)
- `app/not-found.tsx` - "no certificate matches" page
- `app/api/qr/[id]/route.ts` - QR code image
- `components/CertificatePreview.tsx` - the certificate drawn in HTML
- `components/VerifiedActions.tsx` - Download, LinkedIn and Copy link buttons
- `lib/lookup.ts` - asks the Apps Script lookup; practice data
- `lib/links.ts` - site address, check-page links, LinkedIn link
