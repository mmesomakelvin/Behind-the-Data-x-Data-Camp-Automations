const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function loadProject(globals = {}) {
  const context = vm.createContext({ console, ...globals });
  ["RefundEmailTemplate.js", "Code.js"].forEach((fileName) => {
    const filePath = path.join(projectRoot, "src", fileName);
    if (!fs.existsSync(filePath)) return;
    vm.runInContext(fs.readFileSync(filePath, "utf8"), context, { filename: fileName });
  });
  return context;
}

const baseHeaders = [
  "Email", "Name", "Account Number", "Bank", "Account Name", "Refund", "Portfolio Status"
];

function makeSheet(name, values) {
  function makeRange(row, column, numRows = 1, numColumns = 1) {
    return {
      getValues() {
        return Array.from({ length: numRows }, (_, rowOffset) =>
          Array.from({ length: numColumns }, (_, columnOffset) =>
            (values[row - 1 + rowOffset] || [])[column - 1 + columnOffset] ?? ""
          )
        );
      },
      getValue() {
        return (values[row - 1] || [])[column - 1] ?? "";
      },
      setValues(newValues) {
        newValues.forEach((newRow, rowOffset) => {
          if (!values[row - 1 + rowOffset]) values[row - 1 + rowOffset] = [];
          newRow.forEach((value, columnOffset) => {
            values[row - 1 + rowOffset][column - 1 + columnOffset] = value;
          });
        });
        return this;
      },
      setValue(value) {
        if (!values[row - 1]) values[row - 1] = [];
        values[row - 1][column - 1] = value;
        return this;
      },
      setDataValidation(rule) {
        sheet.validation = { row, column, numRows, numColumns, rule };
        return this;
      },
      setFontWeight() { return this; },
      setBackground() { return this; },
      setFontColor() { return this; },
      setWrap() { return this; }
    };
  }

  const sheet = {
    values,
    validation: null,
    getName: () => name,
    getLastRow: () => values.length,
    getLastColumn: () => Math.max(0, ...values.map((row) => row.length)),
    getMaxRows: () => 100,
    getRange: makeRange,
    setFrozenRows() {}
  };
  return sheet;
}

function makeSpreadsheet(sheet) {
  return {
    getSheets: () => [sheet],
    getActiveSheet: () => sheet,
    toast() {}
  };
}

function makeSpreadsheetApp(spreadsheet, ui = {}) {
  return {
    getActiveSpreadsheet: () => spreadsheet,
    getUi: () => ui,
    newDataValidation: () => ({
      requireValueInList(values, showDropdown) {
        this.values = values;
        this.showDropdown = showDropdown;
        return this;
      },
      setAllowInvalid(value) {
        this.allowInvalid = value;
        return this;
      },
      build() { return this; }
    })
  };
}

function makeUi(answer = "YES") {
  return {
    Button: { YES: "YES", NO: "NO", OK: "OK", CANCEL: "CANCEL" },
    ButtonSet: { YES_NO: "YES_NO", OK_CANCEL: "OK_CANCEL" },
    alert: () => answer,
    prompt: () => ({ getSelectedButton: () => "CANCEL", getResponseText: () => "" })
  };
}

function makeRuntime(spreadsheet, options = {}) {
  const sent = options.sent || [];
  const ui = options.ui || makeUi();
  const properties = options.properties || {};
  return {
    sent,
    globals: {
      SpreadsheetApp: makeSpreadsheetApp(spreadsheet, ui),
      GmailApp: options.GmailApp || {
        sendEmail(email, subject, plainText, emailOptions) {
          sent.push({ email, subject, plainText, htmlBody: emailOptions.htmlBody });
        }
      },
      LockService: {
        getScriptLock: () => ({
          tryLock: () => true,
          releaseLock() {}
        })
      },
      PropertiesService: {
        getScriptProperties: () => ({
          getProperty: (key) => properties[key] || null,
          setProperty: (key, value) => { properties[key] = value; }
        })
      }
    }
  };
}

test("refund email confirms the completed refund", () => {
  const context = loadProject();

  for (const body of [
    context.getAefRefundEmailPlainText("Ada Lovelace", false),
    context.getAefRefundEmailHtml("Ada Lovelace", false)
  ]) {
    assert.match(body, /Hello Ada/i);
    assert.match(body, /commitment deposit has been refunded/i);
    assert.match(body, /account details you submitted/i);
  }
});

test("refund email only promises a certificate for a submitted portfolio", () => {
  const context = loadProject();
  const standardPlain = context.getAefRefundEmailPlainText("Ada Lovelace", false);
  const submittedPlain = context.getAefRefundEmailPlainText("Ada Lovelace", true);
  const standardHtml = context.getAefRefundEmailHtml("Ada Lovelace", false);
  const submittedHtml = context.getAefRefundEmailHtml("Ada Lovelace", true);

  assert.doesNotMatch(standardPlain, /certificate/i);
  assert.doesNotMatch(standardHtml, /certificate/i);
  assert.match(submittedPlain, /certificate will be sent by the weekend/i);
  assert.match(submittedHtml, /certificate will be sent by the weekend/i);
});

test("setup adds the dropdown and tracking columns without moving existing data", () => {
  const values = [
    baseHeaders.slice(),
    ["ada@example.com", "Ada Lovelace", "1234", "Bank", "Ada", "", "Submitted"]
  ];
  const sheet = makeSheet("Refund list", values);
  const spreadsheet = makeSpreadsheet(sheet);
  const context = loadProject({ SpreadsheetApp: makeSpreadsheetApp(spreadsheet) });

  context.setupAefRefundEmailAutomation();

  assert.deepEqual(values[0].slice(0, 10), [
    "Email", "Name", "Account Number", "Bank", "Account Name", "Refund",
    "Portfolio Status", "Refund Email Status", "Refund Email Error", "Refund Email Sent At"
  ]);
  assert.equal(values[1][0], "ada@example.com");
  assert.deepEqual(Array.from(sheet.validation.rule.values), ["Yes", "No"]);
  assert.equal(sheet.validation.column, 6);
});

test("pending refund rows exclude blank, Sent, and Sending records", () => {
  const values = [
    baseHeaders.concat(["Refund Email Status", "Refund Email Error", "Refund Email Sent At"]),
    ["ready@example.com", "Ready Person", "1", "Bank", "Ready", "", ""],
    ["sent@example.com", "Sent Person", "2", "Bank", "Sent", "Yes", "Submitted", "Sent"],
    ["sending@example.com", "Sending Person", "3", "Bank", "Sending", "Yes", "Submitted", "Sending"],
    ["", "No Email Person", "4", "Bank", "No Email", "", "Submitted"]
  ];
  const sheet = makeSheet("Renamed tab", values);
  const spreadsheet = makeSpreadsheet(sheet);
  const context = loadProject({ SpreadsheetApp: makeSpreadsheetApp(spreadsheet) });

  const rows = context.getPendingAefRefundRows_(sheet);

  assert.deepEqual(Array.from(rows), [2, 5]);
});

test("live cancellation changes no refund values and sends nothing", () => {
  const values = [
    baseHeaders.slice(),
    ["ada@example.com", "Ada Lovelace", "1234", "Bank", "Ada", "", "Submitted"]
  ];
  const sheet = makeSheet("Refund list", values);
  const spreadsheet = makeSpreadsheet(sheet);
  const sent = [];
  const runtime = makeRuntime(spreadsheet, { ui: makeUi("NO"), sent });
  const context = loadProject(runtime.globals);

  context.sendAefRefundEmailsLive();

  assert.equal(values[1][5], "");
  assert.equal(sent.length, 0);
  assert.equal(values[1][7] || "", "");
});

test("live batch marks every eligible row refunded and tailors the certificate sentence", () => {
  const values = [
    baseHeaders.slice(),
    ["standard@example.com", "Standard Person", "1", "Bank", "Standard", "", ""],
    ["submitted@example.com", "Submitted Person", "2", "Bank", "Submitted", "", "  sUbMiTtEd  "]
  ];
  const sheet = makeSheet("Refund list", values);
  const spreadsheet = makeSpreadsheet(sheet);
  const runtime = makeRuntime(spreadsheet);
  const context = loadProject(runtime.globals);

  context.sendAefRefundEmailsLive();

  assert.equal(values[1][5], "Yes");
  assert.equal(values[2][5], "Yes");
  assert.equal(values[1][7], "Sent");
  assert.equal(values[2][7], "Sent");
  assert.ok(Number.isFinite(new Date(values[1][9]).getTime()));
  assert.ok(Number.isFinite(new Date(values[2][9]).getTime()));
  assert.equal(runtime.sent.length, 2);
  assert.doesNotMatch(runtime.sent[0].plainText, /certificate/i);
  assert.match(runtime.sent[1].plainText, /certificate will be sent by the weekend/i);
});

test("invalid email is recorded and Gmail is not called", () => {
  const values = [
    baseHeaders.concat(["Refund Email Status", "Refund Email Error", "Refund Email Sent At"]),
    ["not-an-email", "Invalid Person", "1", "Bank", "Invalid", "", "Submitted", "", "", ""]
  ];
  const sheet = makeSheet("Refund list", values);
  const spreadsheet = makeSpreadsheet(sheet);
  const runtime = makeRuntime(spreadsheet);
  const context = loadProject(runtime.globals);

  const result = context.processAefRefundRow_(sheet, 2);

  assert.equal(result, "invalid");
  assert.equal(values[1][5], "Yes");
  assert.equal(values[1][7], "Error");
  assert.match(values[1][8], /valid email/i);
  assert.equal(runtime.sent.length, 0);
});

test("Gmail failure is recorded so the row can be retried", () => {
  const values = [
    baseHeaders.concat(["Refund Email Status", "Refund Email Error", "Refund Email Sent At"]),
    ["ada@example.com", "Ada Lovelace", "1", "Bank", "Ada", "", "", "", "", ""]
  ];
  const sheet = makeSheet("Refund list", values);
  const spreadsheet = makeSpreadsheet(sheet);
  const runtime = makeRuntime(spreadsheet, {
    GmailApp: { sendEmail() { throw new Error("Daily email limit reached"); } }
  });
  const context = loadProject(runtime.globals);

  const result = context.processAefRefundRow_(sheet, 2);

  assert.equal(result, "error");
  assert.equal(values[1][5], "Yes");
  assert.equal(values[1][7], "Error");
  assert.match(values[1][8], /Daily email limit reached/i);
});

test("test email goes only to the saved address and changes no participant tracking", () => {
  const values = [
    baseHeaders.concat(["Refund Email Status", "Refund Email Error", "Refund Email Sent At"]),
    ["participant@example.com", "Participant Person", "1", "Bank", "Participant", "", "Submitted", "", "", ""]
  ];
  const sheet = makeSheet("Refund list", values);
  const spreadsheet = makeSpreadsheet(sheet);
  const runtime = makeRuntime(spreadsheet, {
    properties: { AEF_COHORT_1_REFUND_TEST_EMAIL: "admin@example.com" }
  });
  const context = loadProject(runtime.globals);

  context.sendAefRefundTestEmail();

  assert.equal(runtime.sent.length, 1);
  assert.equal(runtime.sent[0].email, "admin@example.com");
  assert.match(runtime.sent[0].subject, /^\[TEST\]/);
  assert.match(runtime.sent[0].plainText, /certificate will be sent by the weekend/i);
  assert.equal(values[1][5], "");
  assert.equal(values[1][7], "");
});

test("count reports unsent participant rows without sending email", () => {
  const values = [
    baseHeaders.slice(),
    ["one@example.com", "One Person", "1", "Bank", "One", "", ""],
    ["two@example.com", "Two Person", "2", "Bank", "Two", "", "Submitted"]
  ];
  const sheet = makeSheet("Refund list", values);
  const spreadsheet = makeSpreadsheet(sheet);
  const runtime = makeRuntime(spreadsheet);
  const context = loadProject(runtime.globals);

  const count = context.countAefRefundEmailsWaiting();

  assert.equal(count, 2);
  assert.equal(runtime.sent.length, 0);
  assert.equal(values[1][5], "");
  assert.equal(values[2][5], "");
});

test("setting the test recipient saves a valid email address", () => {
  const values = [baseHeaders.slice()];
  const sheet = makeSheet("Refund list", values);
  const spreadsheet = makeSpreadsheet(sheet);
  const properties = {};
  const ui = makeUi();
  ui.prompt = () => ({
    getSelectedButton: () => "OK",
    getResponseText: () => " admin@example.com "
  });
  const runtime = makeRuntime(spreadsheet, { properties, ui });
  const context = loadProject(runtime.globals);

  context.setAefRefundTestEmailRecipient();

  assert.equal(properties.AEF_COHORT_1_REFUND_TEST_EMAIL, "admin@example.com");
});

test("preview opens the submitted-portfolio email without sending", () => {
  const values = [baseHeaders.slice()];
  const sheet = makeSheet("Refund list", values);
  const spreadsheet = makeSpreadsheet(sheet);
  const ui = makeUi();
  let dialog = null;
  ui.showModalDialog = (output, title) => { dialog = { output, title }; };
  const runtime = makeRuntime(spreadsheet, { ui });
  runtime.globals.HtmlService = {
    createHtmlOutput(html) {
      return {
        html,
        setWidth() { return this; },
        setHeight() { return this; }
      };
    }
  };
  const context = loadProject(runtime.globals);

  context.previewAefRefundEmail();

  assert.match(dialog.title, /refund email/i);
  assert.match(dialog.output.html, /certificate will be sent by the weekend/i);
  assert.equal(runtime.sent.length, 0);
});
