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
    if (!fs.existsSync(filePath)) return;
    vm.runInContext(fs.readFileSync(filePath, "utf8"), context, { filename: fileName });
  });
  return context;
}

const headers = [
  "Timestamp",
  "Email address",
  "Full Name",
  "LinkedIn Url",
  "Upload Headshot",
  "Payment Evidence",
  "Upload the signed compliance document.",
  "Bank Name (For processing refund)",
  "Account Name",
  "Account Number",
  "Please confirm the following",
  "Payment Confirmed",
  "Payment Confirmation Email Status",
  "Payment Confirmation Email Error",
  "Payment Confirmation Email Sent At"
];

test("payment confirmation email is written for AEF Cohort 2", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);

  const html = context.getAefPaymentConfirmationEmailHtml("Ada Lovelace");
  const text = context.getAefPaymentConfirmationEmailPlainText("Ada Lovelace");

  for (const body of [html, text]) {
    assert.match(body, /Hello Ada/i);
    assert.match(body, /Analytics Engineering Fellowship Cohort 2/i);
    assert.match(body, /payment (has been )?confirmed/i);
    assert.match(body, /place.*secured/i);
    assert.match(body, /refundable commitment deposit/i);
    assert.doesNotMatch(body, /Applied AI Development Bootcamp/i);
  }
  assert.equal(
    context.AEF_PAYMENT_CONFIG.subject,
    "Payment Confirmed - Analytics Engineering Fellowship Cohort 2"
  );
});

test("changing Payment Confirmed to Yes emails only the edited applicant", () => {
  const values = [headers.slice(), [
    "2026-08-28", "ada@example.com", "Ada Lovelace", "", "", "", "",
    "Bank", "Ada", "1234", "Confirmed", "Yes", "", "", ""
  ], [
    "2026-08-28", "grace@example.com", "Grace Hopper", "", "", "", "",
    "Bank", "Grace", "5678", "Confirmed", "Yes", "", "", ""
  ]];
  const sentTo = [];
  const sheet = makeEditableSheet(values);
  const spreadsheet = {
    getId: () => "10v2U9Sn6JpcPP3Zr1d_z46s7PIuuJQlgjj7VY2mb0Y4"
  };
  sheet.getName = () => "Form_Responses";
  sheet.getParent = () => spreadsheet;
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    SpreadsheetApp: { flush: () => {} },
    LockService: {
      getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} })
    },
    GmailApp: { sendEmail: (recipient) => sentTo.push(recipient) },
    Utilities: { sleep: () => {} },
    Logger: { log: () => {} }
  });

  context.handleAefPaymentConfirmedEdit({
    value: "Yes",
    range: {
      getSheet: () => sheet,
      getRow: () => 2,
      getColumn: () => 12,
      getNumRows: () => 1,
      getNumColumns: () => 1
    }
  });

  assert.deepEqual(sentTo, ["ada@example.com"]);
  assert.equal(values[1][12], "Sent");
  assert.equal(Object.prototype.toString.call(values[1][14]), "[object Date]");
  assert.equal(values[2][12], "");
});

test("a row already marked Sent is never emailed again", () => {
  const values = [headers.slice(), [
    "2026-08-28", "ada@example.com", "Ada Lovelace", "", "", "", "",
    "Bank", "Ada", "1234", "Confirmed", "Yes", "Sent", "", new Date()
  ]];
  const sentTo = [];
  const sheet = makeEditableSheet(values);
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    SpreadsheetApp: { flush: () => {} },
    GmailApp: { sendEmail: (recipient) => sentTo.push(recipient) },
    Utilities: { sleep: () => {} },
    Logger: { log: () => {} }
  });

  const result = context.processAefPaymentConfirmationRow_(
    sheet,
    2,
    context.getAefPaymentColumnIndexes_(headers)
  );

  assert.equal(result, "skipped");
  assert.deepEqual(sentTo, []);
});

test("an accepted payment without a valid email is clearly marked for review", () => {
  const values = [headers.slice(), [
    "2026-08-28", "not-an-email", "Ada Lovelace", "", "", "", "",
    "Bank", "Ada", "1234", "Confirmed", "Yes", "", "", ""
  ]];
  const sheet = makeEditableSheet(values);
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    SpreadsheetApp: { flush: () => {} },
    GmailApp: { sendEmail: () => { throw new Error("must not send"); } },
    Utilities: { sleep: () => {} },
    Logger: { log: () => {} }
  });

  const result = context.processAefPaymentConfirmationRow_(
    sheet,
    2,
    context.getAefPaymentColumnIndexes_(headers)
  );

  assert.equal(result, "skipped");
  assert.equal(values[1][12], "Skipped - No Email");
  assert.match(values[1][13], /no valid recipient email/i);
});

test("the row is reserved before Gmail is called", () => {
  const values = [headers.slice(), [
    "2026-08-28", "ada@example.com", "Ada Lovelace", "", "", "", "",
    "Bank", "Ada", "1234", "Confirmed", "Yes", "", "", ""
  ]];
  let gmailCalls = 0;
  const sheet = makeEditableSheet(values);
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    SpreadsheetApp: { flush: () => { throw new Error("flush failed"); } },
    GmailApp: { sendEmail: () => { gmailCalls++; } },
    Utilities: { sleep: () => {} },
    Logger: { log: () => {} }
  });

  const result = context.processAefPaymentConfirmationRow_(
    sheet,
    2,
    context.getAefPaymentColumnIndexes_(headers)
  );

  assert.equal(result, "failed");
  assert.equal(gmailCalls, 0);
});

test("a busy edit is safely queued and retried later", () => {
  const values = [headers.slice(), [
    "2026-08-28", "ada@example.com", "Ada Lovelace", "", "", "", "",
    "Bank", "Ada", "1234", "Confirmed", "Yes", "", "", ""
  ]];
  const queued = {};
  const sentTo = [];
  const sheet = makeEditableSheet(values);
  const spreadsheet = {
    getId: () => "10v2U9Sn6JpcPP3Zr1d_z46s7PIuuJQlgjj7VY2mb0Y4",
    getSheetByName: () => sheet
  };
  sheet.getName = () => "Form_Responses";
  sheet.getParent = () => spreadsheet;
  let lockAvailable = false;
  const scriptProperties = {
    setProperty(key, value) { queued[key] = value; },
    getProperties: () => ({ ...queued }),
    deleteProperty(key) { delete queued[key]; }
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => spreadsheet,
      flush: () => {}
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => lockAvailable,
        releaseLock: () => {}
      })
    },
    PropertiesService: {
      getScriptProperties: () => scriptProperties
    },
    GmailApp: { sendEmail: (recipient) => sentTo.push(recipient) },
    Utilities: { getUuid: () => "event-id", sleep: () => {} },
    Logger: { log: () => {} }
  });
  const event = {
    value: "Yes",
    range: {
      getSheet: () => sheet,
      getRow: () => 2,
      getColumn: () => 12,
      getNumRows: () => 1,
      getNumColumns: () => 1
    }
  };

  context.handleAefPaymentConfirmedEdit(event);

  assert.equal(sentTo.length, 0);
  assert.equal(values[1][12], "");
  assert.deepEqual(Object.keys(queued), ["AEF_PAYMENT_RETRY_event-id"]);

  lockAvailable = true;
  context.processQueuedAefPaymentConfirmations();

  assert.deepEqual(sentTo, ["ada@example.com"]);
  assert.equal(values[1][12], "Sent");
  assert.deepEqual(Object.keys(queued), []);
});

test("changing Payment Confirmed to No never sends an email", () => {
  const values = [headers.slice(), [
    "2026-08-28", "ada@example.com", "Ada Lovelace", "", "", "", "",
    "Bank", "Ada", "1234", "Confirmed", "Yes", "", "", ""
  ]];
  const sentTo = [];
  const sheet = makeEditableSheet(values);
  const spreadsheet = {
    getId: () => "10v2U9Sn6JpcPP3Zr1d_z46s7PIuuJQlgjj7VY2mb0Y4"
  };
  sheet.getName = () => "Form_Responses";
  sheet.getParent = () => spreadsheet;
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    SpreadsheetApp: { flush: () => {} },
    LockService: {
      getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} })
    },
    GmailApp: { sendEmail: (recipient) => sentTo.push(recipient) },
    Logger: { log: () => {} }
  });

  context.handleAefPaymentConfirmedEdit({
    value: "No",
    range: {
      getSheet: () => sheet,
      getRow: () => 2,
      getColumn: () => 12,
      getNumRows: () => 1,
      getNumColumns: () => 1
    }
  });

  assert.deepEqual(sentTo, []);
  assert.equal(values[1][12], "");
});

test("a Gmail failure is recorded and can be retried", () => {
  const values = [headers.slice(), [
    "2026-08-28", "ada@example.com", "Ada Lovelace", "", "", "", "",
    "Bank", "Ada", "1234", "Confirmed", "Yes", "", "", ""
  ]];
  const sheet = makeEditableSheet(values);
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    SpreadsheetApp: { flush: () => {} },
    GmailApp: { sendEmail: () => { throw new Error("mail unavailable"); } },
    Logger: { log: () => {} }
  });

  const result = context.processAefPaymentConfirmationRow_(
    sheet,
    2,
    context.getAefPaymentColumnIndexes_(headers)
  );

  assert.equal(result, "failed");
  assert.equal(values[1][12], "Failed");
  assert.match(values[1][13], /mail unavailable/i);
});

test("a sent email is left reserved when final tracking fails", () => {
  const values = [headers.slice(), [
    "2026-08-28", "ada@example.com", "Ada Lovelace", "", "", "", "",
    "Bank", "Ada", "1234", "Confirmed", "Yes", "", "", ""
  ]];
  let sent = 0;
  const sheet = makeEditableSheet(values);
  const originalGetRange = sheet.getRange.bind(sheet);
  sheet.getRange = function (rowNumber, columnNumber, rowCount, columnCount) {
    const range = originalGetRange(rowNumber, columnNumber, rowCount, columnCount);
    const originalSetValue = range.setValue.bind(range);
    range.setValue = function (value) {
      if (rowNumber === 2 && columnNumber === 13 && value === "Sent") {
        throw new Error("tracking unavailable");
      }
      return originalSetValue(value);
    };
    return range;
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    SpreadsheetApp: { flush: () => {} },
    GmailApp: { sendEmail: () => { sent++; } },
    Utilities: { sleep: () => {} },
    Logger: { log: () => {} }
  });

  const result = context.processAefPaymentConfirmationRow_(
    sheet,
    2,
    context.getAefPaymentColumnIndexes_(headers)
  );

  assert.equal(sent, 1);
  assert.equal(result, "review");
  assert.equal(values[1][12], "Sending");
  assert.match(values[1][13], /email sent; final tracking failed/i);
});

test("installing automation creates one edit trigger and one retry trigger", () => {
  const created = [];
  const spreadsheet = {
    getId: () => "10v2U9Sn6JpcPP3Zr1d_z46s7PIuuJQlgjj7VY2mb0Y4"
  };
  const ScriptApp = {
    EventType: { ON_EDIT: "ON_EDIT", CLOCK: "CLOCK" },
    TriggerSource: { SPREADSHEETS: "SPREADSHEETS" },
    getProjectTriggers: () => [],
    deleteTrigger: () => {},
    newTrigger(handler) {
      const pending = { handler, event: "" };
      return {
        forSpreadsheet() { return this; },
        onEdit() { pending.event = "ON_EDIT"; return this; },
        timeBased() { pending.event = "CLOCK"; return this; },
        everyMinutes(minutes) { pending.minutes = minutes; return this; },
        create() { created.push(pending); }
      };
    }
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    ScriptApp,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => spreadsheet,
      getActive: () => ({ toast: () => {} })
    },
    Logger: { log: () => {} }
  });

  context.installAefPaymentConfirmationTriggers_();

  assert.deepEqual(created, [
    { handler: "handleAefPaymentConfirmedEdit", event: "ON_EDIT" },
    {
      handler: "processQueuedAefPaymentConfirmations",
      event: "CLOCK",
      minutes: 5
    }
  ]);
});

test("clearing automation removes its triggers and waiting emails", () => {
  const removedTriggers = [];
  const removedProperties = [];
  const queuedKey = "AEF_PAYMENT_RETRY_waiting-event";
  const properties = { [queuedKey]: "queued", UNRELATED: "keep" };
  const triggers = [
    { getHandlerFunction: () => "handleAefPaymentConfirmedEdit" },
    { getHandlerFunction: () => "processQueuedAefPaymentConfirmations" },
    { getHandlerFunction: () => "unrelatedHandler" }
  ];
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    ScriptApp: {
      getProjectTriggers: () => triggers,
      deleteTrigger: (trigger) => removedTriggers.push(trigger.getHandlerFunction())
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperties: () => ({ ...properties }),
        deleteProperty(key) {
          removedProperties.push(key);
          delete properties[key];
        }
      })
    },
    SpreadsheetApp: { getActive: () => ({ toast: () => {} }) },
    Logger: { log: () => {} }
  });

  context.clearAefPaymentConfirmationTriggers_();

  assert.deepEqual(removedTriggers, [
    "handleAefPaymentConfirmedEdit",
    "processQueuedAefPaymentConfirmations"
  ]);
  assert.deepEqual(removedProperties, [queuedKey]);
  assert.equal(properties.UNRELATED, "keep");
});

test("test sends require an explicitly saved recipient", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: () => "" })
    }
  });

  assert.throws(
    () => context.getAefPaymentTestEmailRecipient_(),
    /set a test email recipient/i
  );
});

test("only the exact Form_Responses tab can trigger payment emails", () => {
  const values = [headers.slice(), [
    "2026-08-28T10:00:00", "ada@example.com", "Ada", "", "", "", "",
    "Bank", "Ada", "1234", "Confirmed", "Yes", "", "", ""
  ]];
  const sheet = makeEditableSheet(values);
  sheet.getName = () => "Form responses 1";
  sheet.getParent = () => ({
    getId: () => "10v2U9Sn6JpcPP3Zr1d_z46s7PIuuJQlgjj7VY2mb0Y4"
  });
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);

  assert.equal(context.isAefPaymentSourceSheet_(sheet), false);
});

test("shared emails still send and track only the exact edited response", () => {
  const values = [headers.slice(), [
    "2026-08-28T10:00:00", "shared@example.com", "Ada Lovelace", "", "", "", "",
    "Bank", "Ada", "1234", "Confirmed", "Yes", "", "", ""
  ], [
    "2026-08-28T10:05:00", "shared@example.com", "Grace Hopper", "", "", "", "",
    "Bank", "Grace", "5678", "Confirmed", "Yes", "", "", ""
  ]];
  const sentNames = [];
  const sheet = makeEditableSheet(values);
  const spreadsheet = {
    getId: () => "10v2U9Sn6JpcPP3Zr1d_z46s7PIuuJQlgjj7VY2mb0Y4"
  };
  sheet.getName = () => "Form_Responses";
  sheet.getParent = () => spreadsheet;
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    SpreadsheetApp: { flush: () => {} },
    LockService: {
      getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} })
    },
    GmailApp: { sendEmail: (email, subject, text) => sentNames.push(text) },
    Utilities: { sleep: () => {} },
    Logger: { log: () => {} }
  });

  context.handleAefPaymentConfirmedEdit({
    value: "Yes",
    range: {
      getSheet: () => sheet,
      getRow: () => 3,
      getColumn: () => 12,
      getNumRows: () => 1,
      getNumColumns: () => 1
    }
  });

  assert.equal(sentNames.length, 1);
  assert.match(sentNames[0], /Hello Grace/);
  assert.equal(values[1][12], "");
  assert.equal(values[2][12], "Sent");
});

test("a queued response still sends after its email and name are corrected", () => {
  const values = [headers.slice(), [
    "2026-08-28T10:00:00", "wrong@example.com", "Wrong Name", "", "", "", "",
    "Bank", "Ada", "1234", "Confirmed", "Yes", "", "", ""
  ]];
  const queued = {};
  const sentTo = [];
  const sheet = makeEditableSheet(values);
  const spreadsheet = {
    getId: () => "10v2U9Sn6JpcPP3Zr1d_z46s7PIuuJQlgjj7VY2mb0Y4",
    getSheetByName: () => sheet
  };
  sheet.getName = () => "Form_Responses";
  sheet.getParent = () => spreadsheet;
  let lockAvailable = false;
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => spreadsheet,
      flush: () => {}
    },
    LockService: {
      getScriptLock: () => ({ tryLock: () => lockAvailable, releaseLock: () => {} })
    },
    PropertiesService: {
      getScriptProperties: () => ({
        setProperty(key, value) { queued[key] = value; },
        getProperties: () => ({ ...queued }),
        deleteProperty(key) { delete queued[key]; }
      })
    },
    GmailApp: { sendEmail: (recipient) => sentTo.push(recipient) },
    Utilities: { getUuid: () => "event-id", sleep: () => {} },
    Logger: { log: () => {} }
  });
  const event = {
    value: "Yes",
    range: {
      getSheet: () => sheet,
      getRow: () => 2,
      getColumn: () => 12,
      getNumRows: () => 1,
      getNumColumns: () => 1
    }
  };

  context.handleAefPaymentConfirmedEdit(event);
  values[1][1] = "corrected@example.com";
  values[1][2] = "Corrected Name";
  lockAvailable = true;
  context.processQueuedAefPaymentConfirmations();

  assert.deepEqual(sentTo, ["corrected@example.com"]);
  assert.equal(values[1][12], "Sent");
  assert.deepEqual(Object.keys(queued), []);
});

test("installing automation replaces an existing retry trigger with a five-minute trigger", () => {
  const deleted = [];
  const created = [];
  const existingRetry = {
    getHandlerFunction: () => "processQueuedAefPaymentConfirmations",
    getEventType: () => "CLOCK"
  };
  const ScriptApp = {
    EventType: { ON_EDIT: "ON_EDIT", CLOCK: "CLOCK" },
    TriggerSource: { SPREADSHEETS: "SPREADSHEETS" },
    getProjectTriggers: () => [existingRetry],
    deleteTrigger: (trigger) => deleted.push(trigger),
    newTrigger(handler) {
      const pending = { handler, event: "" };
      return {
        timeBased() { pending.event = "CLOCK"; return this; },
        everyMinutes(minutes) { pending.minutes = minutes; return this; },
        create() { created.push(pending); }
      };
    }
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    ScriptApp,
    Logger: { log: () => {} }
  });

  context.ensureAefPaymentTrigger_(
    "processQueuedAefPaymentConfirmations",
    "CLOCK"
  );

  assert.deepEqual(deleted, [existingRetry]);
  assert.deepEqual(created, [{
    handler: "processQueuedAefPaymentConfirmations",
    event: "CLOCK",
    minutes: 5
  }]);
});

test("pending preview counts a shared email only once and excludes Sending rows", () => {
  const values = [headers.slice(), [
    "2026-08-28T10:00:00", "shared@example.com", "Ada", "", "", "", "",
    "Bank", "Ada", "1234", "Confirmed", "Yes", "", "", ""
  ], [
    "2026-08-28T10:05:00", "shared@example.com", "Grace", "", "", "", "",
    "Bank", "Grace", "5678", "Confirmed", "Yes", "", "", ""
  ], [
    "2026-08-28T10:10:00", "busy@example.com", "Busy", "", "", "", "",
    "Bank", "Busy", "9999", "Confirmed", "Yes", "Sending", "", ""
  ]];
  const sheet = makeEditableSheet(values);
  const spreadsheet = {
    getId: () => "10v2U9Sn6JpcPP3Zr1d_z46s7PIuuJQlgjj7VY2mb0Y4",
    getSheetByName: () => sheet
  };
  sheet.getName = () => "Form_Responses";
  sheet.getParent = () => spreadsheet;
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => spreadsheet,
      getActive: () => ({ toast: () => {} })
    },
    Logger: { log: () => {} }
  });

  const message = context.previewPendingAefPaymentRows();

  assert.match(message, /Pending confirmed rows: 1\b/);
});

test("manual catch-up requires confirmation before sending live emails", () => {
  const values = [headers.slice(), [
    "2026-08-28T10:00:00", "ada@example.com", "Ada", "", "", "", "",
    "Bank", "Ada", "1234", "Confirmed", "Yes", "", "", ""
  ]];
  const sentTo = [];
  const sheet = makeEditableSheet(values);
  const spreadsheet = {
    getId: () => "10v2U9Sn6JpcPP3Zr1d_z46s7PIuuJQlgjj7VY2mb0Y4",
    getSheetByName: () => sheet
  };
  sheet.getName = () => "Form_Responses";
  sheet.getParent = () => spreadsheet;
  const ui = {
    Button: { YES: "YES", NO: "NO" },
    ButtonSet: { YES_NO: "YES_NO" },
    alert: () => "NO"
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => spreadsheet,
      getActive: () => ({ toast: () => {} }),
      getUi: () => ui,
      flush: () => {}
    },
    LockService: {
      getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} })
    },
    GmailApp: { sendEmail: (recipient) => sentTo.push(recipient) },
    Utilities: { sleep: () => {} },
    Logger: { log: () => {} }
  });

  context.sendPendingAefPaymentConfirmations();

  assert.deepEqual(sentTo, []);
  assert.equal(values[1][12], "");
});

function makeEditableSheet(values) {
  return {
    getLastRow: () => values.length,
    getLastColumn: () => values[0].length,
    getMaxRows: () => Math.max(values.length, 100),
    getRange(rowNumber, columnNumber, rowCount, columnCount) {
      const startRow = rowNumber - 1;
      const startColumn = columnNumber - 1;
      const height = rowCount || 1;
      const width = columnCount || 1;
      return {
        getValues: () => values
          .slice(startRow, startRow + height)
          .map((row) => row.slice(startColumn, startColumn + width)),
        setValue(value) {
          values[startRow][startColumn] = value;
          return this;
        },
        setBackground() { return this; },
        setDataValidation() { return this; },
        setFontWeight() { return this; },
        copyFormatToRange() { return this; }
      };
    },
    setColumnWidth: () => {}
  };
}
