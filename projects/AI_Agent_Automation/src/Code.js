/**
 * AI Agents registration automation.
 * Project: AI_Agent_Automation
 */
const REGISTRATION_CONFIG = {
  sourceSheetNameCandidates: ["Form responses 1", "Form Responses 1", "Form_Responses"],
  mailSentSheetName: "Mail sent",
  colorGuideSheetName: "Automation color guide",
  mailSentHeaders: [
    "Email address",
    "Full Name",
    "WhatsApp Number (Include country code)",
    "Email Sent At"
  ],
  colorGuideHeaders: ["Color", "Meaning", "Automation Action", "Hex"],
  emailColumnCandidates: ["Email address", "Email Address", "Email", "email"],
  fullNameColumnCandidates: ["Full Name", "FullName", "Name"],
  phoneColumnCandidates: [
    "WhatsApp Number (Include country code)",
    "WhatsApp Number",
    "Whatsapp Number",
    "Phone Number",
    "Phone"
  ],
  senderName: "Behind the Data Academy",
  emailSubject: "We are Reviewing Your Application: Applied AI Development Bootcamp Scholarship",
  triggerHandlerFunction: "handleRegistrationSubmit",
  defaultTestEmail: "mmesomakelvin@gmail.com",
  testEmailProperty: "TEST_EMAIL_RECIPIENT",
  duplicateEmailRowColor: "#f59e0b"
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("AI Agents Automation")
    .addItem("Open Automation Buttons", "openAutomationButtons")
    .addSeparator()
    .addItem("Set Test Email Recipient", "setTestEmailRecipient")
    .addItem("Setup Automation + Trigger", "setupRegistrationAutomation")
    .addItem("Refresh Color Guide", "refreshColorGuide")
    .addItem("Install Auto Trigger", "installRegistrationTrigger")
    .addItem("Clear Auto Trigger", "clearRegistrationTrigger")
    .addSeparator()
    .addItem("Process Existing Rows", "processExistingRegistrations")
    .addItem("Send Test Acceptance Email", "sendRegistrationTestEmail")
    .addToUi();
}

function openAutomationButtons() {
  const html = HtmlService.createHtmlOutputFromFile("AutomationButtons")
    .setTitle("AI Agents Automation");
  SpreadsheetApp.getUi().showSidebar(html);
}

function setupRegistrationAutomation() {
  const sourceSheet = getRegistrationSourceSheet_();
  ensureMailSentSheet_();
  ensureColorGuideSheet_();
  installRegistrationTrigger();
  logAndToast_("Setup complete. Source sheet: " + sourceSheet.getName());
}

function refreshColorGuide() {
  ensureColorGuideSheet_();
  logAndToast_("Automation color guide refreshed.");
}

function installRegistrationTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === REGISTRATION_CONFIG.triggerHandlerFunction) {
      logAndToast_("Auto trigger already exists.");
      return;
    }
  }

  ScriptApp.newTrigger(REGISTRATION_CONFIG.triggerHandlerFunction)
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();

  logAndToast_("Auto trigger installed for new form submissions.");
}

function clearRegistrationTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;

  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === REGISTRATION_CONFIG.triggerHandlerFunction) {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }

  logAndToast_("Removed registration triggers: " + removed);
}

function handleRegistrationSubmit(e) {
  if (!e || !e.range) {
    Logger.log("Form submit event did not include row range.");
    return;
  }

  withScriptLock_(function () {
    const sheet = e.range.getSheet();
    if (!isRegistrationSourceSheet_(sheet)) {
      Logger.log("Skipped event from non-target sheet: " + sheet.getName());
      return;
    }

    ensureColorGuideSheet_();
    const mailSheet = ensureMailSentSheet_();
    const columns = getSourceColumnIndexes_(sheet);
    const existingEmails = getExistingMailSentEmails_(mailSheet);
    const result = processRow_(sheet, mailSheet, columns, e.range.getRow(), existingEmails);
    Logger.log("Processed form-submit row " + e.range.getRow() + ": " + result.status + " - " + result.message);
  });
}

function processExistingRegistrations() {
  withScriptLock_(function () {
    const sheet = getRegistrationSourceSheet_();
    ensureColorGuideSheet_();
    const mailSheet = ensureMailSentSheet_();
    const columns = getSourceColumnIndexes_(sheet);
    const existingEmails = getExistingMailSentEmails_(mailSheet);
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      logAndToast_("No registration rows found in source sheet.");
      return;
    }

    let sent = 0;
    let duplicate = 0;
    let skipped = 0;
    let failed = 0;

    for (let row = 2; row <= lastRow; row++) {
      const result = processRow_(sheet, mailSheet, columns, row, existingEmails);
      if (result.status === "sent") {
        sent++;
      } else if (result.status === "duplicate") {
        duplicate++;
      } else if (result.status === "failed") {
        failed++;
      } else {
        skipped++;
      }
    }

    logAndToast_(
      "Existing-row run complete. Sent: " + sent +
      ", Duplicates: " + duplicate +
      ", Failed: " + failed +
      ", Skipped: " + skipped
    );
  });
}

function sendRegistrationTestEmail() {
  const testEmail = getTestEmailRecipient_();

  GmailApp.sendEmail(
    testEmail,
    "[TEST] " + REGISTRATION_CONFIG.emailSubject,
    getAiAgentsAcceptancePlainText("Test User"),
    {
      htmlBody: getAiAgentsAcceptanceEmailHtml("Test User"),
      name: REGISTRATION_CONFIG.senderName
    }
  );

  logAndToast_("Test email sent to: " + testEmail);
}

function setTestEmailRecipient() {
  const ui = SpreadsheetApp.getUi();
  const currentEmail = getTestEmailRecipient_();
  const response = ui.prompt(
    "Set Test Email Recipient",
    "Enter the email address for test sends.\nCurrent: " + currentEmail,
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const email = String(response.getResponseText() || "").trim().toLowerCase();
  if (!isValidEmail_(email)) {
    ui.alert("Please enter a valid email address.");
    return;
  }

  PropertiesService.getScriptProperties().setProperty(REGISTRATION_CONFIG.testEmailProperty, email);
  logAndToast_("Test email recipient saved: " + email);
}

function saveTestEmailRecipient(email) {
  const clean = String(email || "").trim().toLowerCase();
  if (!isValidEmail_(clean)) {
    throw new Error("Please enter a valid email address.");
  }

  PropertiesService.getScriptProperties().setProperty(REGISTRATION_CONFIG.testEmailProperty, clean);
  logAndToast_("Test email recipient saved: " + clean);
  return clean;
}

function processRow_(sourceSheet, mailSheet, columns, rowNumber, existingEmails) {
  const row = sourceSheet.getRange(rowNumber, 1, 1, sourceSheet.getLastColumn()).getValues()[0];
  const email = normalizeEmail_(row[columns.emailIndex]);
  const fullName = String(row[columns.fullNameIndex] || "").trim();
  const phoneNumber = normalizePhone_(row[columns.phoneIndex]);

  if (!email) {
    return { status: "skipped", message: "Missing email" };
  }

  if (existingEmails[email]) {
    highlightDuplicateRegistrationRow_(sourceSheet, rowNumber);
    return { status: "duplicate", message: "Duplicate email found. Row highlighted orange; no new email sent." };
  }

  try {
    sendAcceptanceEmail_(email, fullName);
    const sentAt = buildMailSentTimestamp_();
    appendMailSentRow_(mailSheet, email, fullName, phoneNumber, sentAt);
    existingEmails[email] = true;
    return { status: "sent", message: "Email sent at " + sentAt };
  } catch (err) {
    return { status: "failed", message: String(err) };
  }
}

function sendAcceptanceEmail_(email, fullName) {
  GmailApp.sendEmail(
    email,
    REGISTRATION_CONFIG.emailSubject,
    getAiAgentsAcceptancePlainText(fullName),
    {
      htmlBody: getAiAgentsAcceptanceEmailHtml(fullName),
      name: REGISTRATION_CONFIG.senderName
    }
  );
}

function buildMailSentTimestamp_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const timeZone = spreadsheet ? spreadsheet.getSpreadsheetTimeZone() : Session.getScriptTimeZone();
  return Utilities.formatDate(new Date(), timeZone, "yyyy-MM-dd HH:mm:ss");
}

function appendMailSentRow_(sheet, email, fullName, phoneNumber, sentAt) {
  sheet.appendRow([email, fullName, phoneNumber, sentAt]);
}

function highlightDuplicateRegistrationRow_(sheet, rowNumber) {
  const width = Math.max(sheet.getLastColumn(), 1);
  sheet.getRange(rowNumber, 1, 1, width).setBackground(REGISTRATION_CONFIG.duplicateEmailRowColor);
}

function ensureMailSentSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(REGISTRATION_CONFIG.mailSentSheetName);

  if (!sheet) {
    sheet = ss.insertSheet(REGISTRATION_CONFIG.mailSentSheetName);
  }

  const headers = REGISTRATION_CONFIG.mailSentHeaders;
  const shouldWriteHeaders = sheet.getLastRow() < 1 || !isHeaderRowMatch_(sheet, headers);
  if (shouldWriteHeaders) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold").setBackground("#e8eefc");
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function ensureColorGuideSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(REGISTRATION_CONFIG.colorGuideSheetName);

  if (!sheet) {
    sheet = ss.insertSheet(REGISTRATION_CONFIG.colorGuideSheetName);
  }

  const rows = [
    REGISTRATION_CONFIG.colorGuideHeaders,
    [
      "Orange",
      "Duplicate email already has a sent-email record in Mail sent",
      "Do not send another email. Highlight the new registration row orange.",
      REGISTRATION_CONFIG.duplicateEmailRowColor
    ]
  ];

  const range = sheet.getRange(1, 1, rows.length, rows[0].length);
  range.setValues(rows);
  sheet.getRange(1, 1, 1, rows[0].length)
    .setFontWeight("bold")
    .setBackground("#e8eefc");
  sheet.getRange(2, 1)
    .setBackground(REGISTRATION_CONFIG.duplicateEmailRowColor)
    .setFontWeight("bold");
  sheet.getRange(2, 2, 1, rows[0].length - 1).setBackground("#fff7ed");
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, rows[0].length);

  return sheet;
}

function isHeaderRowMatch_(sheet, expectedHeaders) {
  const actual = sheet.getRange(1, 1, 1, expectedHeaders.length).getValues()[0];
  for (let i = 0; i < expectedHeaders.length; i++) {
    if (normalizeHeader_(actual[i]) !== normalizeHeader_(expectedHeaders[i])) {
      return false;
    }
  }
  return true;
}

function getRegistrationSourceSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  for (let i = 0; i < REGISTRATION_CONFIG.sourceSheetNameCandidates.length; i++) {
    const candidateName = REGISTRATION_CONFIG.sourceSheetNameCandidates[i];
    const candidateSheet = ss.getSheetByName(candidateName);
    if (candidateSheet && isRegistrationSourceSheet_(candidateSheet)) {
      return candidateSheet;
    }
  }

  const sheets = ss.getSheets();
  for (let j = 0; j < sheets.length; j++) {
    if (isRegistrationSourceSheet_(sheets[j])) {
      return sheets[j];
    }
  }

  throw new Error(
    "Could not find a source sheet with required columns: " +
    "Email address, Full Name, WhatsApp Number (Include country code)"
  );
}

function isRegistrationSourceSheet_(sheet) {
  if (!sheet || sheet.getLastRow() < 1) {
    return false;
  }
  try {
    getSourceColumnIndexes_(sheet);
    return true;
  } catch (err) {
    return false;
  }
}

function getSourceColumnIndexes_(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h || "").trim();
  });

  const emailIndex = findColumnIndexByCandidates_(headers, REGISTRATION_CONFIG.emailColumnCandidates);
  const fullNameIndex = findColumnIndexByCandidates_(headers, REGISTRATION_CONFIG.fullNameColumnCandidates);
  const phoneIndex = findColumnIndexByCandidates_(headers, REGISTRATION_CONFIG.phoneColumnCandidates);

  if (emailIndex === -1 || fullNameIndex === -1 || phoneIndex === -1) {
    throw new Error("Required columns not found in sheet: " + sheet.getName());
  }

  return {
    emailIndex: emailIndex,
    fullNameIndex: fullNameIndex,
    phoneIndex: phoneIndex
  };
}

function findColumnIndexByCandidates_(headers, candidates) {
  const normalizedHeaders = headers.map(function (h) { return normalizeHeader_(h); });
  for (let i = 0; i < candidates.length; i++) {
    const idx = normalizedHeaders.indexOf(normalizeHeader_(candidates[i]));
    if (idx !== -1) {
      return idx;
    }
  }
  return -1;
}

function getExistingMailSentEmails_(sheet) {
  const emails = {};
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return emails;
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < rows.length; i++) {
    const email = normalizeEmail_(rows[i][0]);
    if (!email) {
      continue;
    }
    emails[email] = true;
  }
  return emails;
}

function normalizeEmail_(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhone_(value) {
  return String(value || "").trim().replace(/\s+/g, "");
}

function normalizeHeader_(value) {
  return String(value || "").trim().toLowerCase();
}

function withScriptLock_(callback) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) {
    Logger.log("Skipped run: could not acquire script lock.");
    return;
  }

  try {
    callback();
  } finally {
    lock.releaseLock();
  }
}

function getScriptProperty_(name) {
  return PropertiesService.getScriptProperties().getProperty(name);
}

function getTestEmailRecipient_() {
  const saved = getScriptProperty_(REGISTRATION_CONFIG.testEmailProperty);
  if (saved && isValidEmail_(saved)) {
    return saved;
  }

  const userEmail = Session.getActiveUser().getEmail();
  if (userEmail && isValidEmail_(userEmail)) {
    return userEmail;
  }

  return REGISTRATION_CONFIG.defaultTestEmail;
}

function isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function logAndToast_(message) {
  Logger.log(message);
  try {
    SpreadsheetApp.getActive().toast(message, "AI Agents Automation", 5);
  } catch (err) {
    // Ignore toast failures in non-UI executions.
  }
}
