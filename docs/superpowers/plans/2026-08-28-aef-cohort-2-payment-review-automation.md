# AEF Cohort 2 Payment Review Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a safe `Payment Review` workflow that acknowledges submitted payment evidence and sends the final confirmation only after the team marks payment as confirmed.

**Architecture:** `Form_Responses` remains the permanent source. A sync layer copies selected fields into `Payment Review` using a hidden stable response key, while two separate mail paths write to separate tracking columns. Installable form-submit, edit, and five-minute retry triggers run the automatic parts.

**Tech Stack:** Google Apps Script JavaScript, Google Sheets, GmailApp, installable Apps Script triggers, Node.js built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-28-aef-cohort-2-payment-review-automation-design.md`

## Global Constraints

- Use spreadsheet ID `10v2U9Sn6JpcPP3Zr1d_z46s7PIuuJQlgjj7VY2mb0Y4`.
- Read only from the exact source tab `Form_Responses` and manage decisions only in `Payment Review`.
- Setup and sync must not send live participant email.
- The acknowledgement must say the payment evidence is under review, not confirmed.
- Existing-applicant catch-up must show a count and require a Yes/No confirmation.
- Keep source responses intact and prevent duplicate review rows and duplicate emails.
- Explain all user-facing actions in plain English.

---

### Task 1: Review-sheet sync and safe backfill

**Files:**
- Modify: `projects/AEF_Cohort_2_Payment_Confirmation/tests/payment-confirmation.test.js`
- Modify: `projects/AEF_Cohort_2_Payment_Confirmation/src/Code.js`

**Interfaces:**
- Consumes: source rows with `Timestamp`, `Email address`, `Full Name`, `LinkedIn Url`, `Payment Evidence`, and `Account Number`.
- Produces: `ensureAefPaymentReviewSheet_()`, `syncAefPaymentReviewRows_()`, `getAefPaymentReviewColumnIndexes_()`, and one review row per stable source key.

- [ ] **Step 1: Write failing sync tests**

Add tests that expect setup to create the exact review headers, copy current applicants without calling Gmail, preserve a team member's existing review decision, and avoid duplicate rows when sync is run twice.

- [ ] **Step 2: Run the tests and verify the new cases fail**

Run: `node --test projects/AEF_Cohort_2_Payment_Confirmation/tests/payment-confirmation.test.js`

Expected: the new tests fail because the review-sheet functions do not exist.

- [ ] **Step 3: Implement the smallest sync layer**

Add configuration for `Payment Review`, the 13 specified headers, a hidden source key, review-sheet creation, status validation, and update-or-insert syncing. Copy only the five requested applicant fields and the internal key. Keep existing management columns when updating a row.

- [ ] **Step 4: Run the tests and verify they pass**

Run the same Node test command. Expected: all sync tests pass.

### Task 2: Received-under-review email

**Files:**
- Create: `projects/AEF_Cohort_2_Payment_Confirmation/src/ReceivedEmailTemplate.js`
- Modify: `projects/AEF_Cohort_2_Payment_Confirmation/tests/payment-confirmation.test.js`
- Modify: `projects/AEF_Cohort_2_Payment_Confirmation/src/Code.js`

**Interfaces:**
- Consumes: a review row and its `Received Email` tracking fields.
- Produces: `getAefPaymentReceivedEmailHtml(fullName)`, `getAefPaymentReceivedEmailPlainText(fullName)`, `processAefPaymentReceivedRow_()`, preview/test actions, and the confirmed bulk catch-up action.

- [ ] **Step 1: Write failing acknowledgement tests**

Add tests proving the email says “under review” and “not payment confirmation”, a valid unsent row sends once, a missing email is skipped, a sent row is not resent, and cancelling the bulk confirmation sends nothing.

- [ ] **Step 2: Run the tests and verify the new cases fail**

Run the Node test command. Expected: failures name the missing template and received-email processing functions.

- [ ] **Step 3: Implement the template and safe sender**

Create the HTML and plain-text template. Add preview, test-send, pending-count, and confirmed bulk-send functions. Reserve each review row with `Sending` before calling Gmail, then write `Sent`, `Failed`, or `Skipped - No Email` to the received-email tracking fields.

- [ ] **Step 4: Run the tests and verify they pass**

Run the Node test command. Expected: all acknowledgement tests pass.

### Task 3: Automatic form-submit and confirmation flows

**Files:**
- Modify: `projects/AEF_Cohort_2_Payment_Confirmation/tests/payment-confirmation.test.js`
- Modify: `projects/AEF_Cohort_2_Payment_Confirmation/src/Code.js`

**Interfaces:**
- Consumes: an installable form-submit event, edits in the `Payment Review Status` column, and queued work entries.
- Produces: `handleAefPaymentFormSubmit(e)`, `handleAefPaymentReviewEdit(e)`, and `processQueuedAefPaymentEmails()`.

- [ ] **Step 1: Write failing trigger-flow tests**

Add tests proving a new form submission syncs and sends its acknowledgement, a `Confirmed` edit sends the final confirmation, `Pending` and `Rejected` edits do not send, a busy lock queues the correct email type, and setup creates exactly one form-submit, one edit, and one five-minute retry trigger.

- [ ] **Step 2: Run the tests and verify the new cases fail**

Run the Node test command. Expected: failures identify the missing event handlers and trigger configuration.

- [ ] **Step 3: Implement the automatic handlers and shared retry queue**

Install the three trigger types. Route queued entries by `received` or `confirmation`, use the stable source key to find the current review row, and clear a queued entry only after it has been processed or safely recorded.

- [ ] **Step 4: Run the tests and verify they pass**

Run the Node test command. Expected: all trigger and retry tests pass.

### Task 4: Plain-language controls and documentation

**Files:**
- Modify: `projects/AEF_Cohort_2_Payment_Confirmation/src/AutomationButtons.html`
- Modify: `projects/AEF_Cohort_2_Payment_Confirmation/README.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: the setup, sync, preview, test-send, catch-up, and trigger functions from Tasks 1–3.
- Produces: a menu/sidebar that exposes every safe action and a testing guide an operator can follow.

- [ ] **Step 1: Update the menu and sidebar**

Label setup, sync, received-email, confirmation-email, and trigger controls in everyday English. Clearly mark both bulk sends as live actions.

- [ ] **Step 2: Update the project guide**

Explain what each column means, which account should run setup, why setup does not email current applicants, how to test with a personal address, and how to send acknowledgements to current applicants after testing.

- [ ] **Step 3: Run syntax and full automated checks**

Run:

```powershell
node --check projects/AEF_Cohort_2_Payment_Confirmation/src/Code.js
node --check projects/AEF_Cohort_2_Payment_Confirmation/src/EmailTemplate.js
node --check projects/AEF_Cohort_2_Payment_Confirmation/src/ReceivedEmailTemplate.js
node --test projects/AEF_Cohort_2_Payment_Confirmation/tests/payment-confirmation.test.js
Get-Content projects/AEF_Cohort_2_Payment_Confirmation/src/appsscript.json | ConvertFrom-Json | Out-Null
```

Expected: every command exits successfully and all tests pass.

### Task 5: Review and publish

**Files:**
- Review all files changed by Tasks 1–4.

**Interfaces:**
- Consumes: the completed local implementation.
- Produces: reviewed code pushed to Apps Script and committed and pushed to Git.

- [ ] **Step 1: Request a focused code review**

Ask the reviewer to check for accidental live sends, duplicate-email risk, wrong-sheet handling, trigger duplication, queue loss, and spec gaps. Correct every verified important finding and rerun the full checks.

- [ ] **Step 2: Push to the Cohort 2 Apps Script project**

Run: `clasp.cmd push --force` from `projects/AEF_Cohort_2_Payment_Confirmation`.

Expected: Apps Script reports that all project files were pushed to script ID `1Qr0SzfzYm3m0Rg_E62inOC61lsP7iuPvFlPlZMFmWC9RdlLYTj4K24BJ`.

- [ ] **Step 3: Commit and push Git**

Stage only the Cohort 2 payment-review project, its root README entry, the specification, and this plan. Commit with message `Add AEF Cohort 2 payment review workflow`, then push `main` to `origin`.

- [ ] **Step 4: Give the operator exact test steps**

Explain how to refresh the sheet, run setup, set a test recipient, preview and send both test emails, test one new form submission, test a `Confirmed` edit on a test row, and only then use the existing-applicant catch-up action.
