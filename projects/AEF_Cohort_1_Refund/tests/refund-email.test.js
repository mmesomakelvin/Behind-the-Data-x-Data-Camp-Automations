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
