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
  const headers = getAefRefundHeaders_(sheet);
  const columns = getAefRefundColumns_(headers);
  const participantIndexes = AEF_REFUND_CONFIG.requiredHeaders.map(function (label) {
    return findAefRefundHeaderIndex_(headers, label);
  });
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  const pending = [];
  rows.forEach(function (row, offset) {
    const hasParticipantData = participantIndexes.some(function (columnIndex) {
      return String(row[columnIndex] == null ? "" : row[columnIndex]).trim() !== "";
    });
    if (!hasParticipantData) return;
    const status = normalizeAefRefundValue_(row[columns.emailStatusIndex]);
    if (status === "sent" || status === "sending") return;
    pending.push(offset + 2);
  });
  return pending;
}

function setAefRefundTestEmailRecipient() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    "Set test email recipient",
    "Enter the email address that should receive refund test emails.",
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) {
    return toastAefRefund_("The test email address was not changed.");
  }
  const email = String(response.getResponseText() || "").trim();
  if (!isValidAefRefundEmail_(email)) throw new Error("Enter a valid test email address.");
  PropertiesService.getScriptProperties().setProperty(AEF_REFUND_CONFIG.testEmailProperty, email);
  return toastAefRefund_("Test email recipient saved: " + email);
}

function previewAefRefundEmail() {
  const html = HtmlService.createHtmlOutput(
    getAefRefundEmailHtml("Submitted Participant", true)
  ).setWidth(720).setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, "AEF Cohort 1 Refund Email Preview");
}

function sendAefRefundTestEmail() {
  const recipient = getAefRefundTestEmailRecipient_();
  GmailApp.sendEmail(
    recipient,
    "[TEST] " + AEF_REFUND_CONFIG.subject,
    getAefRefundEmailPlainText("Submitted Participant", true),
    {
      htmlBody: getAefRefundEmailHtml("Submitted Participant", true),
      name: AEF_REFUND_CONFIG.senderName
    }
  );
  return toastAefRefund_("Test refund email sent to: " + recipient);
}

function getAefRefundTestEmailRecipient_() {
  const email = String(
    PropertiesService.getScriptProperties().getProperty(AEF_REFUND_CONFIG.testEmailProperty) || ""
  ).trim();
  if (!isValidAefRefundEmail_(email)) {
    throw new Error("Set a test email recipient before sending a test.");
  }
  return email;
}

function countAefRefundEmailsWaiting() {
  const sheet = setupAefRefundEmailAutomation();
  const count = getPendingAefRefundRows_(sheet).length;
  toastAefRefund_("Refund emails waiting to be sent: " + count + ".");
  return count;
}

function sendAefRefundEmailsLive() {
  const sheet = setupAefRefundEmailAutomation();
  const pendingRows = getPendingAefRefundRows_(sheet);
  if (!pendingRows.length) {
    return toastAefRefund_("No refund emails are waiting to be sent.");
  }

  const ui = SpreadsheetApp.getUi();
  const answer = ui.alert(
    "Send refund emails?",
    "This will mark " + pendingRows.length +
      " participant(s) as refunded and send their refund emails. Continue?",
    ui.ButtonSet.YES_NO
  );
  if (answer !== ui.Button.YES) return toastAefRefund_("Live sending was cancelled.");

  return withAefRefundLock_(function () {
    const currentRows = getPendingAefRefundRows_(sheet);
    const summary = { sent: 0, invalid: 0, errors: 0, trackingErrors: 0, skipped: 0 };
    currentRows.forEach(function (rowNumber) {
      const result = processAefRefundRow_(sheet, rowNumber);
      if (result === "sent") summary.sent++;
      else if (result === "invalid") summary.invalid++;
      else if (result === "error") summary.errors++;
      else if (result === "tracking-error") summary.trackingErrors++;
      else summary.skipped++;
    });
    toastAefRefund_(
      "Refund email run complete. Sent: " + summary.sent +
      ". Invalid email: " + summary.invalid +
      ". Other errors: " + summary.errors +
      ". Sent but needs tracking review: " + summary.trackingErrors +
      ". Skipped: " + summary.skipped + "."
    );
    return summary;
  });
}

function processAefRefundRow_(sheet, rowNumber) {
  const columns = getAefRefundColumns_(getAefRefundHeaders_(sheet));
  const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  const currentStatus = normalizeAefRefundValue_(row[columns.emailStatusIndex]);
  if (currentStatus === "sent" || currentStatus === "sending") return "skipped";

  const email = String(row[columns.emailIndex] || "").trim();
  const fullName = String(row[columns.nameIndex] || "").trim();
  const hasSubmittedPortfolio =
    normalizeAefRefundValue_(row[columns.portfolioStatusIndex]) === "submitted";
  const refundCell = sheet.getRange(rowNumber, columns.refundIndex + 1);
  const statusCell = sheet.getRange(rowNumber, columns.emailStatusIndex + 1);
  const errorCell = sheet.getRange(rowNumber, columns.emailErrorIndex + 1);
  const sentAtCell = sheet.getRange(rowNumber, columns.emailSentAtIndex + 1);

  refundCell.setValue("Yes");
  statusCell.setValue("Sending");
  errorCell.setValue("");
  sentAtCell.setValue("");
  if (SpreadsheetApp.flush) SpreadsheetApp.flush();

  if (!isValidAefRefundEmail_(email)) {
    statusCell.setValue("Error");
    errorCell.setValue("A valid email address is required.");
    return "invalid";
  }

  try {
    GmailApp.sendEmail(
      email,
      AEF_REFUND_CONFIG.subject,
      getAefRefundEmailPlainText(fullName, hasSubmittedPortfolio),
      {
        htmlBody: getAefRefundEmailHtml(fullName, hasSubmittedPortfolio),
        name: AEF_REFUND_CONFIG.senderName
      }
    );
  } catch (error) {
    statusCell.setValue("Error");
    errorCell.setValue(getAefRefundErrorMessage_(error));
    return "error";
  }

  try {
    statusCell.setValue("Sent");
    errorCell.setValue("");
    sentAtCell.setValue(new Date());
    return "sent";
  } catch (trackingError) {
    console.error(
      "Refund email was accepted by Gmail for row " + rowNumber +
      ", but its tracking could not be completed: " + getAefRefundErrorMessage_(trackingError)
    );
    try {
      errorCell.setValue(
        "Email was sent, but tracking needs review: " + getAefRefundErrorMessage_(trackingError)
      );
    } catch (ignoredError) {
      console.error("The tracking warning could not be written for row " + rowNumber + ".");
    }
    return "tracking-error";
  }
}

function withAefRefundLock_(callback) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    throw new Error("Another refund email run is already in progress. Please try again shortly.");
  }
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function isValidAefRefundEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

function getAefRefundErrorMessage_(error) {
  if (error && error.message) return String(error.message);
  return String(error || "Unknown email error");
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
