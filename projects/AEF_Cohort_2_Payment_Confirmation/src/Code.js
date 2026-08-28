/**
 * Analytics Engineering Fellowship Cohort 2 payment confirmation automation.
 */
var AEF_PAYMENT_CONFIG = {
  spreadsheetId: "10v2U9Sn6JpcPP3Zr1d_z46s7PIuuJQlgjj7VY2mb0Y4",
  sourceSheetNameCandidates: ["Form_Responses"],
  timestampColumnCandidates: ["Timestamp"],
  accountNumberColumnCandidates: ["Account Number"],
  emailColumnCandidates: ["Email address", "Email Address", "Email", "email"],
  fullNameColumnCandidates: ["Full Name", "FullName", "Name"],
  paymentConfirmedColumn: "Payment Confirmed",
  emailStatusColumn: "Payment Confirmation Email Status",
  emailErrorColumn: "Payment Confirmation Email Error",
  emailSentAtColumn: "Payment Confirmation Email Sent At",
  senderName: "Behind the Data Academy",
  subject: "Payment Confirmed - Analytics Engineering Fellowship Cohort 2",
  testEmailProperty: "AEF_COHORT_2_PAYMENT_TEST_EMAIL",
  editHandler: "handleAefPaymentConfirmedEdit",
  retryHandler: "processQueuedAefPaymentConfirmations",
  retryPropertyPrefix: "AEF_PAYMENT_RETRY_",
  confirmedYesColor: "#dcfce7",
  confirmedNoColor: "#fee2e2",
  sentColor: "#dcfce7",
  failedColor: "#fee2e2",
  skippedColor: "#fef3c7"
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("AEF Cohort 2 Payment Confirmation")
    .addItem("Open Automation Buttons", "openAefPaymentAutomationButtons")
    .addSeparator()
    .addItem("Setup Payment Confirmation Automation", "setupAefPaymentConfirmationAutomation")
    .addItem("Set Test Email Recipient", "setAefPaymentTestEmailRecipient")
    .addItem("Preview Payment Confirmation Email", "previewAefPaymentConfirmationEmail")
    .addItem("Send Test Payment Confirmation Email", "sendAefPaymentConfirmationTestEmail")
    .addItem("Preview Pending Confirmed Rows", "previewPendingAefPaymentRows")
    .addItem("Send Payment Confirmation Emails (Pending)", "sendPendingAefPaymentConfirmations")
    .addSeparator()
    .addItem("Install Auto Trigger", "installAefPaymentConfirmationTriggers")
    .addItem("Clear Auto Trigger", "clearAefPaymentConfirmationTriggers")
    .addToUi();
}

function openAefPaymentAutomationButtons() {
  const html = HtmlService.createHtmlOutputFromFile("AutomationButtons")
    .setTitle("AEF Cohort 2 Payment Confirmation");
  SpreadsheetApp.getUi().showSidebar(html);
}

function setupAefPaymentConfirmationAutomation() {
  return withAefPaymentScriptLock_(function () {
    const sheet = getAefPaymentSourceSheet_();
    ensureAefPaymentConfirmationColumns_(sheet);
    installAefPaymentConfirmationTriggers_();
    return logAndToastAefPayment_(
      "Payment confirmation automation is ready on: " + sheet.getName()
    );
  });
}

function installAefPaymentConfirmationTriggers() {
  return withAefPaymentScriptLock_(installAefPaymentConfirmationTriggers_);
}

function installAefPaymentConfirmationTriggers_() {
  const editState = ensureAefPaymentTrigger_(
    AEF_PAYMENT_CONFIG.editHandler,
    ScriptApp.EventType.ON_EDIT
  );
  const retryState = ensureAefPaymentTrigger_(
    AEF_PAYMENT_CONFIG.retryHandler,
    ScriptApp.EventType.CLOCK
  );
  return logAndToastAefPayment_(
    "Payment edit trigger " + editState.state +
    ". Safe retry trigger " + retryState.state +
    ". Extra triggers removed: " + (editState.removed + retryState.removed)
  );
}

function ensureAefPaymentTrigger_(handler, eventType) {
  const triggers = ScriptApp.getProjectTriggers();
  let keeperFound = false;
  let removed = 0;

  if (eventType === ScriptApp.EventType.CLOCK) {
    triggers.forEach(function (trigger) {
      if (trigger.getHandlerFunction() !== handler) return;
      ScriptApp.deleteTrigger(trigger);
      removed++;
    });
    ScriptApp.newTrigger(handler).timeBased().everyMinutes(5).create();
    return { state: removed ? "refreshed" : "installed", removed: removed };
  }

  triggers.forEach(function (trigger) {
    if (trigger.getHandlerFunction() !== handler) return;
    if (isMatchingAefPaymentTrigger_(trigger, handler, eventType) && !keeperFound) {
      keeperFound = true;
      return;
    }
    ScriptApp.deleteTrigger(trigger);
    removed++;
  });

  if (!keeperFound) {
    ScriptApp.newTrigger(handler)
      .forSpreadsheet(getAefPaymentSpreadsheet_())
      .onEdit()
      .create();
  }

  return { state: keeperFound ? "already existed" : "installed", removed: removed };
}

function isMatchingAefPaymentTrigger_(trigger, handler, eventType) {
  try {
    if (
      !trigger ||
      trigger.getHandlerFunction() !== handler ||
      trigger.getEventType() !== eventType
    ) {
      return false;
    }
    if (eventType === ScriptApp.EventType.CLOCK) return true;
    return (
      trigger.getTriggerSource() === ScriptApp.TriggerSource.SPREADSHEETS &&
      trigger.getTriggerSourceId() === AEF_PAYMENT_CONFIG.spreadsheetId
    );
  } catch (error) {
    return false;
  }
}

function clearAefPaymentConfirmationTriggers() {
  return withAefPaymentScriptLock_(clearAefPaymentConfirmationTriggers_);
}

function clearAefPaymentConfirmationTriggers_() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;
  triggers.forEach(function (trigger) {
    const handler = trigger.getHandlerFunction();
    if (handler === AEF_PAYMENT_CONFIG.editHandler || handler === AEF_PAYMENT_CONFIG.retryHandler) {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });
  const queuedRemoved = clearAefPaymentRetryQueue_();
  return logAndToastAefPayment_(
    "Removed payment triggers: " + removed +
    ". Cleared waiting payment emails: " + queuedRemoved
  );
}

function clearAefPaymentRetryQueue_() {
  const properties = PropertiesService.getScriptProperties();
  const allProperties = properties.getProperties();
  let removed = 0;
  Object.keys(allProperties).forEach(function (key) {
    if (key.indexOf(AEF_PAYMENT_CONFIG.retryPropertyPrefix) !== 0) return;
    properties.deleteProperty(key);
    removed++;
  });
  return removed;
}

function setAefPaymentTestEmailRecipient() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    "Set Test Email Recipient",
    "Enter the email address that should receive test emails.",
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;
  const email = saveAefPaymentTestEmailRecipient(response.getResponseText());
  ui.alert("Test email recipient saved: " + email);
}

function saveAefPaymentTestEmailRecipient(email) {
  const clean = normalizeAefPaymentEmail_(email);
  if (!isValidAefPaymentEmail_(clean)) {
    throw new Error("Please enter a valid test email address.");
  }
  PropertiesService.getScriptProperties().setProperty(
    AEF_PAYMENT_CONFIG.testEmailProperty,
    clean
  );
  return clean;
}

function previewAefPaymentConfirmationEmail() {
  const html = HtmlService.createHtmlOutput(
    getAefPaymentConfirmationEmailHtml("Accepted Fellow")
  ).setWidth(720).setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, "AEF Cohort 2 Payment Confirmation Email");
}

function sendAefPaymentConfirmationTestEmail() {
  const recipient = getAefPaymentTestEmailRecipient_();
  GmailApp.sendEmail(
    recipient,
    "[TEST] " + AEF_PAYMENT_CONFIG.subject,
    getAefPaymentConfirmationEmailPlainText("Accepted Fellow"),
    {
      htmlBody: getAefPaymentConfirmationEmailHtml("Accepted Fellow"),
      name: AEF_PAYMENT_CONFIG.senderName
    }
  );
  return logAndToastAefPayment_("Test payment email sent to: " + recipient);
}

function previewPendingAefPaymentRows() {
  const sheet = getAefPaymentSourceSheet_();
  const pendingRows = getPendingAefPaymentRowNumbers_(sheet);
  const sampleRows = pendingRows.slice(0, 10);
  return logAndToastAefPayment_(
    "Pending confirmed rows: " + pendingRows.length +
    (sampleRows.length ? " | Sample rows: " + sampleRows.join(", ") : "")
  );
}

function sendPendingAefPaymentConfirmations() {
  const sheet = getAefPaymentSourceSheet_();
  const pendingRows = getPendingAefPaymentRowNumbers_(sheet);
  if (!pendingRows.length) {
    return logAndToastAefPayment_("No confirmed payment emails are waiting to be sent.");
  }
  const ui = SpreadsheetApp.getUi();
  const answer = ui.alert(
    "Send payment confirmation emails?",
    "This will send " + pendingRows.length +
      " live email(s). Already-sent and duplicate recipients will be skipped.",
    ui.ButtonSet.YES_NO
  );
  if (answer !== ui.Button.YES) {
    return logAndToastAefPayment_("Payment confirmation sending was cancelled.");
  }

  const columns = getAefPaymentColumnIndexes_(getAefPaymentHeaders_(sheet));
  const rows = getAefPaymentRows_(sheet);
  const confirmedApplicantKeys = pendingRows.map(function (rowNumber) {
    return getAefPaymentApplicantKey_(rows[rowNumber - 2], columns);
  });
  return withAefPaymentScriptLock_(function () {
    const currentSheet = getAefPaymentSourceSheet_();
    const summary = processCurrentAefPaymentApplicants_(
      currentSheet,
      confirmedApplicantKeys
    );
    return logAndToastAefPayment_(
      "Payment confirmation run complete. Sent: " + summary.sent +
      ", Failed: " + summary.failed +
      ", Needs review: " + summary.review +
      ", Skipped: " + summary.skipped
    );
  });
}

function getPendingAefPaymentRowNumbers_(sheet) {
  const columns = getAefPaymentColumnIndexes_(getAefPaymentHeaders_(sheet));
  const rows = getAefPaymentRows_(sheet);
  const reservedEmails = getAefPaymentReservedEmailSet_(rows, columns);
  const pendingRows = [];

  rows.forEach(function (row, index) {
    const confirmed = normalizeAefPaymentValue_(row[columns.confirmedIndex]);
    const status = normalizeAefPaymentValue_(row[columns.statusIndex]);
    const email = normalizeAefPaymentEmail_(row[columns.emailIndex]);
    if (
      confirmed !== "yes" ||
      status === "sent" ||
      status === "sending" ||
      !isValidAefPaymentEmail_(email) ||
      reservedEmails[email]
    ) {
      return;
    }
    pendingRows.push(index + 2);
    reservedEmails[email] = true;
  });
  return pendingRows;
}

function handleAefPaymentConfirmedEdit(e) {
  if (!e || !e.range) {
    Logger.log("Payment confirmation edit event did not include a range.");
    return;
  }
  const sheet = e.range.getSheet();
  if (!isAefPaymentSourceSheet_(sheet)) return;

  const columns = getAefPaymentColumnIndexes_(getAefPaymentHeaders_(sheet));
  const confirmedColumn = columns.confirmedIndex + 1;
  const firstColumn = e.range.getColumn();
  const lastColumn = firstColumn + e.range.getNumColumns() - 1;
  if (confirmedColumn < firstColumn || confirmedColumn > lastColumn) return;
  if (
    e.range.getNumRows() === 1 &&
    e.range.getNumColumns() === 1 &&
    normalizeAefPaymentValue_(e.value) !== "yes"
  ) {
    return;
  }

  const firstRow = Math.max(e.range.getRow(), 2);
  const lastRow = e.range.getRow() + e.range.getNumRows() - 1;
  if (firstRow > lastRow) return;
  const editedRows = sheet.getRange(
    firstRow,
    1,
    lastRow - firstRow + 1,
    sheet.getLastColumn()
  ).getValues();
  const applicantKeys = [];
  editedRows.forEach(function (row) {
    if (normalizeAefPaymentValue_(row[columns.confirmedIndex]) !== "yes") return;
    const key = getAefPaymentApplicantKey_(row, columns);
    if (key && applicantKeys.indexOf(key) === -1) applicantKeys.push(key);
  });
  if (!applicantKeys.length) return;

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    queueAefPaymentApplicants_(applicantKeys);
    return;
  }
  try {
    return processCurrentAefPaymentApplicants_(sheet, applicantKeys);
  } finally {
    lock.releaseLock();
  }
}

function queueAefPaymentApplicants_(applicantKeys) {
  const properties = PropertiesService.getScriptProperties();
  applicantKeys.forEach(function (applicantKey) {
    properties.setProperty(
      AEF_PAYMENT_CONFIG.retryPropertyPrefix + Utilities.getUuid(),
      JSON.stringify({ applicantKey: applicantKey, queuedAt: new Date().toISOString() })
    );
  });
  Logger.log("Queued payment confirmation edits: " + applicantKeys.length);
}

function processQueuedAefPaymentConfirmations() {
  const properties = PropertiesService.getScriptProperties();
  const allProperties = properties.getProperties();
  const propertyKeys = Object.keys(allProperties).filter(function (key) {
    return key.indexOf(AEF_PAYMENT_CONFIG.retryPropertyPrefix) === 0;
  });
  if (!propertyKeys.length) return emptyAefPaymentSummary_();

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return emptyAefPaymentSummary_();
  try {
    const applicantKeys = [];
    propertyKeys.forEach(function (propertyKey) {
      try {
        const payload = JSON.parse(String(allProperties[propertyKey] || ""));
        if (payload.applicantKey && applicantKeys.indexOf(payload.applicantKey) === -1) {
          applicantKeys.push(String(payload.applicantKey));
        }
      } catch (error) {
        Logger.log("Ignored invalid payment retry entry: " + propertyKey);
      }
    });
    const summary = processCurrentAefPaymentApplicants_(
      getAefPaymentSourceSheet_(),
      applicantKeys
    );
    propertyKeys.forEach(function (propertyKey) {
      properties.deleteProperty(propertyKey);
    });
    return summary;
  } finally {
    lock.releaseLock();
  }
}

function processCurrentAefPaymentApplicants_(sheet, applicantKeys) {
  const columns = getAefPaymentColumnIndexes_(getAefPaymentHeaders_(sheet));
  const keySet = {};
  applicantKeys.forEach(function (key) { keySet[key] = true; });
  const rowNumbers = [];
  getAefPaymentRows_(sheet).forEach(function (row, index) {
    const key = getAefPaymentApplicantKey_(row, columns);
    if (
      keySet[key] &&
      normalizeAefPaymentValue_(row[columns.confirmedIndex]) === "yes"
    ) {
      rowNumbers.push(index + 2);
    }
  });
  return processAefPaymentConfirmationRows_(sheet, rowNumbers);
}

function processAefPaymentConfirmationRows_(sheet, onlyRowNumbers) {
  const columns = getAefPaymentColumnIndexes_(getAefPaymentHeaders_(sheet));
  const sentEmails = getAefReservedPaymentEmailSet_(sheet, columns);
  const summary = emptyAefPaymentSummary_();
  for (let rowNumber = 2; rowNumber <= sheet.getLastRow(); rowNumber++) {
    if (onlyRowNumbers && onlyRowNumbers.indexOf(rowNumber) === -1) continue;
    const result = processAefPaymentConfirmationRow_(
      sheet,
      rowNumber,
      columns,
      sentEmails
    );
    if (result === "sent") summary.sent++;
    else if (result === "failed") summary.failed++;
    else if (result === "review") summary.review++;
    else summary.skipped++;
  }
  return summary;
}

function processAefPaymentConfirmationRow_(sheet, rowNumber, columns, sentEmails) {
  const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  const email = normalizeAefPaymentEmail_(row[columns.emailIndex]);
  const fullName = String(row[columns.fullNameIndex] || "").trim();
  const confirmed = normalizeAefPaymentValue_(row[columns.confirmedIndex]);
  const status = normalizeAefPaymentValue_(row[columns.statusIndex]);
  updateAefPaymentConfirmedStyle_(sheet, rowNumber, columns, confirmed);

  if (confirmed !== "yes") return "skipped";
  if (status === "sent") return "skipped";
  if (status === "sending") return "review";
  if (!isValidAefPaymentEmail_(email)) {
    setAefPaymentTracking_(
      sheet,
      rowNumber,
      columns,
      "Skipped - No Email",
      "No valid recipient email was found",
      ""
    );
    return "skipped";
  }
  if (sentEmails && sentEmails[email]) return "skipped";

  try {
    setAefPaymentTracking_(sheet, rowNumber, columns, "Sending", "", "");
    SpreadsheetApp.flush();
    if (sentEmails) sentEmails[email] = true;
  } catch (error) {
    Logger.log("Could not reserve payment row " + rowNumber + ": " + error);
    return "failed";
  }

  try {
    GmailApp.sendEmail(
      email,
      AEF_PAYMENT_CONFIG.subject,
      getAefPaymentConfirmationEmailPlainText(fullName),
      {
        htmlBody: getAefPaymentConfirmationEmailHtml(fullName),
        name: AEF_PAYMENT_CONFIG.senderName
      }
    );
  } catch (error) {
    setAefPaymentTracking_(sheet, rowNumber, columns, "Failed", String(error), "");
    return "failed";
  }

  try {
    setAefPaymentTracking_(sheet, rowNumber, columns, "Sent", "", new Date());
  } catch (error) {
    Logger.log("Payment email sent, but final tracking failed on row " + rowNumber + ": " + error);
    try {
      sheet.getRange(rowNumber, columns.errorIndex + 1).setValue(
        truncateAefPaymentError_("Email sent; final tracking failed: " + error)
      );
    } catch (secondaryError) {
      Logger.log("Could not record final payment tracking error: " + secondaryError);
    }
    return "review";
  }
  try {
    Utilities.sleep(200);
  } catch (error) {
    // Sending and tracking already completed; a pause failure is harmless.
  }
  return "sent";
}

function getAefPaymentReservedEmailSet_(rows, columns) {
  const sentEmails = {};
  rows.forEach(function (row) {
    const status = normalizeAefPaymentValue_(row[columns.statusIndex]);
    if (status !== "sent" && status !== "sending") return;
    const email = normalizeAefPaymentEmail_(row[columns.emailIndex]);
    if (email) sentEmails[email] = true;
  });
  return sentEmails;
}

function getAefReservedPaymentEmailSet_(sheet, columns) {
  return getAefPaymentReservedEmailSet_(getAefPaymentRows_(sheet), columns);
}

function emptyAefPaymentSummary_() {
  return { sent: 0, failed: 0, review: 0, skipped: 0 };
}

function ensureAefPaymentConfirmationColumns_(sheet) {
  const headers = getAefPaymentHeaders_(sheet);
  const workingHeaders = headers.slice();
  const labels = [
    AEF_PAYMENT_CONFIG.paymentConfirmedColumn,
    AEF_PAYMENT_CONFIG.emailStatusColumn,
    AEF_PAYMENT_CONFIG.emailErrorColumn,
    AEF_PAYMENT_CONFIG.emailSentAtColumn
  ];
  const indexes = labels.map(function (label) {
    let index = findAefPaymentHeaderIndex_(workingHeaders, label);
    if (index === -1) {
      workingHeaders.push(label);
      index = workingHeaders.length - 1;
      sheet.getRange(1, index + 1).setValue(label).setFontWeight("bold");
    }
    return index;
  });
  applyAefPaymentValidation_(sheet, indexes[0] + 1);
  return getAefPaymentColumnIndexes_(workingHeaders);
}

function applyAefPaymentValidation_(sheet, columnNumber) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Yes", "No"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, columnNumber, Math.max(sheet.getMaxRows() - 1, 1), 1)
    .setDataValidation(rule);
}

function getAefPaymentColumnIndexes_(headers) {
  const columns = {
    timestampIndex: findAefPaymentHeaderByCandidates_(
      headers,
      AEF_PAYMENT_CONFIG.timestampColumnCandidates
    ),
    accountNumberIndex: findAefPaymentHeaderByCandidates_(
      headers,
      AEF_PAYMENT_CONFIG.accountNumberColumnCandidates
    ),
    emailIndex: findAefPaymentHeaderByCandidates_(headers, AEF_PAYMENT_CONFIG.emailColumnCandidates),
    fullNameIndex: findAefPaymentHeaderByCandidates_(headers, AEF_PAYMENT_CONFIG.fullNameColumnCandidates),
    confirmedIndex: findAefPaymentHeaderIndex_(headers, AEF_PAYMENT_CONFIG.paymentConfirmedColumn),
    statusIndex: findAefPaymentHeaderIndex_(headers, AEF_PAYMENT_CONFIG.emailStatusColumn),
    errorIndex: findAefPaymentHeaderIndex_(headers, AEF_PAYMENT_CONFIG.emailErrorColumn),
    sentAtIndex: findAefPaymentHeaderIndex_(headers, AEF_PAYMENT_CONFIG.emailSentAtColumn)
  };
  const missing = Object.keys(columns).filter(function (key) {
    return columns[key] === -1;
  });
  if (missing.length) {
    throw new Error(
      "Required payment columns are missing. Run Setup Payment Confirmation Automation first."
    );
  }
  return columns;
}

function getAefPaymentApplicantKey_(row, columns) {
  const timestampKey = getAefPaymentTimestampKey_(row[columns.timestampIndex]);
  const accountNumber = normalizeAefPaymentValue_(row[columns.accountNumberIndex]);
  if (timestampKey) {
    return "response:" + timestampKey + "|account:" + accountNumber;
  }

  const email = normalizeAefPaymentEmail_(row[columns.emailIndex]);
  if (isValidAefPaymentEmail_(email)) return "email:" + email;
  return "profile:" + [
    normalizeAefPaymentValue_(row[columns.fullNameIndex]),
    email
  ].join("|");
}

function getAefPaymentTimestampKey_(value) {
  if (
    Object.prototype.toString.call(value) === "[object Date]" &&
    !isNaN(value.getTime())
  ) {
    return String(value.getTime());
  }
  return String(value || "").trim();
}

function setAefPaymentTracking_(sheet, rowNumber, columns, status, error, sentAt) {
  const statusCell = sheet.getRange(rowNumber, columns.statusIndex + 1);
  statusCell.setValue(status);
  sheet.getRange(rowNumber, columns.errorIndex + 1)
    .setValue(truncateAefPaymentError_(error));
  sheet.getRange(rowNumber, columns.sentAtIndex + 1).setValue(sentAt || "");

  const normalized = normalizeAefPaymentValue_(status);
  if (normalized === "sent") statusCell.setBackground(AEF_PAYMENT_CONFIG.sentColor);
  else if (normalized === "failed") statusCell.setBackground(AEF_PAYMENT_CONFIG.failedColor);
  else if (normalized.indexOf("skipped") === 0) {
    statusCell.setBackground(AEF_PAYMENT_CONFIG.skippedColor);
  }
}

function updateAefPaymentConfirmedStyle_(sheet, rowNumber, columns, value) {
  const cell = sheet.getRange(rowNumber, columns.confirmedIndex + 1);
  if (value === "yes") cell.setBackground(AEF_PAYMENT_CONFIG.confirmedYesColor);
  else if (value === "no") cell.setBackground(AEF_PAYMENT_CONFIG.confirmedNoColor);
  else cell.setBackground(null);
}

function getAefPaymentSourceSheet_() {
  const spreadsheet = getAefPaymentSpreadsheet_();
  for (let i = 0; i < AEF_PAYMENT_CONFIG.sourceSheetNameCandidates.length; i++) {
    const sheet = spreadsheet.getSheetByName(
      AEF_PAYMENT_CONFIG.sourceSheetNameCandidates[i]
    );
    if (isAefPaymentSourceSheet_(sheet)) return sheet;
  }
  throw new Error("Could not find the AEF Cohort 2 payment response tab.");
}

function isAefPaymentSourceSheet_(sheet) {
  if (!sheet || sheet.getParent().getId() !== AEF_PAYMENT_CONFIG.spreadsheetId) return false;
  if (AEF_PAYMENT_CONFIG.sourceSheetNameCandidates.indexOf(sheet.getName()) === -1) return false;
  try {
    const headers = getAefPaymentHeaders_(sheet);
    return (
      findAefPaymentHeaderByCandidates_(headers, AEF_PAYMENT_CONFIG.emailColumnCandidates) !== -1 &&
      findAefPaymentHeaderByCandidates_(headers, AEF_PAYMENT_CONFIG.fullNameColumnCandidates) !== -1
    );
  } catch (error) {
    return false;
  }
}

function getAefPaymentSpreadsheet_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active && active.getId() === AEF_PAYMENT_CONFIG.spreadsheetId) return active;
  return SpreadsheetApp.openById(AEF_PAYMENT_CONFIG.spreadsheetId);
}

function getAefPaymentHeaders_(sheet) {
  return sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1))
    .getValues()[0]
    .map(function (value) { return String(value || "").trim(); });
}

function getAefPaymentRows_(sheet) {
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
}

function findAefPaymentHeaderByCandidates_(headers, candidates) {
  for (let i = 0; i < candidates.length; i++) {
    const index = findAefPaymentHeaderIndex_(headers, candidates[i]);
    if (index !== -1) return index;
  }
  return -1;
}

function findAefPaymentHeaderIndex_(headers, label) {
  const target = normalizeAefPaymentValue_(label);
  for (let i = 0; i < headers.length; i++) {
    if (normalizeAefPaymentValue_(headers[i]) === target) return i;
  }
  return -1;
}

function normalizeAefPaymentEmail_(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeAefPaymentValue_(value) {
  return String(value || "").trim().toLowerCase();
}

function isValidAefPaymentEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeAefPaymentEmail_(value));
}

function truncateAefPaymentError_(value) {
  return String(value || "").slice(0, 500);
}

function getAefPaymentTestEmailRecipient_() {
  const saved = PropertiesService.getScriptProperties()
    .getProperty(AEF_PAYMENT_CONFIG.testEmailProperty);
  if (isValidAefPaymentEmail_(saved)) return normalizeAefPaymentEmail_(saved);
  throw new Error("Set a test email recipient before sending a test email.");
}

function withAefPaymentScriptLock_(callback) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    Logger.log("Skipped payment run because another automation is busy.");
    return;
  }
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function logAndToastAefPayment_(message) {
  Logger.log(message);
  try {
    SpreadsheetApp.getActive().toast(message, "AEF Cohort 2 Payment", 5);
  } catch (error) {
    // A background trigger has no visible spreadsheet window.
  }
  return message;
}
