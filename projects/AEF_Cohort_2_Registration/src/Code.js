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
  acceptanceEditHandler: "handleAcceptanceDecisionEdit",
  acceptanceRetryHandler: "processQueuedAcceptanceEdits",
  acceptanceRetryPropertyPrefix: "AEF_ACCEPTANCE_RETRY_",
  testEmailProperty: "AEF_COHORT_2_TEST_EMAIL",
  selectionSheetName: "Selection Map",
  acceptanceSubject: "You are Accepted: Analytics Engineering Fellowship Cohort 2 | Behind the Data Academy",
  cohort1AcceptanceFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfqr5JO36Vo1R-HPTih64GFVGdoMBeXYPb2wcaq6yHZfmRCyg/viewform",
  acceptanceFormUrl: "https://docs.google.com/forms/d/e/1FAIpQLSe9cRTvZ_p6jCL2lWw8ryK2WWX_rG4QjbcvZEzQxJkJ6ceMLg/viewform?usp=dialog",
  acceptanceFormIdProperty: "AEF_COHORT_2_ACCEPTANCE_FORM_ID",
  acceptanceFormUrlProperty: "AEF_COHORT_2_ACCEPTANCE_FORM_URL",
  oldComplianceDocumentId: "1r5aKeScDitYzioKv7fuBS3XWIEL9nXRzQKgSipVSzKM",
  complianceDocumentUrl: "https://docs.google.com/document/d/1icI-afhVqYoaV6GLAr9CpU_A_2c26Zg-L3e-0fXKtOM/edit"
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
    .addItem("Refresh Selection Map", "refreshAefSelectionMap")
    .addItem("Setup Cohort 2 Acceptance Form", "setupCohort2AcceptanceForm")
    .addItem("Preview Acceptance Email", "previewAcceptanceEmail")
    .addItem("Send Acceptance Test Email", "sendAcceptanceTestEmail")
    .addItem("Send Accepted Applicants", "sendAcceptedApplicants")
    .addSeparator()
    .addItem("Install Auto Trigger", "installRegistrationTrigger")
    .addItem("Clear Auto Trigger", "clearRegistrationTrigger")
    .addToUi();
}

function setupRegistrationAutomation() {
  return withAefScriptLock_(function () {
    const sheet = getAefSourceSheet_();
    ensureAefRegistrationTrackingColumns_(sheet);
    installRegistrationTrigger_();
    return logAndToastAef_("Registration automation is ready on: " + sheet.getName());
  });
}

function installRegistrationTrigger() {
  return withAefScriptLock_(installRegistrationTrigger_);
}

function installRegistrationTrigger_() {
  const triggers = ScriptApp.getProjectTriggers();
  let keeperFound = false;
  let removedConflicts = 0;

  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() !== AEF_COHORT_2_CONFIG.triggerHandler) {
      continue;
    }

    if (isMatchingAefRegistrationTrigger_(triggers[i]) && !keeperFound) {
      keeperFound = true;
      continue;
    }

    ScriptApp.deleteTrigger(triggers[i]);
    removedConflicts++;
  }

  if (!keeperFound) {
    ScriptApp.newTrigger(AEF_COHORT_2_CONFIG.triggerHandler)
      .forSpreadsheet(getAefSpreadsheet_())
      .onFormSubmit()
      .create();
  }

  const state = keeperFound ? "already existed" : "installed";
  const acceptanceState = installAcceptanceEditTrigger_();
  const retryState = installAcceptanceRetryTrigger_();
  return logAndToastAef_(
    "Registration form-submit trigger " + state +
    ". Acceptance edit trigger " + acceptanceState.state +
    ". Acceptance retry trigger " + retryState.state +
    ". Duplicate or conflicting triggers removed: " +
    (removedConflicts + acceptanceState.removed + retryState.removed)
  );
}

function installAcceptanceEditTrigger_() {
  const triggers = ScriptApp.getProjectTriggers();
  let keeperFound = false;
  let removed = 0;

  for (let i = 0; i < triggers.length; i++) {
    if (
      triggers[i].getHandlerFunction() !==
      AEF_COHORT_2_CONFIG.acceptanceEditHandler
    ) {
      continue;
    }

    if (isMatchingAefAcceptanceEditTrigger_(triggers[i]) && !keeperFound) {
      keeperFound = true;
      continue;
    }

    ScriptApp.deleteTrigger(triggers[i]);
    removed++;
  }

  if (!keeperFound) {
    ScriptApp.newTrigger(AEF_COHORT_2_CONFIG.acceptanceEditHandler)
      .forSpreadsheet(getAefSpreadsheet_())
      .onEdit()
      .create();
  }

  return {
    state: keeperFound ? "already existed" : "installed",
    removed: removed
  };
}

function isMatchingAefAcceptanceEditTrigger_(trigger) {
  try {
    return Boolean(
      trigger &&
      trigger.getHandlerFunction() === AEF_COHORT_2_CONFIG.acceptanceEditHandler &&
      trigger.getEventType() === ScriptApp.EventType.ON_EDIT &&
      trigger.getTriggerSource() === ScriptApp.TriggerSource.SPREADSHEETS &&
      trigger.getTriggerSourceId() === AEF_COHORT_2_CONFIG.spreadsheetId
    );
  } catch (error) {
    return false;
  }
}

function installAcceptanceRetryTrigger_() {
  const triggers = ScriptApp.getProjectTriggers();
  let keeperFound = false;
  let removed = 0;

  for (let i = 0; i < triggers.length; i++) {
    if (
      triggers[i].getHandlerFunction() !==
      AEF_COHORT_2_CONFIG.acceptanceRetryHandler
    ) {
      continue;
    }

    if (isMatchingAefAcceptanceRetryTrigger_(triggers[i]) && !keeperFound) {
      keeperFound = true;
      continue;
    }

    ScriptApp.deleteTrigger(triggers[i]);
    removed++;
  }

  if (!keeperFound) {
    ScriptApp.newTrigger(AEF_COHORT_2_CONFIG.acceptanceRetryHandler)
      .timeBased()
      .everyMinutes(5)
      .create();
  }

  return {
    state: keeperFound ? "already existed" : "installed",
    removed: removed
  };
}

function isMatchingAefAcceptanceRetryTrigger_(trigger) {
  try {
    return Boolean(
      trigger &&
      trigger.getHandlerFunction() === AEF_COHORT_2_CONFIG.acceptanceRetryHandler &&
      trigger.getEventType() === ScriptApp.EventType.CLOCK
    );
  } catch (error) {
    return false;
  }
}

function isMatchingAefRegistrationTrigger_(trigger) {
  try {
    return Boolean(
      trigger &&
      trigger.getHandlerFunction() === AEF_COHORT_2_CONFIG.triggerHandler &&
      trigger.getEventType() === ScriptApp.EventType.ON_FORM_SUBMIT &&
      trigger.getTriggerSource() === ScriptApp.TriggerSource.SPREADSHEETS &&
      trigger.getTriggerSourceId() === AEF_COHORT_2_CONFIG.spreadsheetId
    );
  } catch (error) {
    return false;
  }
}

function clearRegistrationTrigger() {
  return withAefScriptLock_(clearRegistrationTrigger_);
}

function clearRegistrationTrigger_() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;

  for (let i = 0; i < triggers.length; i++) {
    const handler = triggers[i].getHandlerFunction();
    if (
      handler === AEF_COHORT_2_CONFIG.triggerHandler ||
      handler === AEF_COHORT_2_CONFIG.acceptanceEditHandler ||
      handler === AEF_COHORT_2_CONFIG.acceptanceRetryHandler
    ) {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }

  const queuedRemoved = clearAefAcceptanceRetryQueue_();

  return logAndToastAef_(
    "Removed registration, acceptance, and retry triggers: " + removed +
    ". Cleared waiting acceptance emails: " + queuedRemoved
  );
}

function clearAefAcceptanceRetryQueue_() {
  const properties = PropertiesService.getScriptProperties();
  const allProperties = properties.getProperties();
  const prefix = AEF_COHORT_2_CONFIG.acceptanceRetryPropertyPrefix;
  let removed = 0;

  Object.keys(allProperties).forEach(function (key) {
    if (key.indexOf(prefix) !== 0) return;
    properties.deleteProperty(key);
    removed++;
  });
  return removed;
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
    const counts = {
      sent: 0,
      failed: 0,
      trackingFailed: 0,
      duplicate: 0,
      noEmail: 0,
      alreadySent: 0,
      reconciliation: 0
    };

    for (let rowNumber = 2; rowNumber <= sheet.getLastRow(); rowNumber++) {
      const result = processAefRegistrationRow_(sheet, rowNumber, columns, tracking, sentEmails);
      if (result.status === "sent") counts.sent++;
      if (result.status === "failed") counts.failed++;
      if (result.status === "tracking-failed") counts.trackingFailed++;
      if (result.status === "duplicate") counts.duplicate++;
      if (result.status === "no-email") counts.noEmail++;
      if (result.status === "already-sent") counts.alreadySent++;
      if (result.status === "reconciliation") counts.reconciliation++;
    }

    return logAndToastAef_(
      "Catch-up complete. Sent: " + counts.sent +
      ", Failed: " + counts.failed +
      ", Tracking failures: " + counts.trackingFailed +
      ", Duplicates: " + counts.duplicate +
      ", No email: " + counts.noEmail +
      ", Already sent: " + counts.alreadySent +
      ", Needs reconciliation: " + counts.reconciliation
    );
  });
}

function previewPendingRegistrations() {
  return withAefScriptLock_(function () {
    const sheet = getAefSourceSheet_();
    const headers = getAefHeaders_(sheet);
    const tracking = getAefRegistrationTrackingColumnIndexes_(headers);
    const columns = getAefRegistrationColumnIndexes_(headers);
    const sentEmails = getAefSentEmailSet_(sheet, columns, tracking);
    const counts = { pending: 0, duplicate: 0, noEmail: 0, alreadySent: 0, reconciliation: 0 };

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
        } else if (action === "skip-reconciliation") {
          counts.reconciliation++;
        }
      }
    }

    return logAndToastAef_(
      "Preview only. Pending: " + counts.pending +
      ", Duplicates: " + counts.duplicate +
      ", No email: " + counts.noEmail +
      ", Already sent: " + counts.alreadySent +
      ", Needs reconciliation: " + counts.reconciliation
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

function refreshAefSelectionMap() {
  return withAefScriptLock_(function () {
    const spreadsheet = getAefSpreadsheet_();
    const sourceSheet = getAefSourceSheet_();
    let selectionSheet = spreadsheet.getSheetByName(AEF_COHORT_2_CONFIG.selectionSheetName);
    if (!selectionSheet) {
      selectionSheet = spreadsheet.insertSheet(AEF_COHORT_2_CONFIG.selectionSheetName);
    }

    const sourceHeaders = getAefHeaders_(sourceSheet);
    const sourceRows = sourceSheet.getLastRow() < 2
      ? []
      : sourceSheet.getRange(
        2,
        1,
        sourceSheet.getLastRow() - 1,
        sourceSheet.getLastColumn()
      ).getValues();

    let existingHeaders = [];
    let existingRows = [];
    if (selectionSheet.getLastRow() >= 1) {
      existingHeaders = getAefHeaders_(selectionSheet);
      if (selectionSheet.getLastRow() >= 2) {
        existingRows = selectionSheet.getRange(
          2,
          1,
          selectionSheet.getLastRow() - 1,
          selectionSheet.getLastColumn()
        ).getValues();
      }
    }

    const headers = getAefSelectionHeaders_();
    const rows = buildAefSelectionRows_(
      sourceHeaders,
      sourceRows,
      existingHeaders,
      existingRows
    );

    selectionSheet.clearContents();
    selectionSheet.getRange(1, 1, 1, headers.length)
      .setValues([headers])
      .setFontWeight("bold")
      .setBackground("#0f2747")
      .setFontColor("#ffffff");

    if (rows.length) {
      selectionSheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
      const decisionRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(["Under Review", "Accepted", "Not Selected"], true)
        .setAllowInvalid(false)
        .build();
      selectionSheet.getRange(2, 10, rows.length, 1).setDataValidation(decisionRule);
    }

    selectionSheet.setFrozenRows(1);
    selectionSheet.autoResizeColumns(1, headers.length);
    selectionSheet.setColumnWidth(7, 260);
    selectionSheet.setColumnWidth(8, 220);
    selectionSheet.setColumnWidth(12, 260);

    return logAndToastAef_(
      "Selection Map refreshed. Applicants willing to make the deposit: " + rows.length
    );
  });
}

function setupCohort2AcceptanceForm() {
  return withAefScriptLock_(function () {
    const properties = PropertiesService.getScriptProperties();
    const savedId = properties.getProperty(AEF_COHORT_2_CONFIG.acceptanceFormIdProperty);
    let form;

    if (savedId) {
      try {
        form = FormApp.openById(savedId);
      } catch (error) {
        form = null;
      }
    }

    if (!form) {
      const cohort1Form = findAefFormByPublishedUrl_(
        AEF_COHORT_2_CONFIG.cohort1AcceptanceFormUrl
      );
      const copiedFile = DriveApp.getFileById(cohort1Form.getId()).makeCopy(
        "Analytics Engineering Fellowship Cohort 2 - Acceptance Form"
      );
      form = FormApp.openById(copiedFile.getId());
      // Save the copy immediately. If a later wording update fails, rerunning
      // setup repairs this copy instead of creating another Cohort 2 form.
      properties.setProperty(
        AEF_COHORT_2_CONFIG.acceptanceFormIdProperty,
        form.getId()
      );
    }

    adaptAefCohort2AcceptanceForm_(form);
    const publishedUrl = form.getPublishedUrl();
    properties.setProperties({
      AEF_COHORT_2_ACCEPTANCE_FORM_ID: form.getId(),
      AEF_COHORT_2_ACCEPTANCE_FORM_URL: publishedUrl
    });

    logAndToastAef_("Cohort 2 acceptance form is ready: " + publishedUrl);
    return publishedUrl;
  });
}

function findAefFormByPublishedUrl_(publishedUrl) {
  const targetUrl = normalizeAefPublishedFormUrl_(publishedUrl);
  const files = DriveApp.searchFiles(
    "mimeType = 'application/vnd.google-apps.form' and trashed = false"
  );

  while (files.hasNext()) {
    const file = files.next();
    try {
      const form = FormApp.openById(file.getId());
      if (normalizeAefPublishedFormUrl_(form.getPublishedUrl()) === targetUrl) {
        return form;
      }
    } catch (error) {
      // Skip forms this account can see in Drive but cannot edit through Apps Script.
    }
  }

  throw new Error(
    "The Cohort 1 acceptance form could not be found in this Google account. " +
    "Make sure the account running this script can edit that form."
  );
}

function normalizeAefPublishedFormUrl_(value) {
  return String(value || "").trim().split("?")[0].replace(/\/$/, "");
}

function adaptAefCohort2AcceptanceForm_(form) {
  form.setTitle("Analytics Engineering Fellowship Cohort 2 - Acceptance Form");

  const description = replaceAefCohort2FormText_(form.getDescription());
  const cohortNote =
    "Cohort 2 starts September 1, 2026. The Beginner Phase runs for two months, " +
    "followed by the two-month Advanced Phase.";
  form.setDescription(description.indexOf(cohortNote) === -1
    ? [description, cohortNote].filter(Boolean).join("\n\n")
    : description);

  const confirmation = replaceAefCohort2FormText_(form.getConfirmationMessage());
  if (confirmation) form.setConfirmationMessage(confirmation);

  form.getItems().forEach(function (item) {
    item.setTitle(replaceAefCohort2FormText_(item.getTitle()));
    const helpTextItem = getAefHelpTextItem_(item);
    if (helpTextItem) {
      helpTextItem.setHelpText(
        replaceAefCohort2FormText_(helpTextItem.getHelpText())
      );
      adaptAefCohort2ChoiceText_(helpTextItem);
    }
  });

  if (
    typeof form.supportsAdvancedResponderPermissions === "function" &&
    form.supportsAdvancedResponderPermissions()
  ) {
    // Copied forms can be unpublished. Publishing also enables responses.
    form.setPublished(true);
  } else {
    form.setAcceptingResponses(true);
  }
  return form;
}

function getAefHelpTextItem_(item) {
  if (typeof item.getHelpText === "function" && typeof item.setHelpText === "function") {
    return item;
  }

  const castMethods = [
    ["CHECKBOX", "asCheckboxItem"],
    ["CHECKBOX_GRID", "asCheckboxGridItem"],
    ["DATE", "asDateItem"],
    ["DATETIME", "asDateTimeItem"],
    ["DURATION", "asDurationItem"],
    ["FILE_UPLOAD", "asFileUploadItem"],
    ["GRID", "asGridItem"],
    ["LIST", "asListItem"],
    ["MULTIPLE_CHOICE", "asMultipleChoiceItem"],
    ["PAGE_BREAK", "asPageBreakItem"],
    ["PARAGRAPH_TEXT", "asParagraphTextItem"],
    ["SCALE", "asScaleItem"],
    ["SECTION_HEADER", "asSectionHeaderItem"],
    ["TEXT", "asTextItem"],
    ["TIME", "asTimeItem"]
  ];
  const itemType = item.getType();

  for (let i = 0; i < castMethods.length; i++) {
    const typeName = castMethods[i][0];
    const methodName = castMethods[i][1];
    if (
      FormApp.ItemType[typeName] === itemType &&
      typeof item[methodName] === "function"
    ) {
      const typedItem = item[methodName]();
      if (
        typeof typedItem.getHelpText === "function" &&
        typeof typedItem.setHelpText === "function"
      ) {
        return typedItem;
      }
    }
  }
  return null;
}

function adaptAefCohort2ChoiceText_(typedItem) {
  let choices = null;
  if (
    typeof typedItem.getChoices === "function" &&
    typeof typedItem.createChoice === "function" &&
    typeof typedItem.setChoices === "function"
  ) {
    const originalChoices = typedItem.getChoices();
    const updatedValues = originalChoices.map(function (choice) {
      return replaceAefCohort2FormText_(choice.getValue());
    });
    const changed = updatedValues.some(function (value, index) {
      return value !== originalChoices[index].getValue();
    });
    if (changed) {
      typedItem.setChoices(originalChoices.map(function (choice, index) {
        return createAdaptedAefChoice_(typedItem, choice, updatedValues[index]);
      }));
    }
  } else if (
    typeof typedItem.getChoiceValues === "function" &&
    typeof typedItem.setChoiceValues === "function"
  ) {
    choices = typedItem.getChoiceValues();
  } else if (
    typeof typedItem.getChoices === "function" &&
    typeof typedItem.setChoiceValues === "function"
  ) {
    choices = typedItem.getChoices().map(function (choice) {
      return choice.getValue();
    });
  }

  if (choices) {
    const updatedChoices = choices.map(replaceAefCohort2FormText_);
    if (updatedChoices.some(function (value, index) { return value !== choices[index]; })) {
      typedItem.setChoiceValues(updatedChoices);
    }
  }

  if (typeof typedItem.getRows === "function" && typeof typedItem.setRows === "function") {
    const rows = typedItem.getRows();
    const updatedRows = rows.map(replaceAefCohort2FormText_);
    if (updatedRows.some(function (value, index) { return value !== rows[index]; })) {
      typedItem.setRows(updatedRows);
    }
  }

  if (
    typeof typedItem.getColumns === "function" &&
    typeof typedItem.setColumns === "function"
  ) {
    const columns = typedItem.getColumns();
    const updatedColumns = columns.map(replaceAefCohort2FormText_);
    if (updatedColumns.some(function (value, index) { return value !== columns[index]; })) {
      typedItem.setColumns(updatedColumns);
    }
  }
}

function createAdaptedAefChoice_(typedItem, originalChoice, value) {
  if (typeof originalChoice.getGotoPage === "function") {
    const destination = originalChoice.getGotoPage();
    if (destination) return typedItem.createChoice(value, destination);
  }
  if (typeof originalChoice.getPageNavigationType === "function") {
    const navigationType = originalChoice.getPageNavigationType();
    if (navigationType) return typedItem.createChoice(value, navigationType);
  }
  return typedItem.createChoice(value);
}

function replaceAefCohort2FormText_(value) {
  return String(value || "")
    .replace(/Cohort\s*1/gi, "Cohort 2")
    .replace(new RegExp(AEF_COHORT_2_CONFIG.oldComplianceDocumentId, "g"),
      "1icI-afhVqYoaV6GLAr9CpU_A_2c26Zg-L3e-0fXKtOM")
    .replace(/(?:Wednesday,\s*)?(?:February\s*18|18\s+February),?\s*2026/gi,
      "within 72 hours of receiving your acceptance email")
    .replace(/within\s+24\s+hours/gi, "within 72 hours")
    .replace(/First\s+3\s+Months/gi, "First 2 Months")
    .replace(/Final\s+3\s+Months/gi, "Final 2 Months")
    .replace(/six[- ]month/gi, "four-month");
}

function getAefCohort2AcceptanceFormUrl_() {
  return AEF_COHORT_2_CONFIG.acceptanceFormUrl;
}

function previewAcceptanceEmail() {
  const html = HtmlService.createHtmlOutput(
    getAefCohort2AcceptanceEmailHtml("Accepted Applicant")
  ).setWidth(760).setHeight(650);
  SpreadsheetApp.getUi().showModalDialog(html, "Cohort 2 Acceptance Email Preview");
}

function sendAcceptanceTestEmail() {
  const recipient = getAefTestEmailRecipient_();
  GmailApp.sendEmail(
    recipient,
    "[TEST] " + AEF_COHORT_2_CONFIG.acceptanceSubject,
    getAefCohort2AcceptanceEmailPlainText("Accepted Applicant"),
    {
      htmlBody: getAefCohort2AcceptanceEmailHtml("Accepted Applicant"),
      name: AEF_COHORT_2_CONFIG.senderName
    }
  );
  return logAndToastAef_("Test acceptance email sent to: " + recipient);
}

function sendAcceptedApplicants() {
  const sheet = getAefSelectionSheet_();
  const confirmedEmails = getAefPendingAcceptanceEmails_(sheet);
  const pendingCount = confirmedEmails.length;
  if (!pendingCount) {
    return logAndToastAef_("No unsent applicants are marked Accepted.");
  }

  const ui = SpreadsheetApp.getUi();
  const answer = ui.alert(
    "Send acceptance emails?",
    "This will email " + pendingCount +
      " applicant(s) marked Accepted. Already-sent applicants will be skipped.",
    ui.ButtonSet.YES_NO
  );
  if (answer !== ui.Button.YES) {
    return logAndToastAef_("Acceptance email sending was cancelled.");
  }

  return withAefScriptLock_(function () {
    const currentEmails = getAefPendingAcceptanceEmails_(getAefSelectionSheet_());
    if (!areSameAefEmailLists_(confirmedEmails, currentEmails)) {
      return logAndToastAef_(
        "The Accepted selection changed. No emails were sent. Review it and click send again."
      );
    }
    const summary = processAefAcceptanceRows_(getAefSelectionSheet_());
    return logAndToastAef_(
      "Acceptance emails finished. Sent: " + summary.sent +
      ", Failed: " + summary.failed +
      ", Needs review: " + summary.review
    );
  });
}

function handleAcceptanceDecisionEdit(e) {
  if (!e || !e.range) {
    Logger.log("Acceptance edit event did not include a range.");
    return;
  }

  const sheet = e.range.getSheet();
  if (
    !sheet ||
    sheet.getName() !== AEF_COHORT_2_CONFIG.selectionSheetName ||
    sheet.getParent().getId() !== AEF_COHORT_2_CONFIG.spreadsheetId
  ) {
    return;
  }

  const columns = getAefAcceptanceColumnIndexes_(getAefHeaders_(sheet));
  const decisionColumn = columns.decisionIndex + 1;
  const firstColumn = e.range.getColumn();
  const lastColumn = firstColumn + e.range.getNumColumns() - 1;
  if (decisionColumn < firstColumn || decisionColumn > lastColumn) return;

  if (
    e.range.getNumRows() === 1 &&
    e.range.getNumColumns() === 1 &&
    normalizeAefHeader_(e.value) !== "accepted"
  ) {
    return;
  }

  const firstRow = Math.max(e.range.getRow(), 2);
  const lastRow = e.range.getRow() + e.range.getNumRows() - 1;
  if (firstRow > lastRow) return;

  const editedValues = sheet.getRange(
    firstRow,
    1,
    lastRow - firstRow + 1,
    sheet.getLastColumn()
  ).getValues();
  const editedApplicantKeys = [];
  editedValues.forEach(function (row) {
    if (normalizeAefHeader_(row[columns.decisionIndex]) !== "accepted") return;
    const applicantKey = getAefAcceptanceApplicantKey_(row, columns);
    if (applicantKey && editedApplicantKeys.indexOf(applicantKey) === -1) {
      editedApplicantKeys.push(applicantKey);
    }
  });
  if (!editedApplicantKeys.length) return;

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    let queued = 0;
    try {
      const properties = PropertiesService.getScriptProperties();
      editedApplicantKeys.forEach(function (applicantKey) {
        const propertyKey =
          AEF_COHORT_2_CONFIG.acceptanceRetryPropertyPrefix + Utilities.getUuid();
        properties.setProperty(
          propertyKey,
          JSON.stringify({
            applicantKey: applicantKey,
            queuedAt: new Date().toISOString()
          })
        );
        queued++;
      });
    } catch (error) {
      Logger.log("Could not queue delayed acceptance edits: " + truncateAefError_(error));
    }
    Logger.log("Acceptance edit queued for retry. Applicants queued: " + queued);
    return { sent: 0, failed: 0, skipped: 0, review: queued };
  }

  try {
    const currentColumns = getAefAcceptanceColumnIndexes_(getAefHeaders_(sheet));
    if (sheet.getLastRow() < 2) {
      return { sent: 0, failed: 0, skipped: 0, review: 0 };
    }
    const currentRows = sheet.getRange(
      2,
      1,
      sheet.getLastRow() - 1,
      sheet.getLastColumn()
    ).getValues();
    const editedApplicantSet = {};
    editedApplicantKeys.forEach(function (applicantKey) {
      editedApplicantSet[applicantKey] = true;
    });
    const currentRowNumbers = [];
    currentRows.forEach(function (row, index) {
      const applicantKey = getAefAcceptanceApplicantKey_(row, currentColumns);
      if (editedApplicantSet[applicantKey]) currentRowNumbers.push(index + 2);
    });

    const summary = processAefAcceptanceRows_(sheet, currentRowNumbers);
    Logger.log(
      "Processed acceptance Decision edit. Sent: " + summary.sent +
      ", Failed: " + summary.failed +
      ", Needs review: " + summary.review
    );
    return summary;
  } finally {
    lock.releaseLock();
  }
}

function processQueuedAcceptanceEdits() {
  const properties = PropertiesService.getScriptProperties();
  const allProperties = properties.getProperties();
  const prefix = AEF_COHORT_2_CONFIG.acceptanceRetryPropertyPrefix;
  const queuedPropertyKeys = Object.keys(allProperties).filter(function (key) {
    return key.indexOf(prefix) === 0;
  });
  const emptySummary = { sent: 0, failed: 0, skipped: 0, review: 0 };
  if (!queuedPropertyKeys.length) return emptySummary;

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    Logger.log("Acceptance retry remains queued because another automation is busy.");
    return emptySummary;
  }

  try {
    const sheet = getAefSelectionSheet_();
    const columns = getAefAcceptanceColumnIndexes_(getAefHeaders_(sheet));
    const queuedApplicantSet = {};
    queuedPropertyKeys.forEach(function (propertyKey) {
      try {
        const applicantKey = getAefAcceptanceRetryApplicantKey_(
          propertyKey,
          allProperties[propertyKey]
        );
        if (applicantKey) queuedApplicantSet[applicantKey] = true;
      } catch (error) {
        Logger.log("Ignored an invalid acceptance retry key: " + propertyKey);
      }
    });

    const rowNumbers = [];
    if (sheet.getLastRow() >= 2) {
      const rows = sheet.getRange(
        2,
        1,
        sheet.getLastRow() - 1,
        sheet.getLastColumn()
      ).getValues();
      rows.forEach(function (row, index) {
        const applicantKey = getAefAcceptanceApplicantKey_(row, columns);
        if (
          queuedApplicantSet[applicantKey] &&
          normalizeAefHeader_(row[columns.decisionIndex]) === "accepted"
        ) {
          rowNumbers.push(index + 2);
        }
      });
    }

    const summary = processAefAcceptanceRows_(sheet, rowNumbers);
    queuedPropertyKeys.forEach(function (propertyKey) {
      properties.deleteProperty(propertyKey);
    });
    Logger.log(
      "Processed queued acceptance edits. Sent: " + summary.sent +
      ", Failed: " + summary.failed +
      ", Needs review: " + summary.review
    );
    return summary;
  } finally {
    lock.releaseLock();
  }
}

function getAefAcceptanceRetryApplicantKey_(propertyKey, propertyValue) {
  try {
    const payload = JSON.parse(String(propertyValue || ""));
    if (payload && payload.applicantKey) {
      return String(payload.applicantKey);
    }
  } catch (error) {
    // Older retry entries stored the applicant key in the property name.
  }

  return decodeURIComponent(
    String(propertyKey || "").slice(
      AEF_COHORT_2_CONFIG.acceptanceRetryPropertyPrefix.length
    )
  );
}

function processAefAcceptanceRows_(sheet, onlyRowNumbers) {
  const headers = getAefHeaders_(sheet);
  const columns = getAefAcceptanceColumnIndexes_(headers);
  const tracking = {
    statusIndex: columns.statusIndex,
    errorIndex: columns.errorIndex,
    sentAtIndex: columns.sentAtIndex
  };
  const sentEmails = getAefSentEmailSet_(sheet, columns, tracking);
  const summary = { sent: 0, failed: 0, skipped: 0, review: 0 };

  if (sheet.getLastRow() < 2) return summary;
  const rows = sheet.getRange(
    2,
    1,
    sheet.getLastRow() - 1,
    sheet.getLastColumn()
  ).getValues();

  rows.forEach(function (row, index) {
    const rowNumber = index + 2;
    if (onlyRowNumbers && onlyRowNumbers.indexOf(rowNumber) === -1) return;
    const email = resolveAefRegistrationEmail_(row, columns);
    const action = determineAefAcceptanceAction_(
      row[columns.decisionIndex],
      email,
      row[columns.statusIndex],
      sentEmails
    );

    if (action === "skip-no-email") {
      setAefRegistrationTracking_(
        sheet,
        rowNumber,
        tracking,
        "Skipped - No Email",
        "No valid recipient email was found",
        ""
      );
      summary.skipped++;
      return;
    }
    if (action === "skip-reconciliation") {
      summary.review++;
      return;
    }
    if (action !== "send") {
      summary.skipped++;
      return;
    }

    try {
      setAefRegistrationTracking_(sheet, rowNumber, tracking, "Sending", "", "");
      SpreadsheetApp.flush();
    } catch (error) {
      Logger.log(
        "Could not reserve acceptance row " + rowNumber +
        " before sending: " + truncateAefError_(error)
      );
      summary.failed++;
      summary.review++;
      return;
    }

    const fullName = String(row[columns.fullNameIndex] || "").trim();
    try {
      GmailApp.sendEmail(
        email,
        AEF_COHORT_2_CONFIG.acceptanceSubject,
        getAefCohort2AcceptanceEmailPlainText(fullName),
        {
          htmlBody: getAefCohort2AcceptanceEmailHtml(fullName),
          name: AEF_COHORT_2_CONFIG.senderName
        }
      );
    } catch (error) {
      try {
        setAefRegistrationTracking_(
          sheet,
          rowNumber,
          tracking,
          "Failed",
          truncateAefError_(error),
          ""
        );
      } catch (trackingError) {
        Logger.log(
          "Acceptance email failed for row " + rowNumber +
          " and the failure could not be fully tracked: " +
          truncateAefError_(trackingError)
        );
        try {
          sheet.getRange(rowNumber, tracking.errorIndex + 1).setValue(
            truncateAefError_(
              "Email failed: " + error + "; tracking write failed: " + trackingError
            )
          );
        } catch (secondaryError) {
          Logger.log(
            "Could not record the acceptance failure details for row " + rowNumber +
            ": " + truncateAefError_(secondaryError)
          );
        }
        summary.review++;
      }
      summary.failed++;
      return;
    }

    sentEmails[email] = true;
    summary.sent++;
    try {
      setAefRegistrationTracking_(sheet, rowNumber, tracking, "Sent", "", new Date());
    } catch (error) {
      Logger.log(
        "Acceptance email was sent for row " + rowNumber +
        ", but final tracking failed: " + truncateAefError_(error)
      );
      try {
        sheet.getRange(rowNumber, tracking.errorIndex + 1).setValue(
          truncateAefError_("Email sent; final tracking failed: " + error)
        );
      } catch (secondaryError) {
        Logger.log(
          "Could not record the acceptance tracking error for row " + rowNumber +
          ": " + truncateAefError_(secondaryError)
        );
      }
      summary.review++;
    }
  });

  return summary;
}

function determineAefAcceptanceAction_(decision, email, currentStatus, sentEmails) {
  if (normalizeAefHeader_(decision) !== "accepted") return "skip-decision";

  const normalizedStatus = normalizeAefHeader_(currentStatus);
  if (normalizedStatus === "sent") return "skip-sent";
  if (normalizedStatus === "sending") return "skip-reconciliation";
  if (!isValidAefEmail_(email)) return "skip-no-email";

  const normalizedEmail = normalizeAefEmail_(email);
  if (sentEmails && sentEmails[normalizedEmail]) return "skip-duplicate";
  return "send";
}

function getAefPendingAcceptanceEmails_(sheet) {
  if (sheet.getLastRow() < 2) return [];
  const columns = getAefAcceptanceColumnIndexes_(getAefHeaders_(sheet));
  const tracking = {
    statusIndex: columns.statusIndex,
    errorIndex: columns.errorIndex,
    sentAtIndex: columns.sentAtIndex
  };
  const sentEmails = getAefSentEmailSet_(sheet, columns, tracking);
  const rows = sheet.getRange(
    2,
    1,
    sheet.getLastRow() - 1,
    sheet.getLastColumn()
  ).getValues();
  const emails = [];

  rows.forEach(function (row) {
    const email = resolveAefRegistrationEmail_(row, columns);
    if (
      determineAefAcceptanceAction_(
        row[columns.decisionIndex],
        email,
        row[columns.statusIndex],
        sentEmails
      ) === "send"
    ) {
      emails.push(email);
      sentEmails[email] = true;
    }
  });
  return emails.sort();
}

function areSameAefEmailLists_(left, right) {
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i++) {
    if (left[i] !== right[i]) return false;
  }
  return true;
}

function getAefAcceptanceColumnIndexes_(headers) {
  const columns = {
    primaryEmailIndex: findAefHeaderIndex_(headers, "Email address"),
    fallbackEmailIndex: findAefHeaderIndex_(headers, "Email Address"),
    fullNameIndex: findAefHeaderIndex_(headers, "Full Name"),
    decisionIndex: findAefHeaderIndex_(headers, "Decision"),
    statusIndex: findAefHeaderIndex_(headers, "Acceptance Email Status"),
    errorIndex: findAefHeaderIndex_(headers, "Acceptance Email Error"),
    sentAtIndex: findAefHeaderIndex_(headers, "Acceptance Email Sent At")
  };
  const missing = Object.keys(columns).filter(function (key) {
    return columns[key] === -1;
  });
  if (missing.length) {
    throw new Error(
      "The Selection Map is missing required acceptance email columns. " +
      "Run Refresh Selection Map first."
    );
  }
  return columns;
}

function getAefSelectionSheet_() {
  const sheet = getAefSpreadsheet_().getSheetByName(
    AEF_COHORT_2_CONFIG.selectionSheetName
  );
  if (!sheet) {
    throw new Error("Selection Map was not found. Run Refresh Selection Map first.");
  }
  return sheet;
}

function getAefSelectionHeaders_() {
  return [
    "Email address",
    "Column 2",
    "Full Name",
    "Email Address",
    "Country",
    "State / Region",
    "What best describes you right now?",
    "LinkedIn Url",
    "Able to Commit",
    "Decision",
    "Acceptance Email Status",
    "Acceptance Email Error",
    "Acceptance Email Sent At"
  ];
}

function buildAefSelectionRows_(sourceHeaders, sourceRows, existingHeaders, existingRows) {
  const sourceLabels = getAefSelectionHeaders_().slice(0, 8);
  const sourceIndexes = sourceLabels.map(function (label) {
    return findAefHeaderIndex_(sourceHeaders, label);
  });
  const missingLabels = sourceLabels.filter(function (label, index) {
    return sourceIndexes[index] === -1;
  });
  const commitmentIndex = findAefCommitmentHeaderIndex_(sourceHeaders);
  const timestampIndex = findAefHeaderIndex_(sourceHeaders, "Timestamp");

  if (missingLabels.length || commitmentIndex === -1) {
    throw new Error(
      "The source sheet is missing required application columns: " +
      missingLabels.concat(commitmentIndex === -1 ? ["commitment deposit answer"] : []).join(", ")
    );
  }

  const preserved = getAefExistingSelectionState_(existingHeaders || [], existingRows || []);
  const orderedKeys = [];
  const latestByKey = {};

  (sourceRows || []).forEach(function (sourceRow, rowIndex) {
    const copied = sourceIndexes.map(function (columnIndex) {
      return sourceRow[columnIndex];
    });
    const emailKey = normalizeAefEmail_(copied[0]) || normalizeAefEmail_(copied[3]);
    const key = emailKey || "__source_row_" + rowIndex;
    if (!Object.prototype.hasOwnProperty.call(latestByKey, key)) orderedKeys.push(key);

    const candidate = {
      copied: copied,
      willing: normalizeAefHeader_(sourceRow[commitmentIndex]) === "yes",
      timestamp: getAefTimestampValue_(
        timestampIndex >= 0 ? sourceRow[timestampIndex] : ""
      ),
      rowIndex: rowIndex
    };
    const current = latestByKey[key];
    if (!current || isNewerAefSourceResponse_(candidate, current)) {
      latestByKey[key] = candidate;
    }
  });

  return orderedKeys.filter(function (key) {
    return latestByKey[key].willing;
  }).map(function (key) {
    const savedState = preserved[key] || ["", "", "", ""];
    return latestByKey[key].copied.concat(["Yes"], savedState);
  });
}

function getAefTimestampValue_(value) {
  if (!value) return null;
  const parsed = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function isNewerAefSourceResponse_(candidate, current) {
  if (candidate.timestamp !== null && current.timestamp !== null) {
    if (candidate.timestamp !== current.timestamp) {
      return candidate.timestamp > current.timestamp;
    }
  } else if (candidate.timestamp !== null) {
    return true;
  } else if (current.timestamp !== null) {
    return false;
  }
  return candidate.rowIndex > current.rowIndex;
}

function getAefExistingSelectionState_(headers, rows) {
  const state = {};
  if (!headers.length || !rows.length) return state;

  const emailIndex = findAefHeaderIndex_(headers, "Email address");
  const fallbackEmailIndex = findAefHeaderIndex_(headers, "Email Address");
  const stateIndexes = [
    findAefHeaderIndex_(headers, "Decision"),
    findAefHeaderIndex_(headers, "Acceptance Email Status"),
    findAefHeaderIndex_(headers, "Acceptance Email Error"),
    findAefHeaderIndex_(headers, "Acceptance Email Sent At")
  ];
  if (emailIndex === -1 || stateIndexes.some(function (index) { return index === -1; })) {
    return state;
  }

  rows.forEach(function (row) {
    const key = normalizeAefEmail_(row[emailIndex]) ||
      (fallbackEmailIndex >= 0 ? normalizeAefEmail_(row[fallbackEmailIndex]) : "");
    if (!key) return;
    state[key] = stateIndexes.map(function (index) { return row[index]; });
  });
  return state;
}

function findAefCommitmentHeaderIndex_(headers) {
  for (let i = 0; i < headers.length; i++) {
    const header = normalizeAefHeader_(headers[i]);
    if (
      header.indexOf("refundable commitment deposit") !== -1 &&
      /within\s+(?:24|72)\s+hours/.test(header)
    ) {
      return i;
    }
  }
  return -1;
}

function findAefHeaderIndex_(headers, label) {
  const exactLabel = String(label || "").trim();
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i] || "").trim() === exactLabel) return i;
  }
  return findExactAefHeaderIndex_(headers, label);
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

  if (action === "skip-reconciliation") {
    return {
      status: "reconciliation",
      message: "Delivery state is uncertain; automatic retry was blocked"
    };
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
    setAefRegistrationTracking_(sheet, rowNumber, tracking, "Sending", "", "");
    SpreadsheetApp.flush();
  } catch (error) {
    Logger.log(
      "Could not reserve registration row " + rowNumber +
      " before sending: " + truncateAefError_(error)
    );
    return {
      status: "tracking-failed",
      message: "No email was sent because the delivery reservation could not be recorded"
    };
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
  } catch (error) {
    try {
      setAefRegistrationTracking_(
        sheet,
        rowNumber,
        tracking,
        "Failed",
        truncateAefError_(error),
        ""
      );
    } catch (trackingError) {
      Logger.log(
        "Email send failed and row " + rowNumber +
        " could not be marked Failed: " + truncateAefError_(trackingError)
      );
      return {
        status: "tracking-failed",
        message: "Email send failed; delivery reservation remains for reconciliation"
      };
    }
    return { status: "failed", message: String(error) };
  }

  sentEmails[email] = true;
  try {
    setAefRegistrationTracking_(sheet, rowNumber, tracking, "Sent", "", new Date());
  } catch (error) {
    Logger.log(
      "Registration email was sent for row " + rowNumber +
      ", but final tracking failed: " + truncateAefError_(error)
    );
    try {
      sheet.getRange(rowNumber, tracking.errorIndex + 1).setValue(
        truncateAefError_("Email sent; final tracking failed: " + error)
      );
    } catch (secondaryError) {
      Logger.log(
        "Could not record the tracking error for row " + rowNumber +
        ": " + truncateAefError_(secondaryError)
      );
    }
    return {
      status: "tracking-failed",
      message: "Email was sent, but final tracking requires reconciliation"
    };
  }

  return { status: "sent", message: "Registration acknowledgement sent" };
}

function determineAefRegistrationAction_(email, currentStatus, sentEmails) {
  const normalizedEmail = normalizeAefEmail_(email);
  const normalizedStatus = String(currentStatus || "").trim().toLowerCase();

  if (normalizedStatus === "sent") return "skip-sent";
  if (normalizedStatus === "sending") return "skip-reconciliation";
  if (!normalizedEmail) return "skip-no-email";
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

function getAefAcceptanceApplicantKey_(row, columns) {
  const email = resolveAefRegistrationEmail_(row, columns);
  if (isValidAefEmail_(email)) return "email:" + email;

  const fullName = columns.fullNameIndex >= 0
    ? normalizeAefHeader_(row[columns.fullNameIndex])
    : "";
  const primaryEmail = columns.primaryEmailIndex >= 0
    ? normalizeAefEmail_(row[columns.primaryEmailIndex])
    : "";
  const fallbackEmail = columns.fallbackEmailIndex >= 0
    ? normalizeAefEmail_(row[columns.fallbackEmailIndex])
    : "";
  return "profile:" + [fullName, primaryEmail, fallbackEmail].join("|");
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

function getAefRegistrationTrackingColumnIndexes_(headers) {
  const statusIndex = findExactAefHeaderIndex_(headers, AEF_COHORT_2_CONFIG.statusHeader);
  const errorIndex = findExactAefHeaderIndex_(headers, AEF_COHORT_2_CONFIG.errorHeader);
  const sentAtIndex = findExactAefHeaderIndex_(headers, AEF_COHORT_2_CONFIG.sentAtHeader);

  if (statusIndex === -1 || errorIndex === -1 || sentAtIndex === -1) {
    throw new Error(
      "Registration tracking columns are missing. Run Setup Registration Automation first."
    );
  }

  return {
    statusIndex: statusIndex,
    errorIndex: errorIndex,
    sentAtIndex: sentAtIndex
  };
}

function getAefSentEmailSet_(sheet, columns, tracking) {
  const sentEmails = {};
  if (sheet.getLastRow() < 2) return sentEmails;

  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  for (let i = 0; i < rows.length; i++) {
    if (!isAefReservedOrSentStatus_(rows[i][tracking.statusIndex])) {
      continue;
    }

    const email = resolveAefRegistrationEmail_(rows[i], columns);
    if (email) sentEmails[email] = true;
  }
  return sentEmails;
}

function isAefReservedOrSentStatus_(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return normalized === "sent" || normalized === "sending";
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
  throw new Error(
    "Set a test email recipient before sending a test. " +
    "Use the spreadsheet menu or saveTestEmailRecipient(email)."
  );
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
