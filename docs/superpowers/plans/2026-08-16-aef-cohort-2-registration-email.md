# Analytics Engineering Fellowship Cohort 2 Registration Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build, test, document, deploy, and publish an Apps Script automation that sends one immediate application-review acknowledgement per unique Cohort 2 applicant email.

**Architecture:** Add `projects/AEF_Cohort_2_Registration` as an isolated clasp project. Keep email rendering in `EmailTemplate.js`, spreadsheet/trigger orchestration in `Code.js`, and Node-based unit tests outside `src` so clasp never uploads tests.

**Tech Stack:** Google Apps Script V8, GmailApp, SpreadsheetApp, ScriptApp, LockService, Node.js built-in test runner, clasp, PowerShell, Git.

## Global Constraints

- Use Apps Script ID `1sQPRvPdhyaKp9CFCcw1MiRoHNnHur34uMQDWEqSuF61hBI2RLHkDhDxl` and `rootDir: src`.
- Target spreadsheet ID `1BIA59dL4-hx8Io7JbVB0nXshOwG0I_8i8KK0GORdm30`, tab `Form responses 1`, and tab ID `2083070818`.
- Use `Email address` as the primary email, `Email Address` as fallback, and `Full Name` for personalization.
- Send no more than one acknowledgement per normalized email address.
- Do not include bank details or ask applicants to pay before acceptance.
- State that selected applicants must pay ₦30,100 within 24 hours: ₦30,000 refundable after successful completion and ₦100 processing fee.
- Use the Apps Script V8 runtime and `Africa/Lagos` time zone.
- Do not add acceptance, rejection, payment-confirmation, onboarding, or reminder workflows in this implementation.

---

### Task 1: Scaffold the project and build the email template test-first

**Files:**
- Create: `projects/AEF_Cohort_2_Registration/.clasp.json`
- Create: `projects/AEF_Cohort_2_Registration/src/appsscript.json`
- Create: `projects/AEF_Cohort_2_Registration/src/EmailTemplate.js`
- Create: `projects/AEF_Cohort_2_Registration/tests/registration.test.js`

**Interfaces:**
- Produces: `getAefCohort2RegistrationEmailHtml(fullName)`, `getAefCohort2RegistrationEmailPlainText(fullName)`, `getAefCohort2FirstName_(fullName)`, and `escapeAefCohort2Html_(value)`.

- [ ] **Step 1: Write the failing template tests**

Create a Node test that loads Apps Script files into a VM context:

```javascript
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function loadScripts(fileNames) {
  const context = vm.createContext({ console });
  fileNames.forEach((fileName) => {
    const source = fs.readFileSync(path.join(projectRoot, "src", fileName), "utf8");
    vm.runInContext(source, context, { filename: fileName });
  });
  return context;
}

test("registration email confirms review and defers payment until acceptance", () => {
  const context = loadScripts(["EmailTemplate.js"]);
  const html = context.getAefCohort2RegistrationEmailHtml("Ada Lovelace");
  const text = context.getAefCohort2RegistrationEmailPlainText("Ada Lovelace");

  for (const body of [html, text]) {
    assert.match(body, /Ada/);
    assert.match(body, /under review/i);
    assert.match(body, /₦30,100/);
    assert.match(body, /₦30,000/);
    assert.match(body, /₦100/);
    assert.match(body, /do not make payment/i);
    assert.match(body, /acceptance email/i);
  }
});
```

- [ ] **Step 2: Run the template test and confirm it fails**

Run:

```powershell
node --test projects\AEF_Cohort_2_Registration\tests\registration.test.js
```

Expected: failure because `src/EmailTemplate.js` does not exist.

- [ ] **Step 3: Add clasp and manifest configuration**

Create `.clasp.json`:

```json
{"scriptId":"1sQPRvPdhyaKp9CFCcw1MiRoHNnHur34uMQDWEqSuF61hBI2RLHkDhDxl","rootDir":"src"}
```

Create `src/appsscript.json`:

```json
{
  "timeZone": "Africa/Lagos",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

- [ ] **Step 4: Implement the email template**

Create `EmailTemplate.js` with these complete message functions, then apply the repository's existing branded email-table styling without changing the text:

```javascript
function getAefCohort2RegistrationEmailHtml(fullName) {
  const firstName = escapeAefCohort2Html_(getAefCohort2FirstName_(fullName));
  return '<p>Hello ' + firstName + ',</p>' +
    '<p>We have received your application for the Analytics Engineering Fellowship Cohort 2. Your application is currently under review.</p>' +
    '<p>You will receive a separate email after the review process with our decision.</p>' +
    '<p>If selected, you will be required to pay a ₦30,100 commitment deposit within 24 hours of receiving your acceptance email. ₦30,000 is refundable after successful completion of the fellowship, while ₦100 is retained as a processing fee.</p>' +
    '<p><strong>Do not make payment until you receive an acceptance email from us.</strong></p>' +
    '<p>Warm regards,<br>Behind the Data Academy</p>';
}

function getAefCohort2RegistrationEmailPlainText(fullName) {
  const firstName = getAefCohort2FirstName_(fullName);
  return 'Hello ' + firstName + ',\n\n' +
    'We have received your application for the Analytics Engineering Fellowship Cohort 2. Your application is currently under review.\n\n' +
    'You will receive a separate email after the review process with our decision.\n\n' +
    'If selected, you will be required to pay a ₦30,100 commitment deposit within 24 hours of receiving your acceptance email. ₦30,000 is refundable after successful completion of the fellowship, while ₦100 is retained as a processing fee.\n\n' +
    'Do not make payment until you receive an acceptance email from us.\n\n' +
    'Warm regards,\nBehind the Data Academy';
}

function getAefCohort2FirstName_(fullName) {
  const cleanName = String(fullName || '').trim();
  return cleanName ? cleanName.split(/\s+/)[0] : 'Applicant';
}

function escapeAefCohort2Html_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

The visible message must confirm receipt, say the application is under review, explain that a separate decision email will follow, describe the conditional deposit breakdown, and say not to pay until an acceptance email arrives.

- [ ] **Step 5: Run the template test and syntax check**

Run:

```powershell
node --test projects\AEF_Cohort_2_Registration\tests\registration.test.js
node --check projects\AEF_Cohort_2_Registration\src\EmailTemplate.js
```

Expected: all tests pass and the syntax check exits successfully.

- [ ] **Step 6: Commit the project foundation**

Run:

```powershell
git add projects/AEF_Cohort_2_Registration/.clasp.json projects/AEF_Cohort_2_Registration/src/appsscript.json projects/AEF_Cohort_2_Registration/src/EmailTemplate.js projects/AEF_Cohort_2_Registration/tests/registration.test.js
git commit -m "Add AEF Cohort 2 registration email template"
```

### Task 2: Implement registration processing and duplicate protection test-first

**Files:**
- Modify: `projects/AEF_Cohort_2_Registration/tests/registration.test.js`
- Create: `projects/AEF_Cohort_2_Registration/src/Code.js`

**Interfaces:**
- Consumes: the template functions from Task 1.
- Produces: `onOpen()`, `setupRegistrationAutomation()`, `installRegistrationTrigger()`, `clearRegistrationTrigger()`, `handleRegistrationSubmit(e)`, `processExistingRegistrations()`, `previewPendingRegistrations()`, `setTestEmailRecipient()`, `saveTestEmailRecipient(email)`, and `sendRegistrationTestEmail()`.
- Produces testable helpers: `normalizeAefEmail_(value)`, `resolveAefRegistrationEmail_(row, columns)`, `determineAefRegistrationAction_(email, currentStatus, sentEmails)`, and `getAefRegistrationColumnIndexes_(headers)`.

- [ ] **Step 1: Add failing workflow tests**

Extend `registration.test.js`:

```javascript
test("email normalization and primary/fallback resolution are deterministic", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);
  const columns = { primaryEmailIndex: 1, fallbackEmailIndex: 4 };
  assert.equal(context.normalizeAefEmail_("  ADA@Example.COM "), "ada@example.com");
  assert.equal(context.resolveAefRegistrationEmail_(["", "primary@example.com", "", "", "fallback@example.com"], columns), "primary@example.com");
  assert.equal(context.resolveAefRegistrationEmail_(["", "", "", "", "fallback@example.com"], columns), "fallback@example.com");
});

test("registration actions prevent repeat sends", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);
  assert.equal(context.determineAefRegistrationAction_("", "", {}), "skip-no-email");
  assert.equal(context.determineAefRegistrationAction_("ada@example.com", "Sent", {}), "skip-sent");
  assert.equal(context.determineAefRegistrationAction_("ada@example.com", "", { "ada@example.com": true }), "skip-duplicate");
  assert.equal(context.determineAefRegistrationAction_("ada@example.com", "Failed", {}), "send");
});

test("header resolution distinguishes the two live email columns", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);
  const headers = ["Timestamp", "Email address", "Column 2", "Full Name", "Email Address"];
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.getAefRegistrationColumnIndexes_(headers))),
    { primaryEmailIndex: 1, fullNameIndex: 3, fallbackEmailIndex: 4 }
  );
});
```

- [ ] **Step 2: Run the workflow tests and confirm they fail**

Run:

```powershell
node --test projects\AEF_Cohort_2_Registration\tests\registration.test.js
```

Expected: failure because `src/Code.js` does not exist.

- [ ] **Step 3: Implement configuration, menu, trigger controls, and test-recipient controls**

Define `AEF_COHORT_2_CONFIG` with the approved spreadsheet ID, sheet name and ID, header labels, tracking labels, sender name, subject, handler name, and Script Property key. Implement an `AEF Cohort 2 Registration` menu exposing every control from the specification. Trigger installation must inspect existing project triggers and create at most one spreadsheet form-submit trigger for `handleRegistrationSubmit`.

- [ ] **Step 4: Implement header and tracking-column management**

Implement case-insensitive exact header lookup. `ensureAefRegistrationTrackingColumns_(sheet)` must append missing status, error, and sent-at headers, style only those new headers, and return zero-based indexes without moving or rewriting form-response columns.

- [ ] **Step 5: Implement processing and deduplication**

Implement a lock-protected form-submit handler and catch-up loop. Before processing rows, build a set from rows whose tracking status is `Sent`. For each row, call `determineAefRegistrationAction_`; record `Skipped - No Email` or `Skipped - Duplicate` as applicable. On success, write `Sent`, clear the error, write `new Date()`, and add the normalized email to the in-memory sent set. On failure, write `Failed`, a 500-character error, and a blank sent time.

- [ ] **Step 6: Implement preview and test sending**

`previewPendingRegistrations()` must count rows that would send without changing cells. `sendRegistrationTestEmail()` must send `[TEST] Application Received – Analytics Engineering Fellowship Cohort 2` to the validated Script Property recipient and must not modify applicant rows.

- [ ] **Step 7: Run unit tests and syntax checks**

Run:

```powershell
node --test projects\AEF_Cohort_2_Registration\tests\registration.test.js
node --check projects\AEF_Cohort_2_Registration\src\Code.js
node --check projects\AEF_Cohort_2_Registration\src\EmailTemplate.js
```

Expected: all tests pass and both syntax checks succeed.

- [ ] **Step 8: Commit the workflow**

Run:

```powershell
git add projects/AEF_Cohort_2_Registration/src/Code.js projects/AEF_Cohort_2_Registration/tests/registration.test.js
git commit -m "Add AEF Cohort 2 registration automation"
```

### Task 3: Document and register the new project

**Files:**
- Create: `projects/AEF_Cohort_2_Registration/README.md`
- Modify: `README.md`
- Modify: `projects/README.md`

**Interfaces:**
- Consumes: the completed project name, menu functions, Script ID, and spreadsheet contract.
- Produces: project setup instructions and the named clasp command.

- [ ] **Step 1: Write the project README**

Document the project purpose, Script ID, spreadsheet URL, live headers, three tracking columns, duplicate behavior, menu actions, setup sequence, test sequence, and this push command:

```powershell
.\scripts\clasp-project.ps1 -Project AEF_Cohort_2_Registration -Action push
```

- [ ] **Step 2: Update repository indexes**

Add `AEF_Cohort_2_Registration` to the root structure/current-project/command lists and to `projects/README.md` without changing other project entries.

- [ ] **Step 3: Verify documentation references**

Run:

```powershell
rg -n "AEF_Cohort_2_Registration|1sQPRvPdhyaKp9CFCcw1MiRoHNnHur34uMQDWEqSuF61hBI2RLHkDhDxl" README.md projects\README.md projects\AEF_Cohort_2_Registration\README.md
```

Expected: the folder name is consistent and the Script ID appears only in the project-specific README and `.clasp.json`.

- [ ] **Step 4: Commit documentation**

Run:

```powershell
git add README.md projects/README.md projects/AEF_Cohort_2_Registration/README.md
git commit -m "Document AEF Cohort 2 registration automation"
```

### Task 4: Verify, deploy, and publish

**Files:**
- Verify: `projects/AEF_Cohort_2_Registration/**`
- Verify: repository documentation and commits created by Tasks 1–3

**Interfaces:**
- Consumes: the completed and documented Apps Script project.
- Produces: tested source on the supplied Apps Script ID and synchronized `origin/main`.

- [ ] **Step 1: Run the complete local verification suite**

Run:

```powershell
node --test projects\AEF_Cohort_2_Registration\tests\registration.test.js
node --check projects\AEF_Cohort_2_Registration\src\Code.js
node --check projects\AEF_Cohort_2_Registration\src\EmailTemplate.js
Get-Content -Raw projects\AEF_Cohort_2_Registration\.clasp.json | ConvertFrom-Json | Select-Object scriptId,rootDir
Get-Content -Raw projects\AEF_Cohort_2_Registration\src\appsscript.json | ConvertFrom-Json | Select-Object timeZone,runtimeVersion
git diff --check
git status --short
```

Expected: all tests and syntax checks pass; configuration reports the approved values; no whitespace errors or unrelated working-tree changes exist.

- [ ] **Step 2: Confirm the clasp target without deploying**

Run with a process-scoped PowerShell execution-policy bypass if required:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\clasp-project.ps1 -Project AEF_Cohort_2_Registration -Action status
```

Expected: the helper resolves `projects/AEF_Cohort_2_Registration` and reports the intended source files.

- [ ] **Step 3: Push code to the supplied Apps Script ID**

Run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\clasp-project.ps1 -Project AEF_Cohort_2_Registration -Action push
```

Expected: clasp reports that `Code.js`, `EmailTemplate.js`, and `appsscript.json` were pushed to Script ID `1sQPRvPdhyaKp9CFCcw1MiRoHNnHur34uMQDWEqSuF61hBI2RLHkDhDxl`.

- [ ] **Step 4: Push Git commits and verify synchronization**

Run:

```powershell
git push origin main
git status -sb
git rev-parse HEAD
git rev-parse origin/main
```

Expected: `main` is synchronized with `origin/main`, and local/remote hashes match.

- [ ] **Step 5: Hand off the authorization-required live setup**

In the spreadsheet, the owner must reload the file, choose `AEF Cohort 2 Registration` → `Setup Registration Automation`, authorize the requested Google permissions, configure the test recipient, and send the test email. Then use a controlled form submission to verify `Sent` and a repeated normalized email to verify `Skipped - Duplicate`.
