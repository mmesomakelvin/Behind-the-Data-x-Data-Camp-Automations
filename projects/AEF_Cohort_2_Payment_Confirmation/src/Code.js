/**
 * Analytics Engineering Fellowship Cohort 2 payment-review automation.
 */
var AEF_PAYMENT_CONFIG = {
  spreadsheetId: "10v2U9Sn6JpcPP3Zr1d_z46s7PIuuJQlgjj7VY2mb0Y4",
  sourceSheetName: "Form_Responses",
  reviewSheetName: "Payment Review",
  senderName: "Behind the Data Academy",
  receivedSubject: "Payment Evidence Received - Analytics Engineering Fellowship Cohort 2",
  confirmationSubject: "Payment Confirmed - Analytics Engineering Fellowship Cohort 2",
  testEmailProperty: "AEF_COHORT_2_PAYMENT_TEST_EMAIL",
  triggerOwnerProperty: "AEF_COHORT_2_PAYMENT_TRIGGER_OWNER",
  retryPropertyPrefix: "AEF_PAYMENT_EMAIL_RETRY_",
  legacyRetryPropertyPrefix: "AEF_PAYMENT_RETRY_",
  formSubmitHandler: "handleAefPaymentFormSubmit",
  editHandler: "handleAefPaymentReviewEdit",
  retryHandler: "processQueuedAefPaymentEmails",
  sourceHeaders: {
    timestamp: ["Timestamp"],
    email: ["Email address", "Email Address", "Email", "email"],
    fullName: ["Full Name", "FullName", "Name"],
    linkedIn: ["LinkedIn Url", "LinkedIn URL", "LinkedIn"],
    paymentEvidence: ["Payment Evidence"],
    accountNumber: ["Account Number"],
    oldConfirmed: ["Payment Confirmed"],
    oldStatus: ["Payment Confirmation Email Status"],
    oldError: ["Payment Confirmation Email Error"],
    oldSentAt: ["Payment Confirmation Email Sent At"]
  },
  reviewHeaders: [
    "Submission Date",
    "Email address",
    "Full Name",
    "LinkedIn Url",
    "Payment Evidence",
    "Payment Review Status",
    "Received Email Status",
    "Received Email Error",
    "Received Email Sent At",
    "Confirmation Email Status",
    "Confirmation Email Error",
    "Confirmation Email Sent At",
    "Source Response Key"
  ],
  reviewStatusColumn: "Payment Review Status",
  receivedStatusColumn: "Received Email Status",
  receivedErrorColumn: "Received Email Error",
  receivedSentAtColumn: "Received Email Sent At",
  confirmationStatusColumn: "Confirmation Email Status",
  confirmationErrorColumn: "Confirmation Email Error",
  confirmationSentAtColumn: "Confirmation Email Sent At",
  sourceKeyColumn: "Source Response Key"
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("AEF Cohort 2 Payment Review")
    .addItem("Open Automation Buttons", "openAefPaymentAutomationButtons")
    .addSeparator()
    .addItem("Setup Payment Review Automation", "setupAefPaymentReviewAutomation")
    .addItem("Sync Current Form Submissions", "syncAefPaymentReviewRows")
    .addSeparator()
    .addItem("Set Test Email Recipient", "setAefPaymentTestEmailRecipient")
    .addItem("Preview Payment Received Email", "previewAefPaymentReceivedEmail")
    .addItem("Send Test Payment Received Email", "sendAefPaymentReceivedTestEmail")
    .addItem("Count Existing Applicants Waiting for Received Email", "previewPendingAefPaymentReceivedRows")
    .addItem("LIVE: Email Existing Applicants", "sendAefPaymentReceivedEmailsToExistingApplicants")
    .addSeparator()
    .addItem("Preview Payment Confirmation Email", "previewAefPaymentConfirmationEmail")
    .addItem("Send Test Payment Confirmation Email", "sendAefPaymentConfirmationTestEmail")
    .addItem("Count Confirmed Payments Waiting for Email", "previewPendingAefPaymentConfirmationRows")
    .addItem("LIVE: Send Pending Confirmation Emails", "sendPendingAefPaymentConfirmations")
    .addSeparator()
    .addItem("Install Automatic Triggers", "installAefPaymentReviewTriggers")
    .addItem("Clear Automatic Triggers", "clearAefPaymentReviewTriggers")
    .addItem("Release Trigger Ownership", "releaseAefPaymentTriggerOwnership")
    .addToUi();
}

function openAefPaymentAutomationButtons() {
  const html = HtmlService.createHtmlOutputFromFile("AutomationButtons")
    .setTitle("AEF Cohort 2 Payment Review");
  SpreadsheetApp.getUi().showSidebar(html);
}

function setupAefPaymentReviewAutomation() {
  return withAefPaymentLock_(function () {
    const summary = syncAefPaymentReviewRows_();
    installAefPaymentReviewTriggers_();
    return logAndToastAefPayment_(
      "Payment Review is ready. Current applicants copied: " + summary.added +
      ". Updated: " + summary.updated + ". No participant emails were sent."
    );
  });
}

function syncAefPaymentReviewRows() {
  return withAefPaymentLock_(function () {
    const summary = syncAefPaymentReviewRows_();
    return logAndToastAefPayment_(
      "Payment Review sync complete. Added: " + summary.added +
      ", Updated: " + summary.updated + ". No participant emails were sent."
    );
  });
}

function syncAefPaymentReviewRows_() {
  const sourceSheet = getAefPaymentSourceSheet_();
  const reviewSheet = ensureAefPaymentReviewSheet_();
  const sourceRows = getAefPaymentSheetRows_(sourceSheet);
  const sourceColumns = getAefPaymentSourceColumnIndexes_(getAefPaymentHeaders_(sourceSheet));
  const reviewColumns = getAefPaymentReviewColumnIndexes_(getAefPaymentHeaders_(reviewSheet));
  const reviewRows = getAefPaymentSheetRows_(reviewSheet);
  const reviewRowByKey = {};
  const reviewRowsByBaseKey = {};
  const reviewRowsByTimestampKey = {};

  reviewRows.forEach(function (row, index) {
    const key = String(row[reviewColumns.sourceKeyIndex] || "").trim();
    if (!key) return;
    if (reviewRowByKey[key]) {
      throw new Error(
        "Duplicate Source Response Key found in Payment Review rows " +
        reviewRowByKey[key] + " and " + (index + 2) +
        ". No rows were synced. Remove or correct the duplicate review row first."
      );
    }
    reviewRowByKey[key] = index + 2;
    const baseKey = getAefPaymentBaseKeyFromSourceKey_(key);
    if (!reviewRowsByBaseKey[baseKey]) reviewRowsByBaseKey[baseKey] = [];
    reviewRowsByBaseKey[baseKey].push(index + 2);
    const timestampKey = getAefPaymentTimestampFromSourceKey_(key);
    if (!reviewRowsByTimestampKey[timestampKey]) reviewRowsByTimestampKey[timestampKey] = [];
    reviewRowsByTimestampKey[timestampKey].push(index + 2);
  });

  const sourceRecords = [];
  const seenSourceKeys = {};
  const sourceBaseKeyCounts = {};
  const sourceTimestampKeyCounts = {};
  sourceRows.forEach(function (sourceRow, sourceIndex) {
    if (isAefPaymentEmptyRow_(sourceRow)) return;
    const key = getAefPaymentSourceKey_(sourceRow, sourceColumns, sourceIndex + 2);
    const baseKey = getAefPaymentBaseKeyFromSourceKey_(key);
    const timestampKey = getAefPaymentTimestampFromSourceKey_(key);
    if (seenSourceKeys[key]) {
      throw new Error(
        "Duplicate source response key found on Form_Responses rows " +
        seenSourceKeys[key] + " and " + (sourceIndex + 2) +
        ". No rows were synced. Please make one response unique before running setup again."
      );
    }
    seenSourceKeys[key] = sourceIndex + 2;
    sourceBaseKeyCounts[baseKey] = Number(sourceBaseKeyCounts[baseKey] || 0) + 1;
    sourceTimestampKeyCounts[timestampKey] = Number(sourceTimestampKeyCounts[timestampKey] || 0) + 1;
    sourceRecords.push({
      row: sourceRow,
      key: key,
      baseKey: baseKey,
      timestampKey: timestampKey
    });
  });

  let added = 0;
  let updated = 0;
  sourceRecords.forEach(function (sourceRecord) {
    const sourceRow = sourceRecord.row;
    const key = sourceRecord.key;
    const copiedValues = {
      timestamp: sourceRow[sourceColumns.timestampIndex],
      email: sourceRow[sourceColumns.emailIndex],
      fullName: sourceRow[sourceColumns.fullNameIndex],
      linkedIn: sourceRow[sourceColumns.linkedInIndex],
      paymentEvidence: sourceRow[sourceColumns.paymentEvidenceIndex]
    };
    let existingRowNumber = reviewRowByKey[key];
    if (!existingRowNumber) {
      const baseMatches = reviewRowsByBaseKey[sourceRecord.baseKey] || [];
      if (sourceBaseKeyCounts[sourceRecord.baseKey] === 1 && baseMatches.length === 1) {
        existingRowNumber = baseMatches[0];
      } else {
        const timestampMatches = reviewRowsByTimestampKey[sourceRecord.timestampKey] || [];
        if (
          sourceTimestampKeyCounts[sourceRecord.timestampKey] === 1 &&
          timestampMatches.length === 1
        ) {
          existingRowNumber = timestampMatches[0];
        } else if (baseMatches.length || timestampMatches.length) {
          throw new Error(
            "A source response changed but could not be matched safely because its timestamp is shared. " +
            "No email was sent. Review the matching Form_Responses rows before syncing again."
          );
        }
      }
    }

    if (existingRowNumber) {
      setAefPaymentCopiedFields_(reviewSheet, existingRowNumber, reviewColumns, copiedValues);
      reviewSheet.getRange(existingRowNumber, reviewColumns.sourceKeyIndex + 1).setValue(key);
      updated++;
      return;
    }

    const newRow = new Array(AEF_PAYMENT_CONFIG.reviewHeaders.length).fill("");
    newRow[reviewColumns.timestampIndex] = copiedValues.timestamp;
    newRow[reviewColumns.emailIndex] = copiedValues.email;
    newRow[reviewColumns.fullNameIndex] = copiedValues.fullName;
    newRow[reviewColumns.linkedInIndex] = copiedValues.linkedIn;
    newRow[reviewColumns.paymentEvidenceIndex] = copiedValues.paymentEvidence;
    newRow[reviewColumns.reviewStatusIndex] = getMigratedAefPaymentReviewStatus_(
      sourceRow,
      sourceColumns
    );
    newRow[reviewColumns.confirmationStatusIndex] = getOptionalAefPaymentValue_(
      sourceRow,
      sourceColumns.oldStatusIndex
    );
    newRow[reviewColumns.confirmationErrorIndex] = getOptionalAefPaymentValue_(
      sourceRow,
      sourceColumns.oldErrorIndex
    );
    newRow[reviewColumns.confirmationSentAtIndex] = getOptionalAefPaymentValue_(
      sourceRow,
      sourceColumns.oldSentAtIndex
    );
    newRow[reviewColumns.sourceKeyIndex] = key;
    const rowNumber = Math.max(reviewSheet.getLastRow() + 1, 2);
    reviewSheet.getRange(rowNumber, 1, 1, newRow.length).setValues([newRow]);
    reviewRowByKey[key] = rowNumber;
    added++;
  });

  return { added: added, updated: updated, total: sourceRows.length };
}

function setAefPaymentCopiedFields_(sheet, rowNumber, columns, values) {
  sheet.getRange(rowNumber, columns.timestampIndex + 1).setValue(values.timestamp);
  sheet.getRange(rowNumber, columns.emailIndex + 1).setValue(values.email);
  sheet.getRange(rowNumber, columns.fullNameIndex + 1).setValue(values.fullName);
  sheet.getRange(rowNumber, columns.linkedInIndex + 1).setValue(values.linkedIn);
  sheet.getRange(rowNumber, columns.paymentEvidenceIndex + 1).setValue(values.paymentEvidence);
}

function ensureAefPaymentReviewSheet_() {
  const spreadsheet = getAefPaymentSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(AEF_PAYMENT_CONFIG.reviewSheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(AEF_PAYMENT_CONFIG.reviewSheetName);

  const existingHeaders = getAefPaymentHeaders_(sheet);
  if (!existingHeaders.length || isAefPaymentEmptyRow_(existingHeaders)) {
    sheet.getRange(1, 1, 1, AEF_PAYMENT_CONFIG.reviewHeaders.length)
      .setValues([AEF_PAYMENT_CONFIG.reviewHeaders]);
  } else {
    const workingHeaders = existingHeaders.slice();
    AEF_PAYMENT_CONFIG.reviewHeaders.forEach(function (label) {
      if (findAefPaymentHeaderIndex_(workingHeaders, label) !== -1) return;
      workingHeaders.push(label);
      sheet.getRange(1, workingHeaders.length).setValue(label);
    });
  }

  const columns = getAefPaymentReviewColumnIndexes_(getAefPaymentHeaders_(sheet));
  const validation = SpreadsheetApp.newDataValidation()
    .requireValueInList(["Pending", "Confirmed", "Rejected"], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, columns.reviewStatusIndex + 1, Math.max(sheet.getMaxRows() - 1, 1), 1)
    .setDataValidation(validation);
  sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .setFontWeight("bold")
    .setBackground("#0f2747")
    .setFontColor("#ffffff")
    .setWrap(true);
  sheet.setFrozenRows(1);
  sheet.hideColumns(columns.sourceKeyIndex + 1);
  return sheet;
}

function handleAefPaymentFormSubmit(e) {
  if (!e || !e.range) return;
  const sourceSheet = e.range.getSheet();
  if (!isExactAefPaymentSheet_(sourceSheet, AEF_PAYMENT_CONFIG.sourceSheetName)) return;
  const sourceRowNumber = e.range.getRow();
  if (sourceRowNumber < 2) return;
  const sourceColumns = getAefPaymentSourceColumnIndexes_(getAefPaymentHeaders_(sourceSheet));
  const sourceRow = sourceSheet.getRange(
    sourceRowNumber,
    1,
    1,
    sourceSheet.getLastColumn()
  ).getValues()[0];
  const sourceKey = getAefPaymentSourceKey_(sourceRow, sourceColumns, sourceRowNumber);
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    queueAefPaymentEmail_("received", sourceKey);
    return;
  }
  try {
    syncAefPaymentReviewRows_();
    const reviewSheet = getAefPaymentReviewSheet_();
    const reviewRowNumber = findAefPaymentReviewRowByKey_(reviewSheet, sourceKey);
    if (reviewRowNumber) return processAefPaymentReceivedRow_(reviewSheet, reviewRowNumber);
  } finally {
    lock.releaseLock();
  }
}

function handleAefPaymentReviewEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (!isExactAefPaymentSheet_(sheet, AEF_PAYMENT_CONFIG.reviewSheetName)) return;
  const columns = getAefPaymentReviewColumnIndexes_(getAefPaymentHeaders_(sheet));
  const editedColumn = e.range.getColumn();
  if (editedColumn !== columns.reviewStatusIndex + 1) return;
  if (e.range.getNumRows() !== 1 || e.range.getNumColumns() !== 1) return;
  if (normalizeAefPaymentValue_(e.value) !== "confirmed") return;
  const rowNumber = e.range.getRow();
  if (rowNumber < 2) return;
  const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  const sourceKey = String(row[columns.sourceKeyIndex] || "").trim();
  if (!sourceKey) return;
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    queueAefPaymentEmail_("confirmation", sourceKey);
    return;
  }
  try {
    return processAefPaymentConfirmationRow_(sheet, rowNumber);
  } finally {
    lock.releaseLock();
  }
}

function processAefPaymentReceivedRow_(sheet, rowNumber) {
  return processAefPaymentEmailRow_(sheet, rowNumber, "received");
}

function processAefPaymentConfirmationRow_(sheet, rowNumber) {
  return processAefPaymentEmailRow_(sheet, rowNumber, "confirmation");
}

function processAefPaymentEmailRow_(sheet, rowNumber, type) {
  const columns = getAefPaymentReviewColumnIndexes_(getAefPaymentHeaders_(sheet));
  const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  const isReceived = type === "received";
  const statusIndex = isReceived ? columns.receivedStatusIndex : columns.confirmationStatusIndex;
  const errorIndex = isReceived ? columns.receivedErrorIndex : columns.confirmationErrorIndex;
  const sentAtIndex = isReceived ? columns.receivedSentAtIndex : columns.confirmationSentAtIndex;
  const email = normalizeAefPaymentEmail_(row[columns.emailIndex]);
  const fullName = String(row[columns.fullNameIndex] || "").trim();
  const emailStatus = normalizeAefPaymentValue_(row[statusIndex]);

  if (!isReceived && normalizeAefPaymentValue_(row[columns.reviewStatusIndex]) !== "confirmed") {
    return "skipped";
  }
  if (emailStatus === "sent") return "skipped";
  if (emailStatus === "sending") return "review";
  if (!isValidAefPaymentEmail_(email)) {
    setAefPaymentTracking_(
      sheet,
      rowNumber,
      statusIndex,
      errorIndex,
      sentAtIndex,
      "Skipped - No Email",
      "No valid recipient email was found",
      ""
    );
    return "skipped";
  }

  try {
    setAefPaymentTracking_(
      sheet,
      rowNumber,
      statusIndex,
      errorIndex,
      sentAtIndex,
      "Sending",
      "",
      ""
    );
    SpreadsheetApp.flush();
  } catch (error) {
    Logger.log("Could not reserve payment-review row " + rowNumber + ": " + error);
    return "failed";
  }

  try {
    GmailApp.sendEmail(
      email,
      isReceived ? AEF_PAYMENT_CONFIG.receivedSubject : AEF_PAYMENT_CONFIG.confirmationSubject,
      isReceived
        ? getAefPaymentReceivedEmailPlainText(fullName)
        : getAefPaymentConfirmationEmailPlainText(fullName),
      {
        htmlBody: isReceived
          ? getAefPaymentReceivedEmailHtml(fullName)
          : getAefPaymentConfirmationEmailHtml(fullName),
        name: AEF_PAYMENT_CONFIG.senderName
      }
    );
  } catch (error) {
    setAefPaymentTracking_(
      sheet,
      rowNumber,
      statusIndex,
      errorIndex,
      sentAtIndex,
      "Failed",
      String(error),
      ""
    );
    return "failed";
  }

  try {
    setAefPaymentTracking_(
      sheet,
      rowNumber,
      statusIndex,
      errorIndex,
      sentAtIndex,
      "Sent",
      "",
      new Date()
    );
  } catch (error) {
    Logger.log("Email sent, but final tracking failed on row " + rowNumber + ": " + error);
    try {
      sheet.getRange(rowNumber, errorIndex + 1).setValue(
        truncateAefPaymentError_("Email sent; final tracking failed: " + error)
      );
    } catch (secondaryError) {
      Logger.log("Could not record the final tracking error: " + secondaryError);
    }
    return "review";
  }
  try { Utilities.sleep(200); } catch (error) {}
  return "sent";
}

function setAefPaymentTracking_(sheet, rowNumber, statusIndex, errorIndex, sentAtIndex, status, error, sentAt) {
  sheet.getRange(rowNumber, statusIndex + 1).setValue(status);
  sheet.getRange(rowNumber, errorIndex + 1).setValue(truncateAefPaymentError_(error));
  sheet.getRange(rowNumber, sentAtIndex + 1).setValue(sentAt || "");
}

function previewPendingAefPaymentReceivedRows() {
  const targets = getPendingAefPaymentEmailTargets_("received");
  return logAndToastAefPayment_(
    "Existing applicants waiting: " + targets.keys.length +
    ". Valid email addresses: " + targets.valid +
    ". Missing or invalid email addresses: " + targets.invalid + "."
  );
}

function sendAefPaymentReceivedEmailsToExistingApplicants() {
  const targets = getPendingAefPaymentEmailTargets_("received");
  if (!targets.keys.length) return logAndToastAefPayment_("No received emails are waiting to be sent.");
  const ui = SpreadsheetApp.getUi();
  const answer = ui.alert(
    "Email existing applicants?",
    "This will send up to " + targets.valid + " live email(s). " +
      targets.invalid + " row(s) without a valid email will be marked and skipped. Continue?",
    ui.ButtonSet.YES_NO
  );
  if (answer !== ui.Button.YES) return logAndToastAefPayment_("Live sending was cancelled.");
  return processAefPaymentTargetsWithLock_(targets.keys, "received");
}

function previewPendingAefPaymentConfirmationRows() {
  const targets = getPendingAefPaymentEmailTargets_("confirmation");
  return logAndToastAefPayment_(
    "Confirmed payments waiting: " + targets.keys.length +
    ". Valid email addresses: " + targets.valid +
    ". Missing or invalid email addresses: " + targets.invalid + "."
  );
}

function sendPendingAefPaymentConfirmations() {
  const targets = getPendingAefPaymentEmailTargets_("confirmation");
  if (!targets.keys.length) return logAndToastAefPayment_("No confirmation emails are waiting to be sent.");
  const ui = SpreadsheetApp.getUi();
  const answer = ui.alert(
    "Send payment confirmation emails?",
    "This will send up to " + targets.valid + " live email(s). " +
      targets.invalid + " row(s) without a valid email will be marked and skipped. Continue?",
    ui.ButtonSet.YES_NO
  );
  if (answer !== ui.Button.YES) return logAndToastAefPayment_("Live sending was cancelled.");
  return processAefPaymentTargetsWithLock_(targets.keys, "confirmation");
}

function processAefPaymentTargetsWithLock_(sourceKeys, type) {
  return withAefPaymentLock_(function () {
    const sheet = getAefPaymentReviewSheet_();
    const summary = { sent: 0, failed: 0, review: 0, skipped: 0 };
    sourceKeys.forEach(function (sourceKey) {
      const rowNumber = findAefPaymentReviewRowByKey_(sheet, sourceKey);
      if (!rowNumber) {
        summary.review++;
        return;
      }
      const result = processAefPaymentEmailRow_(sheet, rowNumber, type);
      summary[result] = (summary[result] || 0) + 1;
    });
    return logAndToastAefPayment_(
      "Email run complete. Sent: " + summary.sent +
      ", Failed: " + summary.failed +
      ", Needs review: " + summary.review +
      ", Skipped: " + summary.skipped
    );
  });
}

function getPendingAefPaymentEmailTargets_(type) {
  const sheet = getAefPaymentReviewSheet_();
  const columns = getAefPaymentReviewColumnIndexes_(getAefPaymentHeaders_(sheet));
  const statusIndex = type === "received"
    ? columns.receivedStatusIndex
    : columns.confirmationStatusIndex;
  const targets = { keys: [], valid: 0, invalid: 0 };
  getAefPaymentSheetRows_(sheet).forEach(function (row, index) {
    const emailStatus = normalizeAefPaymentValue_(row[statusIndex]);
    if (emailStatus === "sent" || emailStatus === "sending") return;
    if (type === "confirmation" && normalizeAefPaymentValue_(row[columns.reviewStatusIndex]) !== "confirmed") return;
    const sourceKey = String(row[columns.sourceKeyIndex] || "").trim();
    if (!sourceKey) return;
    targets.keys.push(sourceKey);
    if (isValidAefPaymentEmail_(normalizeAefPaymentEmail_(row[columns.emailIndex]))) {
      targets.valid++;
    } else {
      targets.invalid++;
    }
  });
  return targets;
}

function previewAefPaymentReceivedEmail() {
  const html = HtmlService.createHtmlOutput(getAefPaymentReceivedEmailHtml("Accepted Fellow"))
    .setWidth(720)
    .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, "Payment Evidence Received Email");
}

function sendAefPaymentReceivedTestEmail() {
  const recipient = getAefPaymentTestEmailRecipient_();
  GmailApp.sendEmail(
    recipient,
    "[TEST] " + AEF_PAYMENT_CONFIG.receivedSubject,
    getAefPaymentReceivedEmailPlainText("Accepted Fellow"),
    {
      htmlBody: getAefPaymentReceivedEmailHtml("Accepted Fellow"),
      name: AEF_PAYMENT_CONFIG.senderName
    }
  );
  return logAndToastAefPayment_("Test received email sent to: " + recipient);
}

function previewAefPaymentConfirmationEmail() {
  const html = HtmlService.createHtmlOutput(getAefPaymentConfirmationEmailHtml("Accepted Fellow"))
    .setWidth(720)
    .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, "Payment Confirmation Email");
}

function sendAefPaymentConfirmationTestEmail() {
  const recipient = getAefPaymentTestEmailRecipient_();
  GmailApp.sendEmail(
    recipient,
    "[TEST] " + AEF_PAYMENT_CONFIG.confirmationSubject,
    getAefPaymentConfirmationEmailPlainText("Accepted Fellow"),
    {
      htmlBody: getAefPaymentConfirmationEmailHtml("Accepted Fellow"),
      name: AEF_PAYMENT_CONFIG.senderName
    }
  );
  return logAndToastAefPayment_("Test confirmation email sent to: " + recipient);
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
  if (!isValidAefPaymentEmail_(clean)) throw new Error("Please enter a valid test email address.");
  PropertiesService.getScriptProperties().setProperty(AEF_PAYMENT_CONFIG.testEmailProperty, clean);
  return clean;
}

function getAefPaymentTestEmailRecipient_() {
  const email = normalizeAefPaymentEmail_(
    PropertiesService.getScriptProperties().getProperty(AEF_PAYMENT_CONFIG.testEmailProperty)
  );
  if (!isValidAefPaymentEmail_(email)) {
    throw new Error("Set a test email recipient before sending a test.");
  }
  return email;
}

function queueAefPaymentEmail_(type, sourceKey) {
  PropertiesService.getScriptProperties().setProperty(
    AEF_PAYMENT_CONFIG.retryPropertyPrefix + Utilities.getUuid(),
    JSON.stringify({ type: type, sourceKey: sourceKey, queuedAt: new Date().toISOString() })
  );
}

function processQueuedAefPaymentEmails() {
  const properties = PropertiesService.getScriptProperties();
  const all = properties.getProperties();
  const keys = Object.keys(all).filter(function (key) {
    return key.indexOf(AEF_PAYMENT_CONFIG.retryPropertyPrefix) === 0;
  });
  if (!keys.length) return { processed: 0 };
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) return { processed: 0 };
  let processed = 0;
  let retained = 0;
  try {
    const reviewSheet = ensureAefPaymentReviewSheet_();
    keys.forEach(function (propertyKey) {
      try {
        const payload = JSON.parse(String(all[propertyKey] || ""));
        if (payload.type !== "received" && payload.type !== "confirmation") {
          throw new Error("Queued email type is not recognised");
        }
        if (payload.type === "received") syncAefPaymentReviewRows_();
        const rowNumber = findAefPaymentReviewRowByKey_(reviewSheet, payload.sourceKey);
        if (!rowNumber) throw new Error("Payment Review row was not found for the queued email");
        const result = processAefPaymentEmailRow_(reviewSheet, rowNumber, payload.type);
        if (!isAefPaymentQueueOutcomeSafe_(reviewSheet, rowNumber, payload.type, result)) {
          throw new Error("Queued email failure was not safely recorded in Payment Review");
        }
        properties.deleteProperty(propertyKey);
        processed++;
      } catch (error) {
        Logger.log("Could not process queued payment email " + propertyKey + ": " + error);
        retainAefPaymentQueueError_(properties, propertyKey, all[propertyKey], error);
        retained++;
      }
    });
  } finally {
    lock.releaseLock();
  }
  return { processed: processed, retained: retained };
}

function isAefPaymentQueueOutcomeSafe_(sheet, rowNumber, type, result) {
  if (result !== "failed") return true;
  const columns = getAefPaymentReviewColumnIndexes_(getAefPaymentHeaders_(sheet));
  const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  const statusIndex = type === "received"
    ? columns.receivedStatusIndex
    : columns.confirmationStatusIndex;
  const errorIndex = type === "received"
    ? columns.receivedErrorIndex
    : columns.confirmationErrorIndex;
  return normalizeAefPaymentValue_(row[statusIndex]) === "failed" &&
    String(row[errorIndex] || "").trim() !== "";
}

function retainAefPaymentQueueError_(properties, propertyKey, rawPayload, error) {
  let payload;
  try {
    payload = JSON.parse(String(rawPayload || ""));
  } catch (parseError) {
    payload = { rawPayload: String(rawPayload || "") };
  }
  payload.attempts = Number(payload.attempts || 0) + 1;
  payload.lastError = truncateAefPaymentError_(error);
  payload.lastAttemptAt = new Date().toISOString();
  properties.setProperty(propertyKey, JSON.stringify(payload));
}

function installAefPaymentReviewTriggers() {
  return withAefPaymentLock_(function () {
    installAefPaymentReviewTriggers_();
    return logAndToastAefPayment_("Automatic form, review, and retry triggers are installed.");
  });
}

function installAefPaymentReviewTriggers_() {
  claimAefPaymentTriggerOwner_();
  const migration = migrateLegacyAefPaymentQueue_();
  if (migration.unresolved) {
    throw new Error(
      migration.unresolved +
      " old waiting payment email(s) could not be matched. The old trigger was left unchanged."
    );
  }
  const handlers = [
    AEF_PAYMENT_CONFIG.formSubmitHandler,
    AEF_PAYMENT_CONFIG.editHandler,
    AEF_PAYMENT_CONFIG.retryHandler,
    "handleAefPaymentConfirmedEdit",
    "processQueuedAefPaymentConfirmations"
  ];
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (handlers.indexOf(trigger.getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger(AEF_PAYMENT_CONFIG.formSubmitHandler)
    .forSpreadsheet(getAefPaymentSpreadsheet_())
    .onFormSubmit()
    .create();
  ScriptApp.newTrigger(AEF_PAYMENT_CONFIG.editHandler)
    .forSpreadsheet(getAefPaymentSpreadsheet_())
    .onEdit()
    .create();
  ScriptApp.newTrigger(AEF_PAYMENT_CONFIG.retryHandler)
    .timeBased()
    .everyMinutes(5)
    .create();
}

function migrateLegacyAefPaymentQueue_() {
  const properties = PropertiesService.getScriptProperties();
  const all = properties.getProperties();
  const legacyKeys = Object.keys(all).filter(function (key) {
    return key.indexOf(AEF_PAYMENT_CONFIG.legacyRetryPropertyPrefix) === 0;
  });
  if (!legacyKeys.length) return { migrated: 0, unresolved: 0 };

  const sourceSheet = getAefPaymentSourceSheet_();
  const sourceColumns = getAefPaymentSourceColumnIndexes_(getAefPaymentHeaders_(sourceSheet));
  const newKeyByLegacyKey = {};
  const duplicateLegacyKeys = {};
  getAefPaymentSheetRows_(sourceSheet).forEach(function (row, index) {
    if (isAefPaymentEmptyRow_(row)) return;
    const legacyKey = getLegacyAefPaymentApplicantKey_(row, sourceColumns);
    if (newKeyByLegacyKey[legacyKey]) duplicateLegacyKeys[legacyKey] = true;
    newKeyByLegacyKey[legacyKey] = getAefPaymentSourceKey_(row, sourceColumns, index + 2);
  });

  let migrated = 0;
  let unresolved = 0;
  legacyKeys.forEach(function (propertyKey) {
    try {
      const payload = JSON.parse(String(all[propertyKey] || ""));
      const legacyKey = String(payload.applicantKey || "").trim();
      const newKey = newKeyByLegacyKey[legacyKey];
      if (!legacyKey || !newKey || duplicateLegacyKeys[legacyKey]) {
        throw new Error("Old waiting email could not be matched to exactly one response");
      }
      properties.setProperty(
        AEF_PAYMENT_CONFIG.retryPropertyPrefix + Utilities.getUuid(),
        JSON.stringify({
          type: "confirmation",
          sourceKey: newKey,
          queuedAt: payload.queuedAt || new Date().toISOString(),
          migratedFrom: propertyKey
        })
      );
      properties.deleteProperty(propertyKey);
      migrated++;
    } catch (error) {
      Logger.log("Could not migrate old payment queue entry " + propertyKey + ": " + error);
      unresolved++;
    }
  });
  return { migrated: migrated, unresolved: unresolved };
}

function getLegacyAefPaymentApplicantKey_(row, columns) {
  const timestampKey = getLegacyAefPaymentTimestampKey_(row[columns.timestampIndex]);
  const accountNumber = normalizeAefPaymentValue_(row[columns.accountNumberIndex]);
  if (timestampKey) return "response:" + timestampKey + "|account:" + accountNumber;
  const email = normalizeAefPaymentEmail_(row[columns.emailIndex]);
  if (isValidAefPaymentEmail_(email)) return "email:" + email;
  return "profile:" + [
    normalizeAefPaymentValue_(row[columns.fullNameIndex]),
    email
  ].join("|");
}

function getLegacyAefPaymentTimestampKey_(value) {
  if (
    Object.prototype.toString.call(value) === "[object Date]" &&
    !isNaN(value.getTime())
  ) {
    return String(value.getTime());
  }
  return String(value || "").trim();
}

function claimAefPaymentTriggerOwner_() {
  const currentEmail = normalizeAefPaymentEmail_(Session.getEffectiveUser().getEmail());
  if (!currentEmail) {
    throw new Error("Google did not provide the current account email. Run setup directly from the spreadsheet menu.");
  }
  const properties = PropertiesService.getScriptProperties();
  const savedOwner = normalizeAefPaymentEmail_(
    properties.getProperty(AEF_PAYMENT_CONFIG.triggerOwnerProperty)
  );
  if (savedOwner && savedOwner !== currentEmail) {
    throw new Error(
      "Automatic triggers belong to " + savedOwner +
      ". That account must clear the triggers and release ownership before another account runs setup."
    );
  }
  if (!savedOwner) properties.setProperty(AEF_PAYMENT_CONFIG.triggerOwnerProperty, currentEmail);
  return currentEmail;
}

function releaseAefPaymentTriggerOwnership() {
  return withAefPaymentLock_(function () {
    const currentEmail = normalizeAefPaymentEmail_(Session.getEffectiveUser().getEmail());
    const properties = PropertiesService.getScriptProperties();
    const savedOwner = normalizeAefPaymentEmail_(
      properties.getProperty(AEF_PAYMENT_CONFIG.triggerOwnerProperty)
    );
    if (!savedOwner) return logAndToastAefPayment_("No trigger owner is saved.");
    if (savedOwner !== currentEmail) {
      throw new Error("Only the saved trigger owner, " + savedOwner + ", can release ownership.");
    }
    const handlers = getAefPaymentAutomationHandlerNames_();
    const remaining = ScriptApp.getProjectTriggers().filter(function (trigger) {
      return handlers.indexOf(trigger.getHandlerFunction()) !== -1;
    });
    if (remaining.length) {
      throw new Error("Clear Automatic Triggers before releasing trigger ownership.");
    }
    const ui = SpreadsheetApp.getUi();
    const answer = ui.alert(
      "Release trigger ownership?",
      "After this, another Google account can run setup and become the sender.",
      ui.ButtonSet.YES_NO
    );
    if (answer !== ui.Button.YES) return logAndToastAefPayment_("Trigger ownership was not changed.");
    properties.deleteProperty(AEF_PAYMENT_CONFIG.triggerOwnerProperty);
    return logAndToastAefPayment_("Trigger ownership released. Another account can now run setup.");
  });
}

function getAefPaymentAutomationHandlerNames_() {
  return [
    AEF_PAYMENT_CONFIG.formSubmitHandler,
    AEF_PAYMENT_CONFIG.editHandler,
    AEF_PAYMENT_CONFIG.retryHandler,
    "handleAefPaymentConfirmedEdit",
    "processQueuedAefPaymentConfirmations"
  ];
}

function clearAefPaymentReviewTriggers() {
  return withAefPaymentLock_(function () {
    const handlers = [
      AEF_PAYMENT_CONFIG.formSubmitHandler,
      AEF_PAYMENT_CONFIG.editHandler,
      AEF_PAYMENT_CONFIG.retryHandler,
      "handleAefPaymentConfirmedEdit",
      "processQueuedAefPaymentConfirmations"
    ];
    let removed = 0;
    ScriptApp.getProjectTriggers().forEach(function (trigger) {
      if (handlers.indexOf(trigger.getHandlerFunction()) === -1) return;
      ScriptApp.deleteTrigger(trigger);
      removed++;
    });
    const properties = PropertiesService.getScriptProperties();
    const all = properties.getProperties();
    let queued = 0;
    Object.keys(all).forEach(function (key) {
      if (key.indexOf(AEF_PAYMENT_CONFIG.retryPropertyPrefix) !== 0) return;
      properties.deleteProperty(key);
      queued++;
    });
    return logAndToastAefPayment_(
      "Removed automatic triggers: " + removed + ". Cleared waiting emails: " + queued + "."
    );
  });
}

function getAefPaymentSpreadsheet_() {
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active && active.getId() === AEF_PAYMENT_CONFIG.spreadsheetId) return active;
  } catch (error) {}
  return SpreadsheetApp.openById(AEF_PAYMENT_CONFIG.spreadsheetId);
}

function getAefPaymentSourceSheet_() {
  const sheet = getAefPaymentSpreadsheet_().getSheetByName(AEF_PAYMENT_CONFIG.sourceSheetName);
  if (!sheet) throw new Error("The Form_Responses tab could not be found.");
  return sheet;
}

function getAefPaymentReviewSheet_() {
  const sheet = getAefPaymentSpreadsheet_().getSheetByName(AEF_PAYMENT_CONFIG.reviewSheetName);
  if (!sheet) throw new Error("Run Setup Payment Review Automation first.");
  return sheet;
}

function getAefPaymentHeaders_(sheet) {
  if (!sheet || sheet.getLastColumn() < 1 || sheet.getLastRow() < 1) return [];
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function getAefPaymentSheetRows_(sheet) {
  if (sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
}

function getAefPaymentSourceColumnIndexes_(headers) {
  const names = AEF_PAYMENT_CONFIG.sourceHeaders;
  const columns = {
    timestampIndex: findAefPaymentHeaderByCandidates_(headers, names.timestamp),
    emailIndex: findAefPaymentHeaderByCandidates_(headers, names.email),
    fullNameIndex: findAefPaymentHeaderByCandidates_(headers, names.fullName),
    linkedInIndex: findAefPaymentHeaderByCandidates_(headers, names.linkedIn),
    paymentEvidenceIndex: findAefPaymentHeaderByCandidates_(headers, names.paymentEvidence),
    accountNumberIndex: findAefPaymentHeaderByCandidates_(headers, names.accountNumber),
    oldConfirmedIndex: findAefPaymentHeaderByCandidates_(headers, names.oldConfirmed),
    oldStatusIndex: findAefPaymentHeaderByCandidates_(headers, names.oldStatus),
    oldErrorIndex: findAefPaymentHeaderByCandidates_(headers, names.oldError),
    oldSentAtIndex: findAefPaymentHeaderByCandidates_(headers, names.oldSentAt)
  };
  const required = [
    "timestampIndex", "emailIndex", "fullNameIndex", "linkedInIndex",
    "paymentEvidenceIndex", "accountNumberIndex"
  ];
  const missing = required.filter(function (name) { return columns[name] === -1; });
  if (missing.length) throw new Error("Required form-response columns are missing: " + missing.join(", "));
  return columns;
}

function getAefPaymentReviewColumnIndexes_(headers) {
  const columns = {
    timestampIndex: findAefPaymentHeaderIndex_(headers, "Submission Date"),
    emailIndex: findAefPaymentHeaderIndex_(headers, "Email address"),
    fullNameIndex: findAefPaymentHeaderIndex_(headers, "Full Name"),
    linkedInIndex: findAefPaymentHeaderIndex_(headers, "LinkedIn Url"),
    paymentEvidenceIndex: findAefPaymentHeaderIndex_(headers, "Payment Evidence"),
    reviewStatusIndex: findAefPaymentHeaderIndex_(headers, AEF_PAYMENT_CONFIG.reviewStatusColumn),
    receivedStatusIndex: findAefPaymentHeaderIndex_(headers, AEF_PAYMENT_CONFIG.receivedStatusColumn),
    receivedErrorIndex: findAefPaymentHeaderIndex_(headers, AEF_PAYMENT_CONFIG.receivedErrorColumn),
    receivedSentAtIndex: findAefPaymentHeaderIndex_(headers, AEF_PAYMENT_CONFIG.receivedSentAtColumn),
    confirmationStatusIndex: findAefPaymentHeaderIndex_(headers, AEF_PAYMENT_CONFIG.confirmationStatusColumn),
    confirmationErrorIndex: findAefPaymentHeaderIndex_(headers, AEF_PAYMENT_CONFIG.confirmationErrorColumn),
    confirmationSentAtIndex: findAefPaymentHeaderIndex_(headers, AEF_PAYMENT_CONFIG.confirmationSentAtColumn),
    sourceKeyIndex: findAefPaymentHeaderIndex_(headers, AEF_PAYMENT_CONFIG.sourceKeyColumn)
  };
  const missing = Object.keys(columns).filter(function (name) { return columns[name] === -1; });
  if (missing.length) throw new Error("Payment Review columns are incomplete. Run setup again.");
  return columns;
}

function getAefPaymentSourceKey_(row, columns, rowNumber) {
  const timestamp = getAefPaymentTimestampKey_(row[columns.timestampIndex]);
  const account = normalizeAefPaymentValue_(row[columns.accountNumberIndex]);
  const email = normalizeAefPaymentEmail_(row[columns.emailIndex]);
  return timestamp + "|" + (account || "no-account-" + String(rowNumber || "")) + "|" + email;
}

function getAefPaymentBaseKeyFromSourceKey_(sourceKey) {
  return String(sourceKey || "").split("|").slice(0, 2).join("|");
}

function getAefPaymentTimestampFromSourceKey_(sourceKey) {
  return String(sourceKey || "").split("|")[0] || "";
}

function getAefPaymentTimestampKey_(value) {
  if (value && Object.prototype.toString.call(value) === "[object Date]") {
    try { return value.toISOString().toLowerCase(); } catch (error) {}
  }
  return String(value || "").trim().toLowerCase();
}

function findAefPaymentReviewRowByKey_(sheet, sourceKey) {
  const columns = getAefPaymentReviewColumnIndexes_(getAefPaymentHeaders_(sheet));
  const rows = getAefPaymentSheetRows_(sheet);
  for (let index = 0; index < rows.length; index++) {
    if (String(rows[index][columns.sourceKeyIndex] || "").trim() === String(sourceKey || "").trim()) {
      return index + 2;
    }
  }
  return 0;
}

function getMigratedAefPaymentReviewStatus_(row, columns) {
  const oldValue = columns.oldConfirmedIndex === -1
    ? ""
    : normalizeAefPaymentValue_(row[columns.oldConfirmedIndex]);
  if (oldValue === "yes" || oldValue === "confirmed" || oldValue === "true") {
    return "Confirmed";
  }
  return "Pending";
}

function getOptionalAefPaymentValue_(row, index) {
  return index === -1 ? "" : row[index];
}

function isExactAefPaymentSheet_(sheet, expectedName) {
  try {
    return !!sheet && sheet.getName() === expectedName &&
      sheet.getParent().getId() === AEF_PAYMENT_CONFIG.spreadsheetId;
  } catch (error) {
    return false;
  }
}

function findAefPaymentHeaderByCandidates_(headers, candidates) {
  for (let index = 0; index < candidates.length; index++) {
    const found = findAefPaymentHeaderIndex_(headers, candidates[index]);
    if (found !== -1) return found;
  }
  return -1;
}

function findAefPaymentHeaderIndex_(headers, label) {
  const wanted = normalizeAefPaymentValue_(label);
  for (let index = 0; index < headers.length; index++) {
    if (normalizeAefPaymentValue_(headers[index]) === wanted) return index;
  }
  return -1;
}

function normalizeAefPaymentValue_(value) {
  return String(value == null ? "" : value).trim().toLowerCase();
}

function normalizeAefPaymentEmail_(value) {
  return String(value == null ? "" : value).trim().toLowerCase();
}

function isValidAefPaymentEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
}

function isAefPaymentEmptyRow_(row) {
  return !row || row.every(function (value) { return String(value == null ? "" : value).trim() === ""; });
}

function truncateAefPaymentError_(error) {
  return String(error || "").slice(0, 500);
}

function withAefPaymentLock_(work) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { return work(); } finally { lock.releaseLock(); }
}

function logAndToastAefPayment_(message) {
  Logger.log(message);
  try { SpreadsheetApp.getActive().toast(message, "AEF Cohort 2 Payment Review", 8); } catch (error) {}
  return message;
}

// Backward-compatible names kept so old buttons or old saved links do not break.
function setupAefPaymentConfirmationAutomation() { return setupAefPaymentReviewAutomation(); }
function installAefPaymentConfirmationTriggers() { return installAefPaymentReviewTriggers(); }
function clearAefPaymentConfirmationTriggers() { return clearAefPaymentReviewTriggers(); }
function previewPendingAefPaymentRows() { return previewPendingAefPaymentConfirmationRows(); }
function handleAefPaymentConfirmedEdit(e) { return handleAefPaymentReviewEdit(e); }
function processQueuedAefPaymentConfirmations() { return processQueuedAefPaymentEmails(); }
