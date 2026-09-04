var AEF_REFUND_CONFIG = {
  senderName: "Behind the Data Academy",
  subject: "Your AEF Cohort 1 Refund Has Been Processed",
  testEmailProperty: "AEF_COHORT_1_REFUND_TEST_EMAIL",
  requiredHeaders: [
    "Email", "Name", "Account Number", "Bank", "Account Name", "Refund", "Portfolio Status"
  ],
  emailHeader: "Email",
  nameHeader: "Name",
  refundHeader: "Refund",
  portfolioStatusHeader: "Portfolio Status",
  emailStatusHeader: "Refund Email Status",
  emailErrorHeader: "Refund Email Error",
  emailSentAtHeader: "Refund Email Sent At"
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("AEF Cohort 1 Refund")
    .addItem("Setup Refund Email Automation", "setupAefRefundEmailAutomation")
    .addSeparator()
    .addItem("Set Test Email Recipient", "setAefRefundTestEmailRecipient")
    .addItem("Preview Refund Email", "previewAefRefundEmail")
    .addItem("Send Test Refund Email", "sendAefRefundTestEmail")
    .addSeparator()
    .addItem("Count Refund Emails Waiting", "countAefRefundEmailsWaiting")
    .addItem("LIVE: Mark All Refunded and Send Emails", "sendAefRefundEmailsLive")
    .addToUi();
}

function setupAefRefundEmailAutomation() {
  const sheet = getAefRefundSheet_();
  const headers = getAefRefundHeaders_(sheet);
  [
    AEF_REFUND_CONFIG.emailStatusHeader,
    AEF_REFUND_CONFIG.emailErrorHeader,
    AEF_REFUND_CONFIG.emailSentAtHeader
  ].forEach(function (label) {
    if (findAefRefundHeaderIndex_(headers, label) !== -1) return;
    headers.push(label);
    sheet.getRange(1, headers.length).setValue(label);
  });

  const columns = getAefRefundColumns_(getAefRefundHeaders_(sheet));
  const validation = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Yes", "No"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, columns.refundIndex + 1, Math.max(sheet.getMaxRows() - 1, 1), 1)
    .setDataValidation(validation);
  sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .setFontWeight("bold")
    .setBackground("#0f2747")
    .setFontColor("#ffffff")
    .setWrap(true);
  sheet.setFrozenRows(1);
  toastAefRefund_("Refund email automation is ready. No email was sent.");
  return sheet;
}

function getAefRefundSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = spreadsheet.getSheets();
  for (let index = 0; index < sheets.length; index++) {
    const headers = getAefRefundHeaders_(sheets[index]);
    const containsAllRequiredHeaders = AEF_REFUND_CONFIG.requiredHeaders.every(function (label) {
      return findAefRefundHeaderIndex_(headers, label) !== -1;
    });
    if (containsAllRequiredHeaders) return sheets[index];
  }
  throw new Error(
    "The refund sheet could not be found. It must contain these headings: " +
    AEF_REFUND_CONFIG.requiredHeaders.join(", ") + "."
  );
}

function getAefRefundHeaders_(sheet) {
  const lastColumn = sheet.getLastColumn();
  if (!lastColumn) return [];
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
}

function getAefRefundColumns_(headers) {
  const columns = {
    emailIndex: findAefRefundHeaderIndex_(headers, AEF_REFUND_CONFIG.emailHeader),
    nameIndex: findAefRefundHeaderIndex_(headers, AEF_REFUND_CONFIG.nameHeader),
    refundIndex: findAefRefundHeaderIndex_(headers, AEF_REFUND_CONFIG.refundHeader),
    portfolioStatusIndex: findAefRefundHeaderIndex_(headers, AEF_REFUND_CONFIG.portfolioStatusHeader),
    emailStatusIndex: findAefRefundHeaderIndex_(headers, AEF_REFUND_CONFIG.emailStatusHeader),
    emailErrorIndex: findAefRefundHeaderIndex_(headers, AEF_REFUND_CONFIG.emailErrorHeader),
    emailSentAtIndex: findAefRefundHeaderIndex_(headers, AEF_REFUND_CONFIG.emailSentAtHeader)
  };
  const missing = Object.keys(columns).filter(function (key) { return columns[key] === -1; });
  if (missing.length) {
    throw new Error("Refund email columns are incomplete. Run Setup Refund Email Automation.");
  }
  return columns;
}

function findAefRefundHeaderIndex_(headers, wanted) {
  const normalizedWanted = normalizeAefRefundValue_(wanted);
  return headers.findIndex(function (header) {
    return normalizeAefRefundValue_(header) === normalizedWanted;
  });
}

function getPendingAefRefundRows_(sheet) {
  const columns = getAefRefundColumns_(getAefRefundHeaders_(sheet));
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  const pending = [];
  rows.forEach(function (row, offset) {
    const email = String(row[columns.emailIndex] || "").trim();
    const name = String(row[columns.nameIndex] || "").trim();
    if (!email && !name) return;
    const status = normalizeAefRefundValue_(row[columns.emailStatusIndex]);
    if (status === "sent" || status === "sending") return;
    pending.push(offset + 2);
  });
  return pending;
}

function normalizeAefRefundValue_(value) {
  return String(value == null ? "" : value).trim().toLowerCase();
}

function toastAefRefund_(message) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (spreadsheet && spreadsheet.toast) spreadsheet.toast(message, "AEF Cohort 1 Refund", 8);
  console.log(message);
  return message;
}
