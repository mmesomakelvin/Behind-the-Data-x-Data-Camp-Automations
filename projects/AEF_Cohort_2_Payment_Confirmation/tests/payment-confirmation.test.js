const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");
const spreadsheetId = "10v2U9Sn6JpcPP3Zr1d_z46s7PIuuJQlgjj7VY2mb0Y4";

const sourceHeaders = [
  "Timestamp", "Email address", "Full Name", "LinkedIn Url", "Upload Headshot",
  "Payment Evidence", "Upload the signed compliance document.",
  "Bank Name (For processing refund)", "Account Name", "Account Number"
];

const reviewHeaders = [
  "Submission Date", "Email address", "Full Name", "LinkedIn Url",
  "Payment Evidence", "Payment Review Status", "Received Email Status",
  "Received Email Error", "Received Email Sent At", "Confirmation Email Status",
  "Confirmation Email Error", "Confirmation Email Sent At", "Source Response Key"
];

function loadScripts(fileNames, globals = {}) {
  const context = vm.createContext({ console, ...globals });
  fileNames.forEach((fileName) => {
    const filePath = path.join(projectRoot, "src", fileName);
    if (!fs.existsSync(filePath)) return;
    vm.runInContext(fs.readFileSync(filePath, "utf8"), context, { filename: fileName });
  });
  return context;
}

function loadProject(globals = {}) {
  return loadScripts(["ReceivedEmailTemplate.js", "EmailTemplate.js", "Code.js"], globals);
}

test("payment confirmation email is written for AEF Cohort 2", () => {
  const context = loadProject();
  for (const body of [
    context.getAefPaymentConfirmationEmailHtml("Ada Lovelace"),
    context.getAefPaymentConfirmationEmailPlainText("Ada Lovelace")
  ]) {
    assert.match(body, /Hello Ada/i);
    assert.match(body, /Analytics Engineering Fellowship Cohort 2/i);
    assert.match(body, /payment (has been )?confirmed/i);
    assert.match(body, /place.*secured/i);
  }
});

test("received email clearly says the evidence is under review and not confirmed", () => {
  const context = loadProject();
  for (const body of [
    context.getAefPaymentReceivedEmailHtml("Ada Lovelace"),
    context.getAefPaymentReceivedEmailPlainText("Ada Lovelace")
  ]) {
    assert.match(body, /Hello Ada/i);
    assert.match(body, /payment evidence.*received/i);
    assert.match(body, /under review|being reviewed/i);
    assert.match(body, /not.*payment confirmation/i);
  }
});

test("sync creates one review row and never sends email", () => {
  const sourceValues = [sourceHeaders.slice(), [
    "2026-08-28T10:00:00", "ada@example.com", "Ada Lovelace",
    "https://linkedin.com/in/ada", "headshot", "https://drive.google.com/payment",
    "compliance", "Bank", "Ada", "1234"
  ]];
  const { spreadsheet, sheets } = makeSpreadsheet({ Form_Responses: sourceValues });
  let sends = 0;
  const context = loadProject(makeGlobals(spreadsheet, {
    GmailApp: { sendEmail: () => { sends++; } }
  }));

  const summary = context.syncAefPaymentReviewRows_();

  assert.deepEqual(JSON.parse(JSON.stringify(sheets["Payment Review"].values[0])), reviewHeaders);
  assert.deepEqual(sheets["Payment Review"].values[1].slice(0, 6), [
    "2026-08-28T10:00:00", "ada@example.com", "Ada Lovelace",
    "https://linkedin.com/in/ada", "https://drive.google.com/payment", "Pending"
  ]);
  assert.equal(summary.added, 1);
  assert.equal(sends, 0);
});

test("setup reads the real Google Sheets tab named Form responses 1", () => {
  const sourceValues = [sourceHeaders.slice(), [
    "2026-08-31T10:00:00", "real-tab@example.com", "Real Tab Applicant",
    "https://linkedin.com/in/real-tab", "headshot", "payment",
    "compliance", "Bank", "Real Tab", "2468"
  ]];
  const { spreadsheet, sheets } = makeSpreadsheet({ "Form responses 1": sourceValues });
  let sends = 0;
  const context = loadProject(makeGlobals(spreadsheet, {
    GmailApp: { sendEmail: () => { sends++; } }
  }));

  const summary = context.syncAefPaymentReviewRows_();

  assert.equal(summary.added, 1);
  assert.equal(sheets["Payment Review"].values[1][1], "real-tab@example.com");
  assert.equal(sends, 0);
});

test("rerunning sync updates source details without duplicating or erasing review work", () => {
  const sourceValues = [sourceHeaders.slice(), [
    "2026-08-28T10:00:00", "old@example.com", "Ada Lovelace",
    "https://linkedin.com/in/ada", "headshot", "old-payment",
    "compliance", "Bank", "Ada", "1234"
  ]];
  const { spreadsheet, sheets } = makeSpreadsheet({ Form_Responses: sourceValues });
  const context = loadProject(makeGlobals(spreadsheet));

  context.syncAefPaymentReviewRows_();
  sheets["Payment Review"].values[1][5] = "Confirmed";
  sheets["Payment Review"].values[1][6] = "Sent";
  sourceValues[1][1] = "corrected@example.com";
  sourceValues[1][5] = "new-payment";
  sourceValues[1][9] = "9999";
  context.syncAefPaymentReviewRows_();

  assert.equal(sheets["Payment Review"].values.length, 2);
  assert.equal(sheets["Payment Review"].values[1][1], "corrected@example.com");
  assert.equal(sheets["Payment Review"].values[1][4], "new-payment");
  assert.equal(sheets["Payment Review"].values[1][5], "Confirmed");
  assert.equal(sheets["Payment Review"].values[1][6], "Sent");
});

test("sync follows header names if Payment Review columns were rearranged", () => {
  const sourceValues = [sourceHeaders.slice(), [
    "2026-08-28T10:00:00", "ada@example.com", "Ada Lovelace", "linkedin",
    "headshot", "payment", "compliance", "Bank", "Ada", "1234"
  ]];
  const rearrangedHeaders = [
    "Full Name", "Payment Review Status", "Email address", "Submission Date",
    "LinkedIn Url", "Payment Evidence", "Received Email Status", "Received Email Error",
    "Received Email Sent At", "Confirmation Email Status", "Confirmation Email Error",
    "Confirmation Email Sent At", "Source Response Key"
  ];
  const existing = [
    "Old Name", "Confirmed", "old@example.com", "2026-08-28T10:00:00",
    "old-linkedin", "old-payment", "Sent", "", "", "Sent", "", "",
    "2026-08-28t10:00:00|1234|ada@example.com"
  ];
  const { spreadsheet, sheets } = makeSpreadsheet({
    Form_Responses: sourceValues, "Payment Review": [rearrangedHeaders, existing]
  });
  const context = loadProject(makeGlobals(spreadsheet));

  context.syncAefPaymentReviewRows_();

  const row = sheets["Payment Review"].values[1];
  assert.equal(row[0], "Ada Lovelace");
  assert.equal(row[1], "Confirmed");
  assert.equal(row[2], "ada@example.com");
  assert.equal(row[3], "2026-08-28T10:00:00");
  assert.equal(row[4], "linkedin");
  assert.equal(row[5], "payment");
  assert.equal(row[6], "Sent");
});

test("setup backfills current applicants but sends no live email", () => {
  const sourceValues = [sourceHeaders.slice(), [
    "2026-08-28T10:00:00", "ada@example.com", "Ada", "linkedin", "headshot",
    "payment", "compliance", "Bank", "Ada", "1234"
  ]];
  const { spreadsheet, sheets } = makeSpreadsheet({ Form_Responses: sourceValues });
  let sends = 0;
  const context = loadProject(makeGlobals(spreadsheet, {
    GmailApp: { sendEmail: () => { sends++; } }, ScriptApp: makeScriptApp([])
  }));

  context.setupAefPaymentReviewAutomation();

  assert.equal(sheets["Payment Review"].values.length, 2);
  assert.equal(sends, 0);
});

test("an unsent review row receives one acknowledgement and is marked Sent", () => {
  const reviewValues = [reviewHeaders.slice(), makeReviewRow({})];
  const { spreadsheet, sheets } = makeSpreadsheet({
    Form_Responses: [sourceHeaders.slice()], "Payment Review": reviewValues
  });
  const sent = [];
  const context = loadProject(makeGlobals(spreadsheet, {
    GmailApp: { sendEmail: (to, subject, text) => sent.push({ to, subject, text }) }
  }));

  const result = context.processAefPaymentReceivedRow_(sheets["Payment Review"], 2);

  assert.equal(result, "sent");
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "ada@example.com");
  assert.match(sent[0].subject, /payment evidence received/i);
  assert.equal(reviewValues[1][6], "Sent");
  assert.equal(Object.prototype.toString.call(reviewValues[1][8]), "[object Date]");
});

test("a received email already marked Sent is never sent again", () => {
  const reviewValues = [reviewHeaders.slice(), makeReviewRow({ receivedStatus: "Sent" })];
  const { spreadsheet, sheets } = makeSpreadsheet({
    Form_Responses: [sourceHeaders.slice()], "Payment Review": reviewValues
  });
  let sends = 0;
  const context = loadProject(makeGlobals(spreadsheet, {
    GmailApp: { sendEmail: () => { sends++; } }
  }));

  const result = context.processAefPaymentReceivedRow_(sheets["Payment Review"], 2);

  assert.equal(result, "skipped");
  assert.equal(sends, 0);
});

test("a missing recipient is marked clearly without calling Gmail", () => {
  const reviewValues = [reviewHeaders.slice(), makeReviewRow({ email: "not-an-email" })];
  const { spreadsheet, sheets } = makeSpreadsheet({
    Form_Responses: [sourceHeaders.slice()], "Payment Review": reviewValues
  });
  let sends = 0;
  const context = loadProject(makeGlobals(spreadsheet, {
    GmailApp: { sendEmail: () => { sends++; } }
  }));

  const result = context.processAefPaymentReceivedRow_(sheets["Payment Review"], 2);

  assert.equal(result, "skipped");
  assert.equal(sends, 0);
  assert.equal(reviewValues[1][6], "Skipped - No Email");
  assert.match(reviewValues[1][7], /no valid recipient email/i);
});

test("a Gmail failure is recorded so the row can be retried", () => {
  const reviewValues = [reviewHeaders.slice(), makeReviewRow({})];
  const { spreadsheet, sheets } = makeSpreadsheet({
    Form_Responses: [sourceHeaders.slice()], "Payment Review": reviewValues
  });
  const context = loadProject(makeGlobals(spreadsheet, {
    GmailApp: { sendEmail: () => { throw new Error("Gmail unavailable"); } }
  }));

  const result = context.processAefPaymentReceivedRow_(sheets["Payment Review"], 2);

  assert.equal(result, "failed");
  assert.equal(reviewValues[1][6], "Failed");
  assert.match(reviewValues[1][7], /gmail unavailable/i);
});

test("cancelled existing-applicant catch-up sends nothing", () => {
  const reviewValues = [reviewHeaders.slice(), makeReviewRow({})];
  const { spreadsheet } = makeSpreadsheet({
    Form_Responses: [sourceHeaders.slice()], "Payment Review": reviewValues
  });
  let sends = 0;
  const ui = makeUi("NO");
  const context = loadProject(makeGlobals(spreadsheet, {
    SpreadsheetApp: makeSpreadsheetApp(spreadsheet, ui),
    GmailApp: { sendEmail: () => { sends++; } }
  }));

  context.sendAefPaymentReceivedEmailsToExistingApplicants();

  assert.equal(sends, 0);
  assert.equal(reviewValues[1][6], "");
});

test("bulk received email follows the source key if rows are sorted during confirmation", () => {
  const reviewValues = [
    reviewHeaders.slice(),
    makeReviewRow({ email: "target@example.com", name: "Target", key: "target-key" }),
    makeReviewRow({ email: "already@example.com", name: "Already", key: "sent-key", receivedStatus: "Sent" })
  ];
  const { spreadsheet } = makeSpreadsheet({
    Form_Responses: [sourceHeaders.slice()], "Payment Review": reviewValues
  });
  const sentTo = [];
  const ui = makeUi("YES");
  ui.alert = () => {
    const target = reviewValues[1];
    reviewValues[1] = reviewValues[2];
    reviewValues[2] = target;
    return "YES";
  };
  const context = loadProject(makeGlobals(spreadsheet, {
    SpreadsheetApp: makeSpreadsheetApp(spreadsheet, ui),
    GmailApp: { sendEmail: (email) => sentTo.push(email) }
  }));

  context.sendAefPaymentReceivedEmailsToExistingApplicants();

  assert.deepEqual(sentTo, ["target@example.com"]);
});

test("changing review status to Confirmed emails only the edited applicant", () => {
  const reviewValues = [
    reviewHeaders.slice(),
    makeReviewRow({ email: "ada@example.com", name: "Ada Lovelace" }),
    makeReviewRow({ email: "grace@example.com", name: "Grace Hopper", key: "other" })
  ];
  const { spreadsheet, sheets } = makeSpreadsheet({
    Form_Responses: [sourceHeaders.slice()], "Payment Review": reviewValues
  });
  const sent = [];
  const context = loadProject(makeGlobals(spreadsheet, {
    GmailApp: { sendEmail: (to, subject, text) => sent.push({ to, subject, text }) }
  }));

  context.handleAefPaymentReviewEdit(makeEditEvent(sheets["Payment Review"], 2, 6, "Confirmed"));

  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "ada@example.com");
  assert.match(sent[0].subject, /payment confirmed/i);
  assert.equal(reviewValues[1][9], "Sent");
  assert.equal(reviewValues[2][9], "");
});

test("Pending and Rejected review edits never send confirmation email", () => {
  for (const status of ["Pending", "Rejected"]) {
    const reviewValues = [reviewHeaders.slice(), makeReviewRow({ status })];
    const { spreadsheet, sheets } = makeSpreadsheet({
      Form_Responses: [sourceHeaders.slice()], "Payment Review": reviewValues
    });
    let sends = 0;
    const context = loadProject(makeGlobals(spreadsheet, {
      GmailApp: { sendEmail: () => { sends++; } }
    }));
    context.handleAefPaymentReviewEdit(makeEditEvent(sheets["Payment Review"], 2, 6, status));
    assert.equal(sends, 0);
  }
});

test("an edit on a different tab never sends payment email", () => {
  const otherValues = [reviewHeaders.slice(), makeReviewRow({ status: "Confirmed" })];
  const { spreadsheet, sheets } = makeSpreadsheet({
    Form_Responses: [sourceHeaders.slice()], "Another Review": otherValues
  });
  let sends = 0;
  const context = loadProject(makeGlobals(spreadsheet, {
    GmailApp: { sendEmail: () => { sends++; } }
  }));

  context.handleAefPaymentReviewEdit(makeEditEvent(sheets["Another Review"], 2, 6, "Confirmed"));

  assert.equal(sends, 0);
});

test("a new form submission is copied and receives one acknowledgement", () => {
  const sourceValues = [sourceHeaders.slice(), [
    "2026-08-28T10:00:00", "new@example.com", "New Applicant", "linkedin",
    "headshot", "payment", "compliance", "Bank", "New", "4321"
  ]];
  const { spreadsheet, sheets } = makeSpreadsheet({ Form_Responses: sourceValues });
  const sent = [];
  const context = loadProject(makeGlobals(spreadsheet, {
    GmailApp: { sendEmail: (to, subject) => sent.push({ to, subject }) }
  }));

  context.handleAefPaymentFormSubmit({
    range: { getSheet: () => sheets.Form_Responses, getRow: () => 2 }
  });

  assert.equal(sheets["Payment Review"].values.length, 2);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "new@example.com");
  assert.equal(sheets["Payment Review"].values[1][6], "Sent");
});

test("a busy confirmation edit is queued with its email type", () => {
  const reviewValues = [reviewHeaders.slice(), makeReviewRow({ status: "Confirmed" })];
  const { spreadsheet, sheets } = makeSpreadsheet({
    Form_Responses: [sourceHeaders.slice()], "Payment Review": reviewValues
  });
  const properties = {};
  const context = loadProject(makeGlobals(spreadsheet, {
    LockService: { getScriptLock: () => ({ tryLock: () => false, releaseLock: () => {} }) },
    PropertiesService: {
      getScriptProperties: () => ({
        setProperty(key, value) { properties[key] = value; },
        getProperties: () => ({ ...properties })
      })
    },
    Utilities: { getUuid: () => "queue-id", sleep: () => {} }
  }));

  context.handleAefPaymentReviewEdit(makeEditEvent(sheets["Payment Review"], 2, 6, "Confirmed"));

  const payload = JSON.parse(properties["AEF_PAYMENT_EMAIL_RETRY_queue-id"]);
  assert.equal(payload.type, "confirmation");
  assert.equal(payload.sourceKey, reviewValues[1][12]);
});

test("setup installs one form-submit, one edit, and one five-minute retry trigger", () => {
  const created = [];
  const { spreadsheet } = makeSpreadsheet({ Form_Responses: [sourceHeaders.slice()] });
  const context = loadProject(makeGlobals(spreadsheet, { ScriptApp: makeScriptApp(created) }));

  context.installAefPaymentReviewTriggers_();

  assert.deepEqual(created, [
    { handler: "handleAefPaymentFormSubmit", event: "ON_FORM_SUBMIT" },
    { handler: "handleAefPaymentReviewEdit", event: "ON_EDIT" },
    { handler: "processQueuedAefPaymentEmails", event: "CLOCK", minutes: 5 }
  ]);
});

test("source keys include email and exact collisions stop the sync before email", () => {
  const sourceValues = [sourceHeaders.slice(), [
    "2026-08-28T10:00:00", "ada@example.com", "Ada", "linkedin", "headshot",
    "payment-a", "compliance", "Bank", "Ada", "1234"
  ], [
    "2026-08-28T10:00:00", "grace@example.com", "Grace", "linkedin", "headshot",
    "payment-b", "compliance", "Bank", "Grace", "1234"
  ]];
  const { spreadsheet } = makeSpreadsheet({ Form_Responses: sourceValues });
  const context = loadProject(makeGlobals(spreadsheet));
  const columns = context.getAefPaymentSourceColumnIndexes_(sourceHeaders);

  assert.notEqual(
    context.getAefPaymentSourceKey_(sourceValues[1], columns, 2),
    context.getAefPaymentSourceKey_(sourceValues[2], columns, 3)
  );

  sourceValues[2][1] = "ada@example.com";
  assert.throws(
    () => context.syncAefPaymentReviewRows_(),
    /duplicate source response key/i
  );
});

test("duplicate hidden keys already in Payment Review stop the sync safely", () => {
  const sourceValues = [sourceHeaders.slice(), [
    "2026-08-28T10:00:00", "ada@example.com", "Ada", "linkedin", "headshot",
    "payment", "compliance", "Bank", "Ada", "1234"
  ]];
  const duplicateKey = "2026-08-28t10:00:00|1234|ada@example.com";
  const reviewValues = [
    reviewHeaders.slice(),
    makeReviewRow({ key: duplicateKey }),
    makeReviewRow({ key: duplicateKey, email: "wrong@example.com" })
  ];
  const { spreadsheet } = makeSpreadsheet({
    Form_Responses: sourceValues, "Payment Review": reviewValues
  });
  const context = loadProject(makeGlobals(spreadsheet));

  assert.throws(
    () => context.syncAefPaymentReviewRows_(),
    /duplicate source response key.*payment review/i
  );
});

test("an unresolved retry remains queued with an error instead of being lost", () => {
  const reviewValues = [reviewHeaders.slice(), makeReviewRow({})];
  const { spreadsheet } = makeSpreadsheet({
    Form_Responses: [sourceHeaders.slice()], "Payment Review": reviewValues
  });
  const queued = {
    AEF_PAYMENT_EMAIL_RETRY_missing: JSON.stringify({
      type: "confirmation", sourceKey: "missing-key", queuedAt: "2026-08-28T10:00:00Z"
    })
  };
  const context = loadProject(makeGlobals(spreadsheet, {
    PropertiesService: {
      getScriptProperties: () => ({
        getProperties: () => ({ ...queued }),
        setProperty(key, value) { queued[key] = value; },
        deleteProperty(key) { delete queued[key]; }
      })
    }
  }));

  context.processQueuedAefPaymentEmails();

  assert.ok(queued.AEF_PAYMENT_EMAIL_RETRY_missing);
  assert.match(queued.AEF_PAYMENT_EMAIL_RETRY_missing, /review row was not found/i);
});

test("a retry stays queued when Sending could not be recorded safely", () => {
  const reviewValues = [reviewHeaders.slice(), makeReviewRow({ status: "Confirmed" })];
  const { spreadsheet, sheets } = makeSpreadsheet({
    Form_Responses: [sourceHeaders.slice()], "Payment Review": reviewValues
  });
  const originalGetRange = sheets["Payment Review"].getRange.bind(sheets["Payment Review"]);
  sheets["Payment Review"].getRange = function (row, column, rowCount, columnCount) {
    const range = originalGetRange(row, column, rowCount, columnCount);
    const originalSetValue = range.setValue.bind(range);
    range.setValue = function (value) {
      if (row === 2 && column === 10 && value === "Sending") {
        throw new Error("tracking unavailable");
      }
      return originalSetValue(value);
    };
    return range;
  };
  const queued = {
    AEF_PAYMENT_EMAIL_RETRY_tracking: JSON.stringify({
      type: "confirmation", sourceKey: reviewValues[1][12], queuedAt: "2026-08-28T10:00:00Z"
    })
  };
  const context = loadProject(makeGlobals(spreadsheet, {
    PropertiesService: {
      getScriptProperties: () => ({
        getProperties: () => ({ ...queued }),
        setProperty(key, value) { queued[key] = value; },
        deleteProperty(key) { delete queued[key]; }
      })
    }
  }));

  context.processQueuedAefPaymentEmails();

  assert.ok(queued.AEF_PAYMENT_EMAIL_RETRY_tracking);
  assert.match(queued.AEF_PAYMENT_EMAIL_RETRY_tracking, /not safely recorded/i);
});

test("a second Google account cannot install another set of triggers", () => {
  const properties = {};
  let currentUser = "owner@example.com";
  const { spreadsheet } = makeSpreadsheet({ Form_Responses: [sourceHeaders.slice()] });
  const context = loadProject(makeGlobals(spreadsheet, {
    Session: { getEffectiveUser: () => ({ getEmail: () => currentUser }) },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => properties[key] || "",
        setProperty(key, value) { properties[key] = value; },
        deleteProperty(key) { delete properties[key]; },
        getProperties: () => ({ ...properties })
      })
    }
  }));

  context.claimAefPaymentTriggerOwner_();
  currentUser = "second@example.com";

  assert.throws(() => context.claimAefPaymentTriggerOwner_(), /owner@example\.com/i);
});

test("legacy confirmed values remain confirmed during migration", () => {
  const context = loadProject();
  for (const legacyValue of ["Yes", "Confirmed", true]) {
    assert.equal(
      context.getMigratedAefPaymentReviewStatus_([legacyValue], { oldConfirmedIndex: 0 }),
      "Confirmed"
    );
  }
});

test("old confirmation tracking is copied into Payment Review without resending", () => {
  const oldHeaders = sourceHeaders.concat([
    "Payment Confirmed", "Payment Confirmation Email Status",
    "Payment Confirmation Email Error", "Payment Confirmation Email Sent At"
  ]);
  const oldSentAt = new Date("2026-08-28T11:00:00Z");
  const sourceValues = [oldHeaders, [
    "2026-08-28T10:00:00", "ada@example.com", "Ada", "linkedin", "headshot",
    "payment", "compliance", "Bank", "Ada", "1234",
    "Yes", "Sent", "", oldSentAt
  ]];
  const { spreadsheet, sheets } = makeSpreadsheet({ Form_Responses: sourceValues });
  let sends = 0;
  const context = loadProject(makeGlobals(spreadsheet, {
    GmailApp: { sendEmail: () => { sends++; } }
  }));

  context.syncAefPaymentReviewRows_();

  assert.equal(sheets["Payment Review"].values[1][5], "Confirmed");
  assert.equal(sheets["Payment Review"].values[1][9], "Sent");
  assert.equal(sheets["Payment Review"].values[1][11], oldSentAt);
  assert.equal(sends, 0);
});

test("legacy queued confirmations are converted to the new stable key", () => {
  const sourceValues = [sourceHeaders.slice(), [
    "2026-08-28T10:00:00", "ada@example.com", "Ada", "linkedin", "headshot",
    "payment", "compliance", "Bank", "Ada", "1234"
  ]];
  const { spreadsheet } = makeSpreadsheet({ Form_Responses: sourceValues });
  const properties = {
    AEF_PAYMENT_RETRY_old: JSON.stringify({
      applicantKey: "response:2026-08-28T10:00:00|account:1234",
      queuedAt: "2026-08-28T10:05:00Z"
    })
  };
  const context = loadProject(makeGlobals(spreadsheet, {
    PropertiesService: {
      getScriptProperties: () => ({
        getProperties: () => ({ ...properties }),
        setProperty(key, value) { properties[key] = value; },
        deleteProperty(key) { delete properties[key]; }
      })
    },
    Utilities: { getUuid: () => "migrated", sleep: () => {} }
  }));

  const result = context.migrateLegacyAefPaymentQueue_();

  assert.equal(result.migrated, 1);
  assert.equal(properties.AEF_PAYMENT_RETRY_old, undefined);
  const payload = JSON.parse(properties.AEF_PAYMENT_EMAIL_RETRY_migrated);
  assert.equal(payload.type, "confirmation");
  assert.equal(payload.sourceKey, "2026-08-28t10:00:00|1234|ada@example.com");
});

test("legacy Date response keys use epoch milliseconds exactly like the old project", () => {
  const responseDate = new Date("2026-08-28T10:00:00Z");
  const row = [
    responseDate, "ada@example.com", "Ada", "linkedin", "headshot", "payment",
    "compliance", "Bank", "Ada", "1234"
  ];
  const context = loadProject();
  const columns = context.getAefPaymentSourceColumnIndexes_(sourceHeaders);

  assert.equal(
    context.getLegacyAefPaymentApplicantKey_(row, columns),
    "response:" + responseDate.getTime() + "|account:1234"
  );
});

function makeReviewRow(options) {
  return [
    "2026-08-28T10:00:00", options.email || "ada@example.com",
    options.name || "Ada Lovelace", "https://linkedin.com/in/ada",
    "https://drive.google.com/payment", options.status || "Pending",
    options.receivedStatus || "", "", "", options.confirmationStatus || "",
    "", "", options.key || "2026-08-28t10:00:00|1234"
  ];
}

function makeGlobals(spreadsheet, overrides = {}) {
  const properties = {};
  return {
    SpreadsheetApp: makeSpreadsheetApp(spreadsheet, makeUi("YES")),
    GmailApp: { sendEmail: () => {} },
    LockService: {
      getScriptLock: () => ({ tryLock: () => true, waitLock: () => {}, releaseLock: () => {} })
    },
    PropertiesService: {
      getScriptProperties: () => ({
        setProperty(key, value) { properties[key] = value; },
        getProperty: (key) => properties[key] || "",
        getProperties: () => ({ ...properties }),
        deleteProperty(key) { delete properties[key]; }
      })
    },
    ScriptApp: makeScriptApp([]),
    Session: { getEffectiveUser: () => ({ getEmail: () => "owner@example.com" }) },
    Utilities: { getUuid: () => "uuid", sleep: () => {} },
    Logger: { log: () => {} },
    HtmlService: {
      createHtmlOutput: () => ({ setWidth() { return this; }, setHeight() { return this; } }),
      createHtmlOutputFromFile: () => ({ setTitle() { return this; } })
    },
    ...overrides
  };
}

function makeSpreadsheetApp(spreadsheet, ui) {
  return {
    getActiveSpreadsheet: () => spreadsheet,
    openById: () => spreadsheet,
    getActive: () => ({ toast: () => {} }),
    getUi: () => ui,
    flush: () => {},
    newDataValidation: () => ({
      requireValueInList() { return this; }, setAllowInvalid() { return this; },
      build() { return {}; }
    })
  };
}

function makeUi(answer) {
  return {
    Button: { YES: "YES", NO: "NO", OK: "OK", CANCEL: "CANCEL" },
    ButtonSet: { YES_NO: "YES_NO", OK_CANCEL: "OK_CANCEL" },
    alert: () => answer,
    showModalDialog: () => {}, showSidebar: () => {},
    createMenu: () => ({
      addItem() { return this; }, addSeparator() { return this; }, addToUi() { return this; }
    })
  };
}

function makeEditEvent(sheet, row, column, value) {
  sheet.values[row - 1][column - 1] = value;
  return {
    value,
    range: {
      getSheet: () => sheet, getRow: () => row, getColumn: () => column,
      getNumRows: () => 1, getNumColumns: () => 1
    }
  };
}

function makeScriptApp(created) {
  return {
    EventType: { ON_FORM_SUBMIT: "ON_FORM_SUBMIT", ON_EDIT: "ON_EDIT", CLOCK: "CLOCK" },
    TriggerSource: { SPREADSHEETS: "SPREADSHEETS", CLOCK: "CLOCK" },
    getProjectTriggers: () => [], deleteTrigger: () => {},
    newTrigger(handler) {
      const pending = { handler, event: "" };
      return {
        forSpreadsheet() { return this; },
        onFormSubmit() { pending.event = "ON_FORM_SUBMIT"; return this; },
        onEdit() { pending.event = "ON_EDIT"; return this; },
        timeBased() { pending.event = "CLOCK"; return this; },
        everyMinutes(minutes) { pending.minutes = minutes; return this; },
        create() { created.push(pending); }
      };
    }
  };
}

function makeSpreadsheet(initialSheets) {
  const sheets = {};
  const spreadsheet = {
    getId: () => spreadsheetId,
    getSheetByName: (name) => sheets[name] || null,
    getSheets: () => Array.from(new Set(Object.values(sheets))),
    insertSheet(name) {
      const sheet = makeSheet(name, [[]], spreadsheet);
      sheets[name] = sheet;
      return sheet;
    },
    toast: () => {}
  };
  Object.entries(initialSheets).forEach(([name, values]) => {
    const actualName = name === "Form_Responses" ? "Form responses 1" : name;
    const sheet = makeSheet(actualName, values, spreadsheet);
    sheets[actualName] = sheet;
    if (actualName !== name) sheets[name] = sheet;
  });
  return { spreadsheet, sheets };
}

function makeSheet(name, values, spreadsheet) {
  const sheet = {
    values,
    getName: () => name, getParent: () => spreadsheet,
    getLastRow: () => {
      for (let index = values.length - 1; index >= 0; index--) {
        if (values[index].some((value) => String(value || "").trim() !== "")) return index + 1;
      }
      return 0;
    },
    getLastColumn: () => Math.max(1, ...values.map((row) => row.length)),
    getMaxRows: () => Math.max(values.length, 100),
    getMaxColumns: () => Math.max(26, ...values.map((row) => row.length)),
    setFrozenRows: () => sheet, setColumnWidth: () => sheet,
    hideColumns: () => sheet, autoResizeColumns: () => sheet,
    getRange(rowNumber, columnNumber, rowCount = 1, columnCount = 1) {
      const startRow = rowNumber - 1;
      const startColumn = columnNumber - 1;
      return {
        getValues: () => Array.from({ length: rowCount }, (_, rowOffset) =>
          Array.from({ length: columnCount }, (_, columnOffset) =>
            (values[startRow + rowOffset] || [])[startColumn + columnOffset] || ""
          )
        ),
        setValues(newValues) {
          ensureSize(values, startRow + newValues.length, startColumn + columnCount);
          newValues.forEach((row, rowOffset) => row.forEach((value, columnOffset) => {
            values[startRow + rowOffset][startColumn + columnOffset] = value;
          }));
          return this;
        },
        setValue(value) {
          ensureSize(values, startRow + 1, startColumn + 1);
          values[startRow][startColumn] = value;
          return this;
        },
        setDataValidation() { return this; }, setFontWeight() { return this; },
        setBackground() { return this; }, setFontColor() { return this; },
        setWrap() { return this; }, copyFormatToRange() { return this; }
      };
    }
  };
  return sheet;
}

function ensureSize(values, rows, columns) {
  while (values.length < rows) values.push([]);
  values.forEach((row) => { while (row.length < columns) row.push(""); });
}
