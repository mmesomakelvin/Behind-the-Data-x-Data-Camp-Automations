# AEF Cohort 1 Refund Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe menu button that marks all listed AEF Cohort 1 participants as refunded and sends each person one refund email, with a certificate-by-weekend note only for submitted portfolios.

**Architecture:** The bound Apps Script reads the sheet by heading names instead of relying on a tab name or fixed column letters. `Code.js` owns the menu, sheet setup, recipient selection, sending safety, and tracking; `RefundEmailTemplate.js` owns the HTML and plain-text message. Node tests run both files in a controlled Apps Script-like environment.

**Tech Stack:** Google Apps Script V8, Google Sheets, GmailApp, Node.js built-in test runner

**Spec:** `docs/superpowers/specs/2026-09-04-aef-cohort1-refund-email-design.md`

## Global Constraints

- Publishing code must not send participant emails.
- Live email requires a menu action followed by a Yes/No warning.
- Every populated participant row is marked `Refund = Yes` only after live confirmation.
- `Sent` and `Sending` rows are never sent again.
- Only `Portfolio Status = Submitted`, ignoring case and surrounding spaces, receives the certificate-by-weekend sentence.
- No edit, form-submit, or time-based trigger is installed.

---

### Task 1: Refund email templates

**Files:**
- Create: `projects/AEF_Cohort_1_Refund/src/RefundEmailTemplate.js`
- Create: `projects/AEF_Cohort_1_Refund/tests/refund-email.test.js`

**Interfaces:**
- Produces: `getAefRefundEmailHtml(fullName, hasSubmittedPortfolio)` and `getAefRefundEmailPlainText(fullName, hasSubmittedPortfolio)`.
- Both return a string. `hasSubmittedPortfolio` is a Boolean.

- [ ] **Step 1: Write the failing template tests**

```js
test("refund email only promises a certificate for a submitted portfolio", () => {
  const standard = context.getAefRefundEmailPlainText("Ada Lovelace", false);
  const submitted = context.getAefRefundEmailPlainText("Ada Lovelace", true);
  assert.match(standard, /deposit has been refunded/i);
  assert.doesNotMatch(standard, /certificate/i);
  assert.match(submitted, /certificate will be sent by the weekend/i);
});
```

- [ ] **Step 2: Run the focused test and verify it fails because the functions do not exist**

Run: `node --test tests/refund-email.test.js`

Expected: FAIL because `getAefRefundEmailPlainText` is undefined.

- [ ] **Step 3: Implement the two templates**

```js
function getAefRefundEmailPlainText(fullName, hasSubmittedPortfolio) {
  const firstName = getAefRefundFirstName_(fullName);
  const certificate = hasSubmittedPortfolio
    ? "\n\nYou submitted your portfolio. Your certificate will be sent by the weekend."
    : "";
  return "Hello " + firstName + ",\n\nYour fellowship commitment deposit has been refunded " +
    "using the account details you submitted." + certificate +
    "\n\nWarm regards,\nBehind the Data Academy";
}
```

Build the HTML version with the same meaning, escaped participant names, the existing Behind the Data Academy logo, and a clean navy/white card layout.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `node --test tests/refund-email.test.js`

Expected: PASS.

---

### Task 2: Sheet setup and recipient selection

**Files:**
- Modify: `projects/AEF_Cohort_1_Refund/src/Code.js`
- Modify: `projects/AEF_Cohort_1_Refund/tests/refund-email.test.js`

**Interfaces:**
- Consumes: the two template functions from Task 1.
- Produces: `setupAefRefundEmailAutomation()`, `getAefRefundSheet_()`, `getAefRefundColumns_(headers)`, `getPendingAefRefundRows_()`, and `onOpen()`.

- [ ] **Step 1: Write failing tests for safe sheet discovery and setup**

```js
test("setup adds dropdown and tracking columns without moving existing data", () => {
  context.setupAefRefundEmailAutomation();
  assert.deepEqual(values[0].slice(0, 10), [
    "Email", "Name", "Account Number", "Bank", "Account Name", "Refund",
    "Portfolio Status", "Refund Email Status", "Refund Email Error", "Refund Email Sent At"
  ]);
  assert.equal(values[1][0], "ada@example.com");
});
```

Add a second test proving only populated rows whose status is not `Sent` or `Sending` are returned.

- [ ] **Step 2: Run tests and verify the missing setup function causes failure**

Run: `node --test tests/refund-email.test.js`

Expected: FAIL because `setupAefRefundEmailAutomation` is undefined.

- [ ] **Step 3: Implement setup and heading-based lookup**

```js
var AEF_REFUND_CONFIG = {
  requiredHeaders: ["Email", "Name", "Account Number", "Bank", "Account Name", "Refund", "Portfolio Status"],
  statusHeader: "Refund Email Status",
  errorHeader: "Refund Email Error",
  sentAtHeader: "Refund Email Sent At"
};
```

Scan spreadsheet tabs for all required headings, append missing tracking headings, add the Yes/No dropdown to the Refund column, and add the menu actions from the spec. Do not install triggers.

- [ ] **Step 4: Run tests and verify setup and selection tests pass**

Run: `node --test tests/refund-email.test.js`

Expected: PASS.

---

### Task 3: Safe live sending and test controls

**Files:**
- Modify: `projects/AEF_Cohort_1_Refund/src/Code.js`
- Modify: `projects/AEF_Cohort_1_Refund/tests/refund-email.test.js`

**Interfaces:**
- Produces: `setAefRefundTestEmailRecipient()`, `previewAefRefundEmail()`, `sendAefRefundTestEmail()`, `countAefRefundEmailsWaiting()`, `sendAefRefundEmailsLive()`, and `processAefRefundRow_(sheet, rowNumber)`.

- [ ] **Step 1: Write failing tests for live cancellation, tailored sending, duplicate prevention, and invalid addresses**

```js
test("live cancellation changes no refund values and sends nothing", () => {
  context.sendAefRefundEmailsLive();
  assert.equal(values[1][5], "");
  assert.equal(sent.length, 0);
});

test("confirmed live batch marks everyone refunded and tailors the certificate sentence", () => {
  context.sendAefRefundEmailsLive();
  assert.equal(values[1][5], "Yes");
  assert.doesNotMatch(sent[0].plainText, /certificate/i);
  assert.match(sent[1].plainText, /certificate will be sent by the weekend/i);
});
```

Add focused cases for `Sent`, `Sending`, malformed email, and Gmail failure.

- [ ] **Step 2: Run tests and verify they fail because live functions are missing**

Run: `node --test tests/refund-email.test.js`

Expected: FAIL on the missing live function.

- [ ] **Step 3: Implement guarded sending**

```js
function sendAefRefundEmailsLive() {
  const sheet = setupAefRefundEmailAutomation();
  const pending = getPendingAefRefundRows_(sheet);
  const answer = SpreadsheetApp.getUi().alert(
    "Send refund emails?",
    "This will mark " + pending.length + " participant(s) as refunded and send their emails. Continue?",
    SpreadsheetApp.getUi().ButtonSet.YES_NO
  );
  if (answer !== SpreadsheetApp.getUi().Button.YES) return toastAefRefund_("Live sending was cancelled.");
  return withAefRefundLock_(function () {
    return pending.map(function (rowNumber) {
      return processAefRefundRow_(sheet, rowNumber);
    });
  });
}
```

Inside `processAefRefundRow_`, write `Yes` and `Sending` before Gmail is called. On success write `Sent`, clear the error, and store a Date. On failure write `Error` and the plain error message. Missing or malformed email addresses must never call Gmail.

- [ ] **Step 4: Run the entire suite and verify it passes**

Run: `node --test tests/refund-email.test.js`

Expected: all tests PASS with zero failures.

---

### Task 4: Instructions, review, and publication

**Files:**
- Create: `projects/AEF_Cohort_1_Refund/README.md`
- Modify: `projects/AEF_Cohort_1_Refund/src/appsscript.json` only if the pulled manifest lacks the required V8 runtime or Africa/Lagos time zone.

**Interfaces:**
- Documents the administrator's safe setup, preview, test, count, and live-send order.

- [ ] **Step 1: Write the practical README**

Document this exact order:

```text
Refresh the spreadsheet.
AEF Cohort 1 Refund > Setup Refund Email Automation.
Set Test Email Recipient.
Preview Refund Email.
Send Test Refund Email.
Count Refund Emails Waiting.
LIVE: Mark All Refunded and Send Emails only when ready.
```

- [ ] **Step 2: Run final local verification**

Run:

```powershell
node --test tests\refund-email.test.js
node --check src\Code.js
node --check src\RefundEmailTemplate.js
git diff --check
```

Expected: all tests pass, both files parse, and the diff has no whitespace errors.

- [ ] **Step 3: Request code review and fix all Critical or Important findings**

Review the complete working-tree diff against the approved spec, including spreadsheet migration safety, duplicate prevention, conditional certificate wording, and absence of automatic triggers.

- [ ] **Step 4: Publish without sending live email**

Run: `clasp.cmd push`

Expected: Apps Script reports that all project files were pushed. Do not call `sendAefRefundEmailsLive` from the command line.

- [ ] **Step 5: Save the implementation in Git**

```powershell
git add projects/AEF_Cohort_1_Refund docs/superpowers/plans/2026-09-04-aef-cohort1-refund-email.md
git commit -m "Add Cohort 1 refund email automation"
git push origin main
```
