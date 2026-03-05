/**
 * AI Agents registration automation.
 * Project: AI_Agent_Automation
 */
const REGISTRATION_CONFIG = {
  sourceSheetNameCandidates: ["Form responses 1", "Form Responses 1", "Form_Responses"],
  mailSentSheetName: "Mail sent",
  mailSentHeaders: [
    "Email address",
    "Full Name",
    "WhatsApp Number (Include country code)",
    "Status"
  ],
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
  emailSubject: "You are Accepted: Applied AI Development Bootcamp Scholarship",
  triggerHandlerFunction: "handleRegistrationSubmit",
  defaultTestEmail: "mmesomakelvin@gmail.com",
  phoneWebhookUrlProperty: "PHONE_WEBHOOK_URL",
  phoneWebhookTokenProperty: "PHONE_WEBHOOK_TOKEN"
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("AI Agents Automation")
    .addItem("Open Automation Buttons", "openAutomationButtons")
    .addSeparator()
    .addItem("Setup Automation + Trigger", "setupRegistrationAutomation")
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
  installRegistrationTrigger();
  logAndToast_("Setup complete. Source sheet: " + sourceSheet.getName());
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

    const mailSheet = ensureMailSentSheet_();
    const columns = getSourceColumnIndexes_(sheet);
    const existingKeys = getExistingMailSentKeys_(mailSheet);
    const result = processRow_(sheet, mailSheet, columns, e.range.getRow(), existingKeys);
    Logger.log("Processed form-submit row " + e.range.getRow() + ": " + result.status + " - " + result.message);
  });
}

function processExistingRegistrations() {
  withScriptLock_(function () {
    const sheet = getRegistrationSourceSheet_();
    const mailSheet = ensureMailSentSheet_();
    const columns = getSourceColumnIndexes_(sheet);
    const existingKeys = getExistingMailSentKeys_(mailSheet);
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      logAndToast_("No registration rows found in source sheet.");
      return;
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (let row = 2; row <= lastRow; row++) {
      const result = processRow_(sheet, mailSheet, columns, row, existingKeys);
      if (result.status === "sent") {
        sent++;
      } else if (result.status === "failed") {
        failed++;
      } else {
        skipped++;
      }
    }

    logAndToast_(
      "Existing-row run complete. Sent: " + sent +
      ", Failed: " + failed +
      ", Skipped: " + skipped
    );
  });
}

function sendRegistrationTestEmail() {
  let testEmail = Session.getActiveUser().getEmail();
  if (!testEmail) {
    testEmail = REGISTRATION_CONFIG.defaultTestEmail;
  }

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

function processRow_(sourceSheet, mailSheet, columns, rowNumber, existingKeys) {
  const row = sourceSheet.getRange(rowNumber, 1, 1, sourceSheet.getLastColumn()).getValues()[0];
  const email = normalizeEmail_(row[columns.emailIndex]);
  const fullName = String(row[columns.fullNameIndex] || "").trim();
  const phoneNumber = normalizePhone_(row[columns.phoneIndex]);

  if (!email) {
    return { status: "skipped", message: "Missing email" };
  }

  const mailKey = buildMailKey_(email, fullName, phoneNumber);
  if (existingKeys[mailKey]) {
    return { status: "skipped", message: "Already logged in Mail sent" };
  }

  try {
    sendAcceptanceEmail_(email, fullName);
    const phoneResult = sendPhoneNotificationIfConfigured_(phoneNumber, fullName, email);
    const statusText = buildStatusText_(phoneResult);
    appendMailSentRow_(mailSheet, email, fullName, phoneNumber, statusText);
    existingKeys[mailKey] = true;
    return { status: "sent", message: statusText };
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

function sendPhoneNotificationIfConfigured_(phoneNumber, fullName, email) {
  if (!phoneNumber) {
    return { code: "no_phone" };
  }

  const webhookUrl = getScriptProperty_(REGISTRATION_CONFIG.phoneWebhookUrlProperty);
  if (!webhookUrl) {
    return { code: "no_webhook" };
  }

  const webhookToken = getScriptProperty_(REGISTRATION_CONFIG.phoneWebhookTokenProperty);
  const payload = {
    to: phoneNumber,
    fullName: fullName,
    email: email,
    message: getAiAgentsPhoneMessage(fullName)
  };

  const requestOptions = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  if (webhookToken) {
    requestOptions.headers = { Authorization: "Bearer " + webhookToken };
  }

  try {
    const response = UrlFetchApp.fetch(webhookUrl, requestOptions);
    const code = response.getResponseCode();
    if (code >= 200 && code < 300) {
      return { code: "sent" };
    }
    return { code: "failed", detail: "HTTP " + code };
  } catch (err) {
    return { code: "failed", detail: String(err) };
  }
}

function buildStatusText_(phoneResult) {
  if (phoneResult.code === "sent") {
    return "Email Sent | Phone Sent";
  }
  if (phoneResult.code === "no_phone") {
    return "Email Sent | No Phone Number";
  }
  if (phoneResult.code === "no_webhook") {
    return "Email Sent | Phone Pending Setup";
  }
  return "Email Sent | Phone Failed";
}

function appendMailSentRow_(sheet, email, fullName, phoneNumber, status) {
  sheet.appendRow([email, fullName, phoneNumber, status]);
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

function getExistingMailSentKeys_(sheet) {
  const keys = {};
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return keys;
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  for (let i = 0; i < rows.length; i++) {
    const email = normalizeEmail_(rows[i][0]);
    const fullName = String(rows[i][1] || "").trim();
    const phone = normalizePhone_(rows[i][2]);
    if (!email) {
      continue;
    }
    keys[buildMailKey_(email, fullName, phone)] = true;
  }
  return keys;
}

function buildMailKey_(email, fullName, phoneNumber) {
  return [
    normalizeEmail_(email),
    normalizeHeader_(fullName),
    normalizePhone_(phoneNumber)
  ].join("|");
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

function logAndToast_(message) {
  Logger.log(message);
  try {
    SpreadsheetApp.getActive().toast(message, "AI Agents Automation", 5);
  } catch (err) {
    // Ignore toast failures in non-UI executions.
  }
}
