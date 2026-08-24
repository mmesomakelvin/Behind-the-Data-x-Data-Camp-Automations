const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function loadScripts(fileNames, globals = {}) {
  const context = vm.createContext({ console, ...globals });

  fileNames.forEach((fileName) => {
    const filePath = path.join(projectRoot, "src", fileName);
    if (!fs.existsSync(filePath)) {
      return;
    }

    const source = fs.readFileSync(filePath, "utf8");
    vm.runInContext(source, context, { filename: fileName });
  });

  return context;
}

test("registration email confirms review and defers payment until acceptance", () => {
  const context = loadScripts(["EmailTemplate.js"]);

  assert.equal(typeof context.getAefCohort2RegistrationEmailHtml, "function");
  assert.equal(typeof context.getAefCohort2RegistrationEmailPlainText, "function");

  const html = context.getAefCohort2RegistrationEmailHtml("Ada Lovelace");
  const text = context.getAefCohort2RegistrationEmailPlainText("Ada Lovelace");

  for (const body of [html, text]) {
    assert.match(body, /Ada/);
    assert.match(body, /under review/i);
    assert.match(body, /separate email/i);
    assert.match(body, /₦30,100/);
    assert.match(body, /₦30,000/);
    assert.match(body, /₦100/);
    assert.match(body, /within 72 hours/i);
    assert.doesNotMatch(body, /within 24 hours/i);
    assert.match(body, /do not make payment/i);
    assert.match(body, /acceptance email/i);
  }
});

test("registration email safely personalizes the applicant name", () => {
  const context = loadScripts(["EmailTemplate.js"]);

  assert.equal(typeof context.getAefCohort2RegistrationEmailHtml, "function");
  assert.match(
    context.getAefCohort2RegistrationEmailHtml("<Ada> Lovelace"),
    /Hello &lt;Ada&gt;/
  );
  assert.match(
    context.getAefCohort2RegistrationEmailPlainText(""),
    /Hello Applicant/
  );
});

test("email normalization and primary fallback resolution are deterministic", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);

  assert.equal(typeof context.normalizeAefEmail_, "function");
  assert.equal(typeof context.resolveAefRegistrationEmail_, "function");

  const columns = { primaryEmailIndex: 1, fallbackEmailIndex: 4 };
  assert.equal(context.normalizeAefEmail_("  ADA@Example.COM "), "ada@example.com");
  assert.equal(
    context.resolveAefRegistrationEmail_(["", "primary@example.com", "", "", "fallback@example.com"], columns),
    "primary@example.com"
  );
  assert.equal(
    context.resolveAefRegistrationEmail_(["", "", "", "", "Fallback@Example.com"], columns),
    "fallback@example.com"
  );
});

test("registration actions prevent repeat sends and allow failed retries", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);

  assert.equal(typeof context.determineAefRegistrationAction_, "function");
  assert.equal(context.determineAefRegistrationAction_("", "", {}), "skip-no-email");
  assert.equal(context.determineAefRegistrationAction_("", "Sent", {}), "skip-sent");
  assert.equal(context.determineAefRegistrationAction_("ada@example.com", "Sent", {}), "skip-sent");
  assert.equal(
    context.determineAefRegistrationAction_("ada@example.com", "Sending", {}),
    "skip-reconciliation"
  );
  assert.equal(
    context.determineAefRegistrationAction_("ada@example.com", "", { "ada@example.com": true }),
    "skip-duplicate"
  );
  assert.equal(context.determineAefRegistrationAction_("ada@example.com", "Failed", {}), "send");
  assert.equal(context.determineAefRegistrationAction_("ada@example.com", "", {}), "send");
});

test("header resolution distinguishes the two live email columns", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);

  assert.equal(typeof context.getAefRegistrationColumnIndexes_, "function");

  const headers = ["Timestamp", "Email address", "Column 2", "Full Name", "Email Address"];
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.getAefRegistrationColumnIndexes_(headers))),
    { primaryEmailIndex: 1, fullNameIndex: 3, fallbackEmailIndex: 4 }
  );
});

test("test sends require an explicitly configured recipient", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    PropertiesService: {
      getScriptProperties() {
        return { getProperty: () => "" };
      }
    },
    Session: {
      getActiveUser() {
        return { getEmail: () => "active-user@example.com" };
      }
    }
  });

  assert.throws(
    () => context.getAefTestEmailRecipient_(),
    /set a test email recipient/i
  );
});

test("trigger matching requires the correct handler, event, source, and spreadsheet", () => {
  const ScriptApp = {
    EventType: { ON_FORM_SUBMIT: "ON_FORM_SUBMIT" },
    TriggerSource: { SPREADSHEETS: "SPREADSHEETS" }
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js"], { ScriptApp });
  const trigger = (overrides = {}) => ({
    getHandlerFunction: () => "handleRegistrationSubmit",
    getEventType: () => ScriptApp.EventType.ON_FORM_SUBMIT,
    getTriggerSource: () => ScriptApp.TriggerSource.SPREADSHEETS,
    getTriggerSourceId: () => "1BIA59dL4-hx8Io7JbVB0nXshOwG0I_8i8KK0GORdm30",
    ...overrides
  });

  assert.equal(context.isMatchingAefRegistrationTrigger_(trigger()), true);
  assert.equal(
    context.isMatchingAefRegistrationTrigger_(trigger({ getEventType: () => "ON_EDIT" })),
    false
  );
  assert.equal(
    context.isMatchingAefRegistrationTrigger_(trigger({ getTriggerSourceId: () => "wrong-sheet" })),
    false
  );
});

test("a successful email is never marked retryable when final tracking fails", () => {
  let sendCount = 0;
  const callOrder = [];
  const row = ["timestamp", "ada@example.com", "", "Ada Lovelace", "", "", "", ""];
  const sheet = {
    getLastRow: () => 2,
    getLastColumn: () => row.length,
    getRange(rowNumber, columnNumber, rowCount, columnCount) {
      if (rowCount === 1 && columnCount === row.length) {
        return { getValues: () => [row.slice()] };
      }

      return {
        setValue(value) {
          if (value === "Sent") throw new Error("tracking write failed");
          row[columnNumber - 1] = value;
          return this;
        }
      };
    }
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    SpreadsheetApp: { flush: () => { callOrder.push("flush"); } },
    GmailApp: { sendEmail: () => { sendCount++; callOrder.push("gmail"); } },
    Logger: { log: () => {} }
  });

  const result = context.processAefRegistrationRow_(
    sheet,
    2,
    { primaryEmailIndex: 1, fallbackEmailIndex: 4, fullNameIndex: 3 },
    { statusIndex: 5, errorIndex: 6, sentAtIndex: 7 },
    {}
  );

  assert.equal(sendCount, 1);
  assert.deepEqual(callOrder, ["flush", "gmail"]);
  assert.equal(result.status, "tracking-failed");
  assert.equal(row[5], "Sending");
  assert.match(row[6], /email sent; final tracking failed/i);
});

test("a reservation flush failure prevents Gmail from being called", () => {
  let sendCount = 0;
  const row = ["timestamp", "ada@example.com", "", "Ada Lovelace", "", "", "", ""];
  const sheet = {
    getLastRow: () => 2,
    getLastColumn: () => row.length,
    getRange(rowNumber, columnNumber, rowCount, columnCount) {
      if (rowCount === 1 && columnCount === row.length) {
        return { getValues: () => [row.slice()] };
      }
      return {
        setValue(value) {
          row[columnNumber - 1] = value;
          return this;
        }
      };
    }
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    SpreadsheetApp: { flush: () => { throw new Error("flush failed"); } },
    GmailApp: { sendEmail: () => { sendCount++; } },
    Logger: { log: () => {} }
  });

  const result = context.processAefRegistrationRow_(
    sheet,
    2,
    { primaryEmailIndex: 1, fallbackEmailIndex: 4, fullNameIndex: 3 },
    { statusIndex: 5, errorIndex: 6, sentAtIndex: 7 },
    {}
  );

  assert.equal(sendCount, 0);
  assert.equal(result.status, "tracking-failed");
  assert.equal(row[5], "Sending");
});

test("a Gmail failure is recorded as Failed and remains retryable", () => {
  const row = ["timestamp", "ada@example.com", "", "Ada Lovelace", "", "", "", ""];
  const sheet = {
    getLastRow: () => 2,
    getLastColumn: () => row.length,
    getRange(rowNumber, columnNumber, rowCount, columnCount) {
      if (rowCount === 1 && columnCount === row.length) {
        return { getValues: () => [row.slice()] };
      }
      return {
        setValue(value) {
          row[columnNumber - 1] = value;
          return this;
        }
      };
    }
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    SpreadsheetApp: { flush: () => {} },
    GmailApp: { sendEmail: () => { throw new Error("mail unavailable"); } },
    Logger: { log: () => {} }
  });

  const result = context.processAefRegistrationRow_(
    sheet,
    2,
    { primaryEmailIndex: 1, fallbackEmailIndex: 4, fullNameIndex: 3 },
    { statusIndex: 5, errorIndex: 6, sentAtIndex: 7 },
    {}
  );

  assert.equal(result.status, "failed");
  assert.equal(row[5], "Failed");
  assert.match(row[6], /mail unavailable/);
  assert.equal(context.determineAefRegistrationAction_("ada@example.com", row[5], {}), "send");
});

test("a Sending reservation blocks duplicate rows for the same email", () => {
  const row = ["timestamp", "ada@example.com", "", "Ada Lovelace", "", "Sending", "", ""];
  const sheet = {
    getLastRow: () => 2,
    getLastColumn: () => row.length,
    getRange: () => ({ getValues: () => [row.slice()] })
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);
  const sentEmails = context.getAefSentEmailSet_(
    sheet,
    { primaryEmailIndex: 1, fallbackEmailIndex: 4, fullNameIndex: 3 },
    { statusIndex: 5, errorIndex: 6, sentAtIndex: 7 }
  );

  assert.equal(sentEmails["ada@example.com"], true);
  assert.equal(
    context.determineAefRegistrationAction_("ada@example.com", "", sentEmails),
    "skip-duplicate"
  );
});

test("preview is read-only after setup has created tracking columns", () => {
  let writeCount = 0;
  const headers = [
    "Timestamp",
    "Email address",
    "Column 2",
    "Full Name",
    "Email Address",
    "Registration Email Status",
    "Registration Email Error",
    "Registration Email Sent At"
  ];
  const row = ["timestamp", "ada@example.com", "", "Ada Lovelace", "", "", "", ""];
  let spreadsheet;
  const sheet = {
    getName: () => "Form responses 1",
    getSheetId: () => 2083070818,
    getParent: () => spreadsheet,
    getLastRow: () => 2,
    getLastColumn: () => headers.length,
    getRange(rowNumber) {
      return {
        getValues: () => [rowNumber === 1 ? headers.slice() : row.slice()],
        setValue: () => { writeCount++; }
      };
    }
  };
  spreadsheet = {
    getId: () => "1BIA59dL4-hx8Io7JbVB0nXshOwG0I_8i8KK0GORdm30",
    getSheetByName: () => sheet
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => spreadsheet,
      openById: () => spreadsheet,
      getActive: () => ({ toast: () => {} })
    },
    LockService: {
      getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} })
    },
    Logger: { log: () => {} }
  });

  assert.match(context.previewPendingRegistrations(), /Pending: 1/);
  assert.equal(writeCount, 0);
});
