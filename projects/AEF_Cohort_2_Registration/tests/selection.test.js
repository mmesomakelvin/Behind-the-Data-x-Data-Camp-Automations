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

const sourceHeaders = [
  "Timestamp",
  "Email address",
  "Column 2",
  "Full Name",
  "Email Address",
  "Country",
  "State / Region",
  "What best describes you right now?",
  "LinkedIn Url",
  "This fellowship requires a refundable commitment deposit. If accepted, are you willing and able to make this refundable commitment deposit within 24 hours?"
];

test("selection map keeps only applicants who answered Yes", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);
  assert.equal(typeof context.buildAefSelectionRows_, "function");

  const rows = context.buildAefSelectionRows_(sourceHeaders, [
    ["date", "ada@example.com", "Ada backup", "Ada Lovelace", "ada.alt@example.com", "Nigeria", "Lagos", "Analyst", "https://linkedin.com/in/ada", "Yes"],
    ["date", "grace@example.com", "Grace backup", "Grace Hopper", "grace.alt@example.com", "Ghana", "Accra", "Engineer", "https://linkedin.com/in/grace", "No"]
  ], [], []);

  assert.equal(rows.length, 1);
  assert.deepEqual(Array.from(rows[0].slice(0, 9)), [
    "ada@example.com",
    "Ada backup",
    "Ada Lovelace",
    "ada.alt@example.com",
    "Nigeria",
    "Lagos",
    "Analyst",
    "https://linkedin.com/in/ada",
    "Yes"
  ]);
});

test("selection refresh keeps one latest row per person and preserves manual review work", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);
  const selectionHeaders = Array.from(context.getAefSelectionHeaders_());
  const existingRows = [[
    "ADA@example.com", "", "Ada Old", "", "Nigeria", "Lagos", "Analyst", "", "Yes",
    "Accepted", "Sent", "", "2026-08-24"
  ]];

  const rows = context.buildAefSelectionRows_(sourceHeaders, [
    ["earlier", "ada@example.com", "", "Ada Old", "", "Nigeria", "Lagos", "Analyst", "", "Yes"],
    ["latest", "ADA@example.com", "", "Ada Updated", "", "Nigeria", "Abuja", "Engineer", "", "Yes"]
  ], selectionHeaders, existingRows);

  assert.equal(rows.length, 1);
  assert.equal(rows[0][2], "Ada Updated");
  assert.equal(rows[0][5], "Abuja");
  assert.deepEqual(Array.from(rows[0].slice(9)), ["Accepted", "Sent", "", "2026-08-24"]);
});

test("a newer No answer removes an earlier Yes applicant from the selection map", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);
  const rows = context.buildAefSelectionRows_(sourceHeaders, [
    ["2026-08-20T10:00:00Z", "ada@example.com", "", "Ada", "", "Nigeria", "Lagos", "Analyst", "", "Yes"],
    ["2026-08-24T10:00:00Z", "ada@example.com", "", "Ada", "", "Nigeria", "Lagos", "Analyst", "", "No"]
  ], [], []);

  assert.equal(rows.length, 0);
});

test("selection uses the newest timestamp even when source rows are out of order", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);
  const rows = context.buildAefSelectionRows_(sourceHeaders, [
    ["2026-08-24T10:00:00Z", "ada@example.com", "", "Ada New", "", "Nigeria", "Abuja", "Engineer", "", "Yes"],
    ["2026-08-20T10:00:00Z", "ada@example.com", "", "Ada Old", "", "Nigeria", "Lagos", "Analyst", "", "Yes"]
  ], [], []);

  assert.equal(rows.length, 1);
  assert.equal(rows[0][2], "Ada New");
  assert.equal(rows[0][5], "Abuja");
});

test("acceptance preview uses Cohort 2 links and a 72-hour payment window", () => {
  const staleFormUrl = "https://docs.google.com/forms/d/e/OLD_SAVED_FORM/viewform";
  const context = loadScripts(["EmailTemplate.js", "Code.js", "AcceptanceEmailTemplate.js"], {
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => key === "AEF_COHORT_2_ACCEPTANCE_FORM_URL" ? staleFormUrl : ""
      })
    }
  });
  assert.equal(typeof context.getAefCohort2AcceptanceEmailHtml, "function");
  assert.equal(typeof context.getAefCohort2AcceptanceEmailPlainText, "function");

  const html = context.getAefCohort2AcceptanceEmailHtml("Ada Lovelace");
  const plainText = context.getAefCohort2AcceptanceEmailPlainText("Ada Lovelace");
  for (const body of [html, plainText]) {
    assert.match(body, /Analytics Engineering Fellowship Cohort 2/i);
    assert.match(body, /within 72 hours of receiving this email/i);
    assert.doesNotMatch(body, /within 24 hours/i);
    assert.match(body, /September 1, 2026/i);
    assert.match(body, /30,100/);
    assert.match(body, /1icI-afhVqYoaV6GLAr9CpU_A_2c26Zg-L3e-0fXKtOM/);
    assert.match(body, /1FAIpQLSe9cRTvZ_p6jCL2lWw8ryK2WWX_rG4QjbcvZEzQxJkJ6ceMLg/);
    assert.doesNotMatch(body, /OLD_SAVED_FORM/);
    assert.doesNotMatch(body, /February 18/i);
    assert.doesNotMatch(body, /1r5aKeScDitYzioKv7fuBS3XWIEL9nXRzQKgSipVSzKM/);
    assert.doesNotMatch(body, /1FAIpQLSfqr5JO36Vo1R-HPTih64GFVGdoMBeXYPb2wcaq6yHZfmRCyg/);
  }
});

test("acceptance form copy changes Cohort 1 wording and the old compliance link", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);
  const updated = context.replaceAefCohort2FormText_(
    "Analytics Engineering Fellowship Cohort 1. Deadline: Wednesday, 18 February 2026. " +
    "Read https://docs.google.com/document/d/1r5aKeScDitYzioKv7fuBS3XWIEL9nXRzQKgSipVSzKM/edit"
  );

  assert.match(updated, /Analytics Engineering Fellowship Cohort 2/);
  assert.match(updated, /1icI-afhVqYoaV6GLAr9CpU_A_2c26Zg-L3e-0fXKtOM/);
  assert.match(updated, /within 72 hours of receiving your acceptance email/i);
  assert.doesNotMatch(updated, /Cohort 1/);
  assert.doesNotMatch(updated, /18 February 2026/i);
  assert.doesNotMatch(updated, /1r5aKeScDitYzioKv7fuBS3XWIEL9nXRzQKgSipVSzKM/);
});

test("source form lookup compares the public form link without its sharing suffix", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);
  assert.equal(
    context.normalizeAefPublishedFormUrl_(
      "https://docs.google.com/forms/d/e/PUBLIC_FORM_ID/viewform?usp=dialog"
    ),
    "https://docs.google.com/forms/d/e/PUBLIC_FORM_ID/viewform"
  );
});

test("acceptance form adaptation also updates help text inside copied questions", () => {
  let savedHelp = "Cohort 1: use document 1r5aKeScDitYzioKv7fuBS3XWIEL9nXRzQKgSipVSzKM";
  const typedItem = {
    getHelpText: () => savedHelp,
    setHelpText(value) { savedHelp = value; return this; }
  };
  const item = {
    getTitle: () => "Cohort 1 details",
    setTitle() { return this; },
    getType: () => "TEXT",
    asTextItem: () => typedItem
  };
  const form = {
    setTitle() { return this; },
    getDescription: () => "",
    setDescription() { return this; },
    getConfirmationMessage: () => "Thank you",
    setConfirmationMessage() { return this; },
    getItems: () => [item],
    setAcceptingResponses() { return this; }
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    FormApp: { ItemType: { TEXT: "TEXT" } }
  });

  context.adaptAefCohort2AcceptanceForm_(form);

  assert.match(savedHelp, /Cohort 2/);
  assert.match(savedHelp, /1icI-afhVqYoaV6GLAr9CpU_A_2c26Zg-L3e-0fXKtOM/);
});

test("acceptance form adaptation updates Cohort 1 wording inside answer choices", () => {
  let savedChoices = ["Join Cohort 1", "Decline"];
  const typedItem = {
    getHelpText: () => "",
    setHelpText() { return this; },
    getChoiceValues: () => savedChoices.slice(),
    setChoiceValues(values) { savedChoices = values.slice(); return this; }
  };
  const item = {
    getTitle: () => "Decision",
    setTitle() { return this; },
    getType: () => "MULTIPLE_CHOICE",
    asMultipleChoiceItem: () => typedItem
  };
  const form = {
    setTitle() { return this; },
    getDescription: () => "",
    setDescription() { return this; },
    getConfirmationMessage: () => "Thank you",
    setConfirmationMessage() { return this; },
    getItems: () => [item],
    setAcceptingResponses() { return this; }
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    FormApp: { ItemType: { MULTIPLE_CHOICE: "MULTIPLE_CHOICE" } }
  });

  context.adaptAefCohort2AcceptanceForm_(form);

  assert.deepEqual(savedChoices, ["Join Cohort 2", "Decline"]);
});

test("a copied acceptance form ID is saved before later adaptation can fail", () => {
  const saved = {};
  const sourceForm = {
    getId: () => "source-form-id",
    getPublishedUrl: () => "https://docs.google.com/forms/d/e/1FAIpQLSfqr5JO36Vo1R-HPTih64GFVGdoMBeXYPb2wcaq6yHZfmRCyg/viewform"
  };
  const brokenCopy = {
    getId: () => "new-form-id",
    setTitle() { throw new Error("adaptation failed"); }
  };
  const fileIterator = {
    used: false,
    hasNext() { return !this.used; },
    next() { this.used = true; return { getId: () => "source-form-id" }; }
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js"], {
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => saved[key] || "",
        setProperty(key, value) { saved[key] = value; },
        setProperties(values) { Object.assign(saved, values); }
      })
    },
    DriveApp: {
      searchFiles: () => fileIterator,
      getFileById: () => ({ makeCopy: () => ({ getId: () => "new-form-id" }) })
    },
    FormApp: {
      openById: (id) => id === "source-form-id" ? sourceForm : brokenCopy
    },
    LockService: {
      getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} })
    }
  });

  assert.throws(() => context.setupCohort2AcceptanceForm(), /adaptation failed/);
  assert.equal(saved.AEF_COHORT_2_ACCEPTANCE_FORM_ID, "new-form-id");
});

test("updating a choice keeps its answer-based section destination", () => {
  const destination = { id: "payment-section" };
  const originalChoice = {
    getValue: () => "Continue to Cohort 1 payment",
    getGotoPage: () => destination,
    getPageNavigationType: () => null
  };
  let savedChoices;
  const typedItem = {
    getChoices: () => [originalChoice],
    createChoice: (value, navigation) => ({ value, navigation }),
    setChoices(choices) { savedChoices = choices; return this; },
    setChoiceValues() { throw new Error("section navigation would be lost"); }
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);

  context.adaptAefCohort2ChoiceText_(typedItem);

  assert.deepEqual(savedChoices, [{
    value: "Continue to Cohort 2 payment",
    navigation: destination
  }]);
});

test("a copied form is published before it is made available to applicants", () => {
  const calls = [];
  const form = {
    setTitle() { return this; },
    getDescription: () => "",
    setDescription() { return this; },
    getConfirmationMessage: () => "Thank you",
    setConfirmationMessage() { return this; },
    getItems: () => [],
    supportsAdvancedResponderPermissions: () => true,
    setPublished(value) { calls.push(["published", value]); return this; },
    setAcceptingResponses() {
      throw new Error("Operation not supported on unpublished form");
    }
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);

  context.adaptAefCohort2AcceptanceForm_(form);

  assert.deepEqual(calls, [["published", true]]);
});

test("acceptance sending emails only Accepted unsent applicants and records delivery", () => {
  const headers = [
    "Email address", "Column 2", "Full Name", "Email Address", "Country",
    "State / Region", "What best describes you right now?", "LinkedIn Url",
    "Able to Commit", "Decision", "Acceptance Email Status",
    "Acceptance Email Error", "Acceptance Email Sent At"
  ];
  const values = [
    headers,
    ["ada@example.com", "", "Ada", "", "Nigeria", "Lagos", "Analyst", "", "Yes", "Accepted", "", "", ""],
    ["grace@example.com", "", "Grace", "", "Ghana", "Accra", "Engineer", "", "Yes", "Under Review", "", "", ""],
    ["linus@example.com", "", "Linus", "", "Finland", "Helsinki", "Engineer", "", "Yes", "Accepted", "Sent", "", "2026-08-24"]
  ];
  const sentTo = [];
  const sheet = makeEditableSheet(values);
  const context = loadScripts(["EmailTemplate.js", "Code.js", "AcceptanceEmailTemplate.js"], {
    SpreadsheetApp: { flush: () => {} },
    GmailApp: { sendEmail: (recipient) => sentTo.push(recipient) },
    Logger: { log: () => {} }
  });

  const result = context.processAefAcceptanceRows_(sheet);

  assert.deepEqual(sentTo, ["ada@example.com"]);
  assert.equal(result.sent, 1);
  assert.equal(result.failed, 0);
  assert.equal(values[1][10], "Sent");
  assert.equal(values[1][11], "");
  assert.equal(typeof values[1][12].getTime, "function");
  assert.equal(Number.isNaN(values[1][12].getTime()), false);
  assert.equal(values[2][10], "");
  assert.equal(values[3][10], "Sent");
});

test("a failed acceptance email is recorded and can be retried", () => {
  const values = [[
    "Email address", "Column 2", "Full Name", "Email Address", "Country",
    "State / Region", "What best describes you right now?", "LinkedIn Url",
    "Able to Commit", "Decision", "Acceptance Email Status",
    "Acceptance Email Error", "Acceptance Email Sent At"
  ], [
    "ada@example.com", "", "Ada", "", "Nigeria", "Lagos", "Analyst", "",
    "Yes", "Accepted", "", "", ""
  ]];
  const sheet = makeEditableSheet(values);
  const context = loadScripts(["EmailTemplate.js", "Code.js", "AcceptanceEmailTemplate.js"], {
    SpreadsheetApp: { flush: () => {} },
    GmailApp: { sendEmail: () => { throw new Error("mail unavailable"); } },
    Logger: { log: () => {} }
  });

  const result = context.processAefAcceptanceRows_(sheet);

  assert.equal(result.failed, 1);
  assert.equal(values[1][10], "Failed");
  assert.match(values[1][11], /mail unavailable/);
  assert.equal(values[1][12], "");
  assert.equal(
    context.determineAefAcceptanceAction_("Accepted", "ada@example.com", "Failed", {}),
    "send"
  );
});

test("acceptance sending aborts when the confirmed recipient list changes", () => {
  const values = [[
    "Email address", "Column 2", "Full Name", "Email Address", "Country",
    "State / Region", "What best describes you right now?", "LinkedIn Url",
    "Able to Commit", "Decision", "Acceptance Email Status",
    "Acceptance Email Error", "Acceptance Email Sent At"
  ], [
    "ada@example.com", "", "Ada", "", "Nigeria", "Lagos", "Analyst", "",
    "Yes", "Accepted", "", "", ""
  ], [
    "grace@example.com", "", "Grace", "", "Ghana", "Accra", "Engineer", "",
    "Yes", "Under Review", "", "", ""
  ]];
  const sentTo = [];
  const sheet = makeEditableSheet(values);
  const spreadsheet = {
    getId: () => "1BIA59dL4-hx8Io7JbVB0nXshOwG0I_8i8KK0GORdm30",
    getSheetByName: () => sheet
  };
  const ui = {
    ButtonSet: { YES_NO: "YES_NO" },
    Button: { YES: "YES" },
    alert() {
      values[2][9] = "Accepted";
      return this.Button.YES;
    }
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js", "AcceptanceEmailTemplate.js"], {
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
    Logger: { log: () => {} }
  });

  const message = context.sendAcceptedApplicants();

  assert.deepEqual(sentTo, []);
  assert.match(message, /selection changed/i);
  assert.equal(values[1][10], "");
  assert.equal(values[2][10], "");
});

test("acceptance sending continues when a failed email cannot be marked Failed", () => {
  const values = [[
    "Email address", "Column 2", "Full Name", "Email Address", "Country",
    "State / Region", "What best describes you right now?", "LinkedIn Url",
    "Able to Commit", "Decision", "Acceptance Email Status",
    "Acceptance Email Error", "Acceptance Email Sent At"
  ], [
    "ada@example.com", "", "Ada", "", "Nigeria", "Lagos", "Analyst", "",
    "Yes", "Accepted", "", "", ""
  ], [
    "grace@example.com", "", "Grace", "", "Ghana", "Accra", "Engineer", "",
    "Yes", "Accepted", "", "", ""
  ]];
  const sentTo = [];
  const sheet = makeEditableSheet(values);
  const originalGetRange = sheet.getRange.bind(sheet);
  sheet.getRange = function (rowNumber, columnNumber, rowCount, columnCount) {
    const range = originalGetRange(rowNumber, columnNumber, rowCount, columnCount);
    const originalSetValue = range.setValue;
    range.setValue = function (value) {
      if (rowNumber === 2 && columnNumber === 11 && value === "Failed") {
        throw new Error("tracking write failed");
      }
      return originalSetValue.call(this, value);
    };
    return range;
  };
  const context = loadScripts(["EmailTemplate.js", "Code.js", "AcceptanceEmailTemplate.js"], {
    SpreadsheetApp: { flush: () => {} },
    GmailApp: {
      sendEmail(recipient) {
        if (recipient === "ada@example.com") throw new Error("mail unavailable");
        sentTo.push(recipient);
      }
    },
    Logger: { log: () => {} }
  });

  const result = context.processAefAcceptanceRows_(sheet);

  assert.deepEqual(sentTo, ["grace@example.com"]);
  assert.equal(result.sent, 1);
  assert.equal(result.failed, 1);
  assert.equal(result.review, 1);
  assert.equal(values[1][10], "Sending");
  assert.match(values[1][11], /mail unavailable/i);
  assert.match(values[1][11], /tracking write failed/i);
  assert.equal(values[2][10], "Sent");
});

function makeEditableSheet(values) {
  return {
    getLastRow: () => values.length,
    getLastColumn: () => values[0].length,
    getRange(rowNumber, columnNumber, rowCount, columnCount) {
      const startRow = rowNumber - 1;
      const startColumn = columnNumber - 1;
      return {
        getValues: () => values
          .slice(startRow, startRow + (rowCount || 1))
          .map((row) => row.slice(startColumn, startColumn + (columnCount || 1))),
        setValue(value) {
          values[startRow][startColumn] = value;
          return this;
        }
      };
    }
  };
}
