/**
 * AI Agents cohort acceptance payment confirmation automation.
 * Project: AI_Agents_Cohort_Acceptance
 */
const CONFIRMATION_CONFIG = {
  sourceSheetNameCandidates: ["Form responses 1", "Form_Responses", "Form Responses 1"],
  emailColumnCandidates: ["Email address", "Email Address", "Email", "email"],
  fullNameColumnCandidates: ["Full Name", "FullName", "Name"],
  paymentConfirmedColumn: "Payment Confirmed",
  emailStatusColumn: "Payment Confirmation Email Status",
  emailErrorColumn: "Payment Confirmation Email Error",
  emailSentAtColumn: "Payment Confirmation Email Sent At",
  senderName: "Behind the Data Academy",
  subject: "Payment Confirmed - Applied AI Development Bootcamp",
  defaultTestEmail: "mmesomakelvin@gmail.com",
  testEmailProperty: "PAYMENT_CONFIRMATION_TEST_EMAIL",
  triggerHandlerFunction: "handlePaymentConfirmedEdit",
  confirmedYesColor: "#dcfce7",
  confirmedNoColor: "#fee2e2",
  sentColor: "#dcfce7",
  failedColor: "#fee2e2",
  skippedColor: "#fef3c7"
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("AI Agents Cohort Acceptance")
    .addItem("Open Automation Buttons", "openAutomationButtons")
    .addSeparator()
    .addItem("Set Test Email Recipient", "setTestEmailRecipient")
    .addItem("Setup Payment Confirmation Automation", "setupPaymentConfirmationAutomation")
    .addItem("Preview Pending Confirmed Rows", "previewPendingConfirmedRows")
    .addItem("Send Test Payment Confirmation Email", "sendPaymentConfirmationTestEmail")
    .addItem("Send Payment Confirmation Emails (Pending)", "sendPaymentConfirmedEmails")
    .addSeparator()
    .addItem("Install Auto Trigger", "installPaymentConfirmationTrigger")
    .addItem("Clear Auto Trigger", "clearPaymentConfirmationTrigger")
    .addToUi();
}

function openAutomationButtons() {
  const html = HtmlService.createHtmlOutputFromFile("AutomationButtons")
    .setTitle("AI Agents Cohort Acceptance");
  SpreadsheetApp.getUi().showSidebar(html);
}

function setupPaymentConfirmationAutomation() {
  withScriptLock_(function () {
    const sheet = getConfirmationSourceSheet_();
    ensurePaymentConfirmationColumns_(sheet);
    installPaymentConfirmationTrigger();
    logAndToast_("Payment confirmation automation is ready on: " + sheet.getName());
  });
}

function installPaymentConfirmationTrigger() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const triggers = ScriptApp.getProjectTriggers();
  let exists = false;

  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === CONFIRMATION_CONFIG.triggerHandlerFunction) {
      exists = true;
      break;
    }
  }

  if (!exists) {
    ScriptApp.newTrigger(CONFIRMATION_CONFIG.triggerHandlerFunction)
      .forSpreadsheet(ss)
      .onEdit()
      .create();
    logAndToast_("Payment confirmation trigger installed.");
    return;
  }

  logAndToast_("Payment confirmation trigger already exists.");
}

function clearPaymentConfirmationTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;

  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === CONFIRMATION_CONFIG.triggerHandlerFunction) {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }

  logAndToast_("Removed payment confirmation triggers: " + removed);
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

  PropertiesService.getScriptProperties().setProperty(CONFIRMATION_CONFIG.testEmailProperty, email);
  logAndToast_("Test email recipient saved: " + email);
}

function saveTestEmailRecipient(email) {
  const clean = String(email || "").trim().toLowerCase();
  if (!isValidEmail_(clean)) {
    throw new Error("Please enter a valid email address.");
  }

  PropertiesService.getScriptProperties().setProperty(CONFIRMATION_CONFIG.testEmailProperty, clean);
  logAndToast_("Test email recipient saved: " + clean);
  return clean;
}

function sendPaymentConfirmationTestEmail() {
  const testEmail = getTestEmailRecipient_();

  GmailApp.sendEmail(
    testEmail,
    "[TEST] " + CONFIRMATION_CONFIG.subject,
    getPaymentConfirmationEmailPlainText("Accepted Fellow"),
    {
      htmlBody: getPaymentConfirmationEmailHtml("Accepted Fellow"),
      name: CONFIRMATION_CONFIG.senderName
    }
  );

  logAndToast_("Payment confirmation test email sent to: " + testEmail);
}

function previewPendingConfirmedRows() {
  const sheet = getConfirmationSourceSheet_();
  const helperInfo = ensurePaymentConfirmationColumns_(sheet);
  const columns = getConfirmationSourceColumnIndexes_(helperInfo.headers);
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    logAndToast_("No response rows found in source sheet.");
    return;
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  let eligible = 0;
  const sample = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const email = normalizeEmail_(row[columns.emailIndex]);
    const paymentConfirmed = normalizeYesNo_(row[helperInfo.confirmedIndex]);
    const currentStatus = normalizeTrackingStatus_(row[helperInfo.emailStatusIndex]);
    if (!email || paymentConfirmed !== "yes" || currentStatus === "sent") {
      continue;
    }

    eligible++;
    if (sample.length < 10) {
      sample.push(String(i + 2));
    }
  }

  Logger.log("Pending confirmed rows: " + eligible);
  Logger.log("Sample row numbers: " + sample.join(", "));
  logAndToast_(
    "Pending confirmed rows: " + eligible +
    (sample.length ? " | Sample rows: " + sample.join(", ") : "")
  );
}

function sendPaymentConfirmedEmails() {
  withScriptLock_(function () {
    const sheet = getConfirmationSourceSheet_();
    const helperInfo = ensurePaymentConfirmationColumns_(sheet);
    const columns = getConfirmationSourceColumnIndexes_(helperInfo.headers);
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      logAndToast_("No response rows found in source sheet.");
      return;
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
      const result = processPaymentConfirmationRow_(sheet, rowNumber, columns, helperInfo);
      if (result === "sent") {
        sent++;
      } else if (result === "failed") {
        failed++;
      } else {
        skipped++;
      }
    }

    logAndToast_(
      "Payment confirmation run complete. Sent: " + sent +
      ", Failed: " + failed +
      ", Skipped: " + skipped
    );
  });
}

function handlePaymentConfirmedEdit(e) {
  if (!e || !e.range) {
    Logger.log("Payment confirmation edit event did not include a range.");
    return;
  }

  withScriptLock_(function () {
    const sheet = e.range.getSheet();
    if (!isConfirmationSourceSheet_(sheet)) {
      return;
    }

    const helperInfo = ensurePaymentConfirmationColumns_(sheet);
    const confirmedColumnNumber = helperInfo.confirmedIndex + 1;
    const editStartColumn = e.range.getColumn();
    const editEndColumn = e.range.getLastColumn();

    if (confirmedColumnNumber < editStartColumn || confirmedColumnNumber > editEndColumn) {
      return;
    }

    const columns = getConfirmationSourceColumnIndexes_(helperInfo.headers);
    const startRow = Math.max(e.range.getRow(), 2);
    const endRow = e.range.getLastRow();

    for (let rowNumber = startRow; rowNumber <= endRow; rowNumber++) {
      processPaymentConfirmationRow_(sheet, rowNumber, columns, helperInfo);
    }
  });
}

function processPaymentConfirmationRow_(sheet, rowNumber, columns, helperInfo) {
  const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  const email = normalizeEmail_(row[columns.emailIndex]);
  const fullName = String(row[columns.fullNameIndex] || "").trim();
  const paymentConfirmed = normalizeYesNo_(row[helperInfo.confirmedIndex]);
  const currentStatus = normalizeTrackingStatus_(row[helperInfo.emailStatusIndex]);

  updatePaymentConfirmedCellStyle_(sheet, rowNumber, helperInfo, paymentConfirmed);

  if (paymentConfirmed !== "yes") {
    return "skipped";
  }

  if (!email) {
    setPaymentConfirmationTracking_(sheet, rowNumber, helperInfo, "Skipped - No Email", "", "");
    return "skipped";
  }

  if (currentStatus === "sent") {
    return "skipped";
  }

  try {
    GmailApp.sendEmail(
      email,
      CONFIRMATION_CONFIG.subject,
      getPaymentConfirmationEmailPlainText(fullName),
      {
        htmlBody: getPaymentConfirmationEmailHtml(fullName),
        name: CONFIRMATION_CONFIG.senderName
      }
    );

    setPaymentConfirmationTracking_(sheet, rowNumber, helperInfo, "Sent", "", new Date());
    Utilities.sleep(200);
    return "sent";
  } catch (err) {
    setPaymentConfirmationTracking_(sheet, rowNumber, helperInfo, "Failed", String(err), "");
    return "failed";
  }
}

function ensurePaymentConfirmationColumns_(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (header) {
    return String(header || "").trim();
  });
  const workingHeaders = headers.slice();

  let confirmedIndex = findExactHeaderIndex_(workingHeaders, CONFIRMATION_CONFIG.paymentConfirmedColumn);
  if (confirmedIndex === -1) {
    confirmedIndex = appendHeaderColumn_(sheet, workingHeaders, CONFIRMATION_CONFIG.paymentConfirmedColumn);
  }

  let emailStatusIndex = findExactHeaderIndex_(workingHeaders, CONFIRMATION_CONFIG.emailStatusColumn);
  if (emailStatusIndex === -1) {
    emailStatusIndex = appendHeaderColumn_(sheet, workingHeaders, CONFIRMATION_CONFIG.emailStatusColumn);
  }

  let emailErrorIndex = findExactHeaderIndex_(workingHeaders, CONFIRMATION_CONFIG.emailErrorColumn);
  if (emailErrorIndex === -1) {
    emailErrorIndex = appendHeaderColumn_(sheet, workingHeaders, CONFIRMATION_CONFIG.emailErrorColumn);
  }

  let emailSentAtIndex = findExactHeaderIndex_(workingHeaders, CONFIRMATION_CONFIG.emailSentAtColumn);
  if (emailSentAtIndex === -1) {
    emailSentAtIndex = appendHeaderColumn_(sheet, workingHeaders, CONFIRMATION_CONFIG.emailSentAtColumn);
  }

  styleConfirmationHelperHeaders_(sheet, [
    confirmedIndex + 1,
    emailStatusIndex + 1,
    emailErrorIndex + 1,
    emailSentAtIndex + 1
  ]);
  applyPaymentConfirmedValidation_(sheet, confirmedIndex + 1);

  return {
    headers: workingHeaders,
    confirmedIndex: confirmedIndex,
    emailStatusIndex: emailStatusIndex,
    emailErrorIndex: emailErrorIndex,
    emailSentAtIndex: emailSentAtIndex
  };
}

function styleConfirmationHelperHeaders_(sheet, columnNumbers) {
  for (let i = 0; i < columnNumbers.length; i++) {
    sheet.getRange(1, columnNumbers[i])
      .setFontWeight("bold")
      .setBackground("#e8eefc");
  }

  if (columnNumbers.length >= 4) {
    sheet.setColumnWidth(columnNumbers[0], 150);
    sheet.setColumnWidth(columnNumbers[1], 220);
    sheet.setColumnWidth(columnNumbers[2], 280);
    sheet.setColumnWidth(columnNumbers[3], 180);
  }
}

function applyPaymentConfirmedValidation_(sheet, columnNumber) {
  const rowCount = Math.max(sheet.getMaxRows() - 1, 1);
  const range = sheet.getRange(2, columnNumber, rowCount, 1);
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Yes", "No"], true)
    .setAllowInvalid(false)
    .build();

  range.setDataValidation(rule);
}

function setPaymentConfirmationTracking_(sheet, rowNumber, helperInfo, status, error, sentAt) {
  const statusCell = sheet.getRange(rowNumber, helperInfo.emailStatusIndex + 1);
  const errorCell = sheet.getRange(rowNumber, helperInfo.emailErrorIndex + 1);
  const sentAtCell = sheet.getRange(rowNumber, helperInfo.emailSentAtIndex + 1);

  statusCell.setValue(status);
  errorCell.setValue(truncateTrackingError_(error));
  sentAtCell.setValue(sentAt || "");

  const normalizedStatus = normalizeTrackingStatus_(status);
  if (normalizedStatus === "sent") {
    statusCell.setBackground(CONFIRMATION_CONFIG.sentColor);
  } else if (normalizedStatus === "failed") {
    statusCell.setBackground(CONFIRMATION_CONFIG.failedColor);
  } else if (normalizedStatus.indexOf("skipped") === 0) {
    statusCell.setBackground(CONFIRMATION_CONFIG.skippedColor);
  } else {
    statusCell.setBackground(null);
  }
}

function updatePaymentConfirmedCellStyle_(sheet, rowNumber, helperInfo, paymentConfirmed) {
  const cell = sheet.getRange(rowNumber, helperInfo.confirmedIndex + 1);

  if (paymentConfirmed === "yes") {
    cell.setBackground(CONFIRMATION_CONFIG.confirmedYesColor);
    return;
  }

  if (paymentConfirmed === "no") {
    cell.setBackground(CONFIRMATION_CONFIG.confirmedNoColor);
    return;
  }

  cell.setBackground(null);
}

function getConfirmationSourceSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  for (let i = 0; i < CONFIRMATION_CONFIG.sourceSheetNameCandidates.length; i++) {
    const candidateName = CONFIRMATION_CONFIG.sourceSheetNameCandidates[i];
    const sheet = ss.getSheetByName(candidateName);
    if (sheet && isConfirmationSourceSheet_(sheet)) {
      return sheet;
    }
  }

  const activeSheet = ss.getActiveSheet();
  if (activeSheet && isConfirmationSourceSheet_(activeSheet)) {
    return activeSheet;
  }

  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (isConfirmationSourceSheet_(sheets[i])) {
      return sheets[i];
    }
  }

  throw new Error("Could not find the cohort acceptance responses sheet.");
}

function isConfirmationSourceSheet_(sheet) {
  if (!sheet || sheet.getLastRow() < 1) {
    return false;
  }

  try {
    const lastCol = Math.max(sheet.getLastColumn(), 1);
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (header) {
      return String(header || "").trim();
    });
    getConfirmationSourceColumnIndexes_(headers);
    return true;
  } catch (err) {
    return false;
  }
}

function getConfirmationSourceColumnIndexes_(headers) {
  const emailIndex = findColumnIndexByCandidates_(headers, CONFIRMATION_CONFIG.emailColumnCandidates);
  const fullNameIndex = findColumnIndexByCandidates_(headers, CONFIRMATION_CONFIG.fullNameColumnCandidates);

  if (emailIndex === -1 || fullNameIndex === -1) {
    throw new Error("Required columns not found: Email address and Full Name.");
  }

  return {
    emailIndex: emailIndex,
    fullNameIndex: fullNameIndex
  };
}

function appendHeaderColumn_(sheet, headers, label) {
  headers.push(label);
  const index = headers.length - 1;
  sheet.getRange(1, index + 1).setValue(label);
  return index;
}

function findColumnIndexByCandidates_(headers, candidates) {
  for (let i = 0; i < candidates.length; i++) {
    const idx = findExactHeaderIndex_(headers, candidates[i]);
    if (idx !== -1) {
      return idx;
    }
  }
  return -1;
}

function findExactHeaderIndex_(headers, label) {
  const target = normalizeHeader_(label);
  for (let i = 0; i < headers.length; i++) {
    if (normalizeHeader_(headers[i]) === target) {
      return i;
    }
  }
  return -1;
}

function normalizeEmail_(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeYesNo_(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeHeader_(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeTrackingStatus_(value) {
  return String(value || "").trim().toLowerCase();
}

function truncateTrackingError_(value) {
  return String(value || "").slice(0, 500);
}

function getScriptProperty_(name) {
  return PropertiesService.getScriptProperties().getProperty(name);
}

function getTestEmailRecipient_() {
  const saved = getScriptProperty_(CONFIRMATION_CONFIG.testEmailProperty);
  if (saved && isValidEmail_(saved)) {
    return saved;
  }

  const userEmail = Session.getActiveUser().getEmail();
  if (userEmail && isValidEmail_(userEmail)) {
    return userEmail;
  }

  return CONFIRMATION_CONFIG.defaultTestEmail;
}

function isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
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

function logAndToast_(message) {
  Logger.log(message);
  try {
    SpreadsheetApp.getActive().toast(message, "AI Agents Cohort Acceptance", 5);
  } catch (err) {
    // Ignore toast failures in non-UI executions.
  }
}
