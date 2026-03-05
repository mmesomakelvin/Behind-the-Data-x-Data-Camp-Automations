/**
 * Registration notification automation.
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
  whatsappColumnCandidates: [
    "WhatsApp Number (Include country code)",
    "WhatsApp Number",
    "Whatsapp Number",
    "Phone Number",
    "Phone"
  ],
  senderName: "Behind the Data Academy",
  emailSubject: "Thank You for Registering - Behind the Data Academy",
  triggerHandlerFunction: "handleRegistrationSubmit",
  defaultTestEmail: "mmesomakelvin@gmail.com"
};

const WHATSAPP_CONFIG = {
  apiUrlProperty: "WHATSAPP_API_URL",
  apiTokenProperty: "WHATSAPP_API_TOKEN"
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Registration Automation")
    .addItem("Setup Automation + Trigger", "setupRegistrationAutomation")
    .addItem("Process Existing Rows", "processExistingRegistrations")
    .addItem("Send Test Email", "sendRegistrationTestEmail")
    .addItem("Install Auto Trigger", "installRegistrationTrigger")
    .addItem("Clear Auto Trigger", "clearRegistrationTrigger")
    .addToUi();
}

function setupRegistrationAutomation() {
  const sourceSheet = getRegistrationSourceSheet_();
  ensureMailSentSheet_();
  installRegistrationTrigger();
  Logger.log("Setup complete. Source sheet: " + sourceSheet.getName());
}

function installRegistrationTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === REGISTRATION_CONFIG.triggerHandlerFunction) {
      Logger.log("Auto trigger already exists.");
      return;
    }
  }

  ScriptApp.newTrigger(REGISTRATION_CONFIG.triggerHandlerFunction)
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onFormSubmit()
    .create();

  Logger.log("Auto trigger installed for new form registrations.");
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

  Logger.log("Removed registration triggers: " + removed);
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
      Logger.log("No registration rows found in source sheet.");
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

    Logger.log(
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
    getRegistrationEmailPlainText_("Test User"),
    {
      htmlBody: getRegistrationEmailHtml_("Test User"),
      name: REGISTRATION_CONFIG.senderName
    }
  );

  Logger.log("Test email sent to: " + testEmail);
}

function processRow_(sourceSheet, mailSheet, columns, rowNumber, existingKeys) {
  const row = sourceSheet.getRange(rowNumber, 1, 1, sourceSheet.getLastColumn()).getValues()[0];
  const email = normalizeEmail_(row[columns.emailIndex]);
  const fullName = String(row[columns.fullNameIndex] || "").trim();
  const whatsappNumber = normalizeWhatsapp_(row[columns.whatsappIndex]);

  if (!email) {
    return { status: "skipped", message: "Missing email" };
  }

  const mailKey = buildMailKey_(email, fullName, whatsappNumber);
  if (existingKeys[mailKey]) {
    return { status: "skipped", message: "Already logged in Mail sent" };
  }

  try {
    sendRegistrationEmail_(email, fullName);
    const whatsappStatus = sendWhatsappIfConfigured_(whatsappNumber, fullName, email);
    appendMailSentRow_(mailSheet, email, fullName, whatsappNumber, whatsappStatus);
    existingKeys[mailKey] = true;
    return { status: "sent", message: whatsappStatus };
  } catch (err) {
    return { status: "failed", message: String(err) };
  }
}

function sendRegistrationEmail_(email, fullName) {
  GmailApp.sendEmail(
    email,
    REGISTRATION_CONFIG.emailSubject,
    getRegistrationEmailPlainText_(fullName),
    {
      htmlBody: getRegistrationEmailHtml_(fullName),
      name: REGISTRATION_CONFIG.senderName
    }
  );
}

function sendWhatsappIfConfigured_(whatsappNumber, fullName, email) {
  if (!whatsappNumber) {
    return "Email Sent | WhatsApp Skipped - No Number";
  }

  const apiUrl = getScriptProperty_(WHATSAPP_CONFIG.apiUrlProperty);
  if (!apiUrl) {
    return "Email Sent | WhatsApp Skipped - API Not Configured";
  }

  const apiToken = getScriptProperty_(WHATSAPP_CONFIG.apiTokenProperty);
  const payload = {
    to: whatsappNumber,
    message: getWhatsappMessage_(fullName),
    fullName: fullName,
    email: email
  };

  const requestOptions = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  if (apiToken) {
    requestOptions.headers = { Authorization: "Bearer " + apiToken };
  }

  try {
    const response = UrlFetchApp.fetch(apiUrl, requestOptions);
    const responseCode = response.getResponseCode();
    if (responseCode >= 300) {
      return "Email Sent | WhatsApp Failed (" + responseCode + ")";
    }
    return "Email Sent | WhatsApp Sent";
  } catch (err) {
    return "Email Sent | WhatsApp Failed";
  }
}

function appendMailSentRow_(sheet, email, fullName, whatsappNumber, status) {
  sheet.appendRow([email, fullName, whatsappNumber, status]);
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
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
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
  const whatsappIndex = findColumnIndexByCandidates_(headers, REGISTRATION_CONFIG.whatsappColumnCandidates);

  if (emailIndex === -1 || fullNameIndex === -1 || whatsappIndex === -1) {
    throw new Error("Required columns not found in sheet: " + sheet.getName());
  }

  return {
    emailIndex: emailIndex,
    fullNameIndex: fullNameIndex,
    whatsappIndex: whatsappIndex
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
    const whatsapp = normalizeWhatsapp_(rows[i][2]);
    if (!email) {
      continue;
    }
    keys[buildMailKey_(email, fullName, whatsapp)] = true;
  }
  return keys;
}

function buildMailKey_(email, fullName, whatsappNumber) {
  return [
    normalizeEmail_(email),
    normalizeHeader_(fullName),
    normalizeWhatsapp_(whatsappNumber)
  ].join("|");
}

function normalizeEmail_(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeWhatsapp_(value) {
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

function getRegistrationEmailPlainText_(fullName) {
  const firstName = getFirstName_(fullName);
  return (
    "Hello " + firstName + ",\n\n" +
    "Thank you for registering with Behind the Data Academy.\n" +
    "This is a confirmation that we received your registration details.\n\n" +
    "We will share the next update with you shortly.\n\n" +
    "Best regards,\n" +
    "Behind the Data Academy"
  );
}

function getRegistrationEmailHtml_(fullName) {
  const firstName = escapeHtml_(getFirstName_(fullName));
  return (
    "<div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#1f2937;max-width:640px;\">" +
      "<h2 style=\"margin:0 0 12px 0;\">Hello " + firstName + ",</h2>" +
      "<p>Thank you for registering with <strong>Behind the Data Academy</strong>.</p>" +
      "<p>This is a confirmation that we received your registration details.</p>" +
      "<p>We will share the next update with you shortly.</p>" +
      "<p style=\"margin-top:20px;\">Best regards,<br/>Behind the Data Academy</p>" +
    "</div>"
  );
}

function getWhatsappMessage_(fullName) {
  const firstName = getFirstName_(fullName);
  return (
    "Hello " + firstName + ", thanks for registering with Behind the Data Academy. " +
    "We have received your details and will share the next update shortly."
  );
}

function getFirstName_(fullName) {
  const clean = String(fullName || "").trim();
  if (!clean) {
    return "there";
  }
  return clean.split(/\s+/)[0];
}

function escapeHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
