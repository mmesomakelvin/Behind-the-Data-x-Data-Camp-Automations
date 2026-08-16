/**
 * Analytics Engineering Fellowship Cohort 2 registration acknowledgement.
 * Project: AEF_Cohort_2_Registration
 */
const AEF_COHORT_2_CONFIG = {
  spreadsheetId: "1BIA59dL4-hx8Io7JbVB0nXshOwG0I_8i8KK0GORdm30",
  sourceSheetName: "Form responses 1",
  sourceSheetId: 2083070818,
  emailHeader: "Email address",
  fullNameHeader: "Full Name",
  statusHeader: "Registration Email Status",
  errorHeader: "Registration Email Error",
  sentAtHeader: "Registration Email Sent At",
  senderName: "Behind the Data Academy",
  subject: "Application Received – Analytics Engineering Fellowship Cohort 2",
  triggerHandler: "handleRegistrationSubmit",
  testEmailProperty: "AEF_COHORT_2_TEST_EMAIL",
  defaultTestEmail: "mmesomakelvin@gmail.com"
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("AEF Cohort 2 Registration")
    .addItem("Setup Registration Automation", "setupRegistrationAutomation")
    .addSeparator()
    .addItem("Set Test Email Recipient", "setTestEmailRecipient")
    .addItem("Send Test Registration Email", "sendRegistrationTestEmail")
    .addItem("Preview Pending Registrations", "previewPendingRegistrations")
    .addItem("Process Existing Registrations", "processExistingRegistrations")
    .addSeparator()
    .addItem("Install Auto Trigger", "installRegistrationTrigger")
    .addItem("Clear Auto Trigger", "clearRegistrationTrigger")
    .addToUi();
}

function setupRegistrationAutomation() {
  return withAefScriptLock_(function () {
    const sheet = getAefSourceSheet_();
    ensureAefRegistrationTrackingColumns_(sheet);
    installRegistrationTrigger();
    return logAndToastAef_("Registration automation is ready on: " + sheet.getName());
  });
}

function installRegistrationTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let keeperFound = false;
  let removedDuplicates = 0;

  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() !== AEF_COHORT_2_CONFIG.triggerHandler) {
      continue;
    }

    if (!keeperFound) {
      keeperFound = true;
      continue;
    }

    ScriptApp.deleteTrigger(triggers[i]);
    removedDuplicates++;
  }

  if (!keeperFound) {
    ScriptApp.newTrigger(AEF_COHORT_2_CONFIG.triggerHandler)
      .forSpreadsheet(getAefSpreadsheet_())
      .onFormSubmit()
      .create();
  }

  const state = keeperFound ? "already existed" : "installed";
  return logAndToastAef_(
    "Registration form-submit trigger " + state +
    ". Duplicate triggers removed: " + removedDuplicates
  );
}

function clearRegistrationTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;

  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === AEF_COHORT_2_CONFIG.triggerHandler) {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }

  return logAndToastAef_("Removed registration form-submit triggers: " + removed);
}

function handleRegistrationSubmit(e) {
  if (!e || !e.range) {
    Logger.log("Registration form-submit event did not include a range.");
    return;
  }

  return withAefScriptLock_(function () {
    const sheet = e.range.getSheet();
    if (!isAefSourceSheet_(sheet)) {
      Logger.log("Skipped form-submit event from non-target sheet: " + sheet.getName());
      return;
    }

    const tracking = ensureAefRegistrationTrackingColumns_(sheet);
    const columns = getAefRegistrationColumnIndexes_(getAefHeaders_(sheet));
    const sentEmails = getAefSentEmailSet_(sheet, columns, tracking);
    const result = processAefRegistrationRow_(sheet, e.range.getRow(), columns, tracking, sentEmails);
    Logger.log(
      "Processed registration row " + e.range.getRow() +
      ": " + result.status + " - " + result.message
    );
    return result;
  });
}

function processExistingRegistrations() {
  return withAefScriptLock_(function () {
    const sheet = getAefSourceSheet_();
    const tracking = ensureAefRegistrationTrackingColumns_(sheet);
    const columns = getAefRegistrationColumnIndexes_(getAefHeaders_(sheet));
    const sentEmails = getAefSentEmailSet_(sheet, columns, tracking);
    const counts = { sent: 0, failed: 0, duplicate: 0, noEmail: 0, alreadySent: 0 };

    for (let rowNumber = 2; rowNumber <= sheet.getLastRow(); rowNumber++) {
      const result = processAefRegistrationRow_(sheet, rowNumber, columns, tracking, sentEmails);
      if (result.status === "sent") counts.sent++;
      if (result.status === "failed") counts.failed++;
      if (result.status === "duplicate") counts.duplicate++;
      if (result.status === "no-email") counts.noEmail++;
      if (result.status === "already-sent") counts.alreadySent++;
    }

    return logAndToastAef_(
      "Catch-up complete. Sent: " + counts.sent +
      ", Failed: " + counts.failed +
      ", Duplicates: " + counts.duplicate +
      ", No email: " + counts.noEmail +
      ", Already sent: " + counts.alreadySent
    );
  });
}

function previewPendingRegistrations() {
  return withAefScriptLock_(function () {
    const sheet = getAefSourceSheet_();
    const tracking = ensureAefRegistrationTrackingColumns_(sheet);
    const columns = getAefRegistrationColumnIndexes_(getAefHeaders_(sheet));
    const sentEmails = getAefSentEmailSet_(sheet, columns, tracking);
    const counts = { pending: 0, duplicate: 0, noEmail: 0, alreadySent: 0 };

    if (sheet.getLastRow() >= 2) {
      const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const email = resolveAefRegistrationEmail_(row, columns);
        const currentStatus = row[tracking.statusIndex];
        const action = determineAefRegistrationAction_(email, currentStatus, sentEmails);

        if (action === "send") {
          counts.pending++;
          sentEmails[email] = true;
        } else if (action === "skip-duplicate") {
          counts.duplicate++;
        } else if (action === "skip-no-email") {
          counts.noEmail++;
        } else if (action === "skip-sent") {
          counts.alreadySent++;
        }
      }
    }

    return logAndToastAef_(
      "Preview only. Pending: " + counts.pending +
      ", Duplicates: " + counts.duplicate +
      ", No email: " + counts.noEmail +
      ", Already sent: " + counts.alreadySent
    );
  });
}

function setTestEmailRecipient() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    "Set Test Email Recipient",
    "Enter the email address that should receive test registration emails.",
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  try {
    return saveTestEmailRecipient(response.getResponseText());
  } catch (error) {
    ui.alert(String(error));
  }
}

function saveTestEmailRecipient(email) {
  const cleanEmail = normalizeAefEmail_(email);
  if (!isValidAefEmail_(cleanEmail)) {
    throw new Error("Please enter a valid test email address.");
  }

  PropertiesService.getScriptProperties()
    .setProperty(AEF_COHORT_2_CONFIG.testEmailProperty, cleanEmail);
  logAndToastAef_("Test email recipient saved: " + cleanEmail);
  return cleanEmail;
}

function sendRegistrationTestEmail() {
  const recipient = getAefTestEmailRecipient_();
  GmailApp.sendEmail(
    recipient,
    "[TEST] " + AEF_COHORT_2_CONFIG.subject,
    getAefCohort2RegistrationEmailPlainText("Test Applicant"),
    {
      htmlBody: getAefCohort2RegistrationEmailHtml("Test Applicant"),
      name: AEF_COHORT_2_CONFIG.senderName
    }
  );

  return logAndToastAef_("Test registration email sent to: " + recipient);
}

function processAefRegistrationRow_(sheet, rowNumber, columns, tracking, sentEmails) {
  if (rowNumber < 2 || rowNumber > sheet.getLastRow()) {
    return { status: "skipped", message: "Row is outside the response data range" };
  }

  const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
  const email = resolveAefRegistrationEmail_(row, columns);
  const fullName = String(row[columns.fullNameIndex] || "").trim();
  const currentStatus = row[tracking.statusIndex];
  const action = determineAefRegistrationAction_(email, currentStatus, sentEmails);

  if (action === "skip-sent") {
    return { status: "already-sent", message: "Registration email was already sent" };
  }

  if (action === "skip-no-email") {
    setAefRegistrationTracking_(sheet, rowNumber, tracking, "Skipped - No Email", "", "");
    return { status: "no-email", message: "No recipient email was found" };
  }

  if (action === "skip-duplicate") {
    setAefRegistrationTracking_(sheet, rowNumber, tracking, "Skipped - Duplicate", "", "");
    return { status: "duplicate", message: "This email already received an acknowledgement" };
  }

  try {
    GmailApp.sendEmail(
      email,
      AEF_COHORT_2_CONFIG.subject,
      getAefCohort2RegistrationEmailPlainText(fullName),
      {
        htmlBody: getAefCohort2RegistrationEmailHtml(fullName),
        name: AEF_COHORT_2_CONFIG.senderName
      }
    );

    setAefRegistrationTracking_(sheet, rowNumber, tracking, "Sent", "", new Date());
    sentEmails[email] = true;
    return { status: "sent", message: "Registration acknowledgement sent" };
  } catch (error) {
    setAefRegistrationTracking_(
      sheet,
      rowNumber,
      tracking,
      "Failed",
      truncateAefError_(error),
      ""
    );
    return { status: "failed", message: String(error) };
  }
}

function determineAefRegistrationAction_(email, currentStatus, sentEmails) {
  const normalizedEmail = normalizeAefEmail_(email);
  const normalizedStatus = String(currentStatus || "").trim().toLowerCase();

  if (!normalizedEmail) return "skip-no-email";
  if (normalizedStatus === "sent") return "skip-sent";
  if (sentEmails && sentEmails[normalizedEmail]) return "skip-duplicate";
  return "send";
}

function resolveAefRegistrationEmail_(row, columns) {
  const primary = columns.primaryEmailIndex >= 0
    ? normalizeAefEmail_(row[columns.primaryEmailIndex])
    : "";
  if (primary) return primary;

  return columns.fallbackEmailIndex >= 0
    ? normalizeAefEmail_(row[columns.fallbackEmailIndex])
    : "";
}

function getAefRegistrationColumnIndexes_(headers) {
  const targetEmail = normalizeAefHeader_(AEF_COHORT_2_CONFIG.emailHeader);
  const targetName = normalizeAefHeader_(AEF_COHORT_2_CONFIG.fullNameHeader);
  const emailIndexes = [];
  let fullNameIndex = -1;

  for (let i = 0; i < headers.length; i++) {
    const normalized = normalizeAefHeader_(headers[i]);
    if (normalized === targetEmail) emailIndexes.push(i);
    if (fullNameIndex === -1 && normalized === targetName) fullNameIndex = i;
  }

  if (!emailIndexes.length || fullNameIndex === -1) {
    throw new Error(
      "Required columns were not found. Expected Email address and Full Name in " +
      AEF_COHORT_2_CONFIG.sourceSheetName + "."
    );
  }

  return {
    primaryEmailIndex: emailIndexes[0],
    fullNameIndex: fullNameIndex,
    fallbackEmailIndex: emailIndexes.length > 1 ? emailIndexes[1] : -1
  };
}

function ensureAefRegistrationTrackingColumns_(sheet) {
  const headers = getAefHeaders_(sheet);
  const workingHeaders = headers.slice();
  const labels = [
    AEF_COHORT_2_CONFIG.statusHeader,
    AEF_COHORT_2_CONFIG.errorHeader,
    AEF_COHORT_2_CONFIG.sentAtHeader
  ];
  const indexes = [];

  for (let i = 0; i < labels.length; i++) {
    let index = findExactAefHeaderIndex_(workingHeaders, labels[i]);
    if (index === -1) {
      workingHeaders.push(labels[i]);
      index = workingHeaders.length - 1;
      sheet.getRange(1, index + 1)
        .setValue(labels[i])
        .setFontWeight("bold")
        .setBackground("#dbeafe")
        .setFontColor("#0f2747");
    }
    indexes.push(index);
  }

  sheet.setFrozenRows(1);
  return {
    statusIndex: indexes[0],
    errorIndex: indexes[1],
    sentAtIndex: indexes[2]
  };
}

function getAefSentEmailSet_(sheet, columns, tracking) {
  const sentEmails = {};
  if (sheet.getLastRow() < 2) return sentEmails;

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][tracking.statusIndex] || "").trim().toLowerCase() !== "sent") {
      continue;
    }

    const email = resolveAefRegistrationEmail_(rows[i], columns);
    if (email) sentEmails[email] = true;
  }
  return sentEmails;
}

function setAefRegistrationTracking_(sheet, rowNumber, tracking, status, error, sentAt) {
  sheet.getRange(rowNumber, tracking.statusIndex + 1).setValue(status);
  sheet.getRange(rowNumber, tracking.errorIndex + 1).setValue(truncateAefError_(error));
  sheet.getRange(rowNumber, tracking.sentAtIndex + 1).setValue(sentAt || "");
}

function getAefSpreadsheet_() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (active && active.getId() === AEF_COHORT_2_CONFIG.spreadsheetId) {
    return active;
  }
  return SpreadsheetApp.openById(AEF_COHORT_2_CONFIG.spreadsheetId);
}

function getAefSourceSheet_() {
  const sheet = getAefSpreadsheet_().getSheetByName(AEF_COHORT_2_CONFIG.sourceSheetName);
  if (!sheet || !isAefSourceSheet_(sheet)) {
    throw new Error(
      "Could not find the required source tab: " + AEF_COHORT_2_CONFIG.sourceSheetName
    );
  }
  getAefRegistrationColumnIndexes_(getAefHeaders_(sheet));
  return sheet;
}

function isAefSourceSheet_(sheet) {
  return Boolean(
    sheet &&
    sheet.getName() === AEF_COHORT_2_CONFIG.sourceSheetName &&
    sheet.getSheetId() === AEF_COHORT_2_CONFIG.sourceSheetId &&
    sheet.getParent().getId() === AEF_COHORT_2_CONFIG.spreadsheetId
  );
}

function getAefHeaders_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(function (value) {
    return String(value || "").trim();
  });
}

function findExactAefHeaderIndex_(headers, label) {
  const target = normalizeAefHeader_(label);
  for (let i = 0; i < headers.length; i++) {
    if (normalizeAefHeader_(headers[i]) === target) return i;
  }
  return -1;
}

function normalizeAefEmail_(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeAefHeader_(value) {
  return String(value || "").trim().toLowerCase();
}

function truncateAefError_(value) {
  return String(value || "").slice(0, 500);
}

function isValidAefEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeAefEmail_(value));
}

function getAefTestEmailRecipient_() {
  const saved = PropertiesService.getScriptProperties()
    .getProperty(AEF_COHORT_2_CONFIG.testEmailProperty);
  if (isValidAefEmail_(saved)) return normalizeAefEmail_(saved);

  const activeUserEmail = Session.getActiveUser().getEmail();
  if (isValidAefEmail_(activeUserEmail)) return normalizeAefEmail_(activeUserEmail);
  return AEF_COHORT_2_CONFIG.defaultTestEmail;
}

function withAefScriptLock_(callback) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    Logger.log("Skipped run: could not acquire the registration script lock.");
    return;
  }

  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}

function logAndToastAef_(message) {
  Logger.log(message);
  try {
    SpreadsheetApp.getActive().toast(message, "AEF Cohort 2 Registration", 7);
  } catch (error) {
    // UI feedback is unavailable during non-interactive trigger execution.
  }
  return message;
}
