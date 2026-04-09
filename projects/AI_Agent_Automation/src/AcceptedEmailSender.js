function sendAcceptedTestEmail() {
  const testEmail = getTestEmailRecipient_();

  GmailApp.sendEmail(
    testEmail,
    "[TEST] " + REGISTRATION_CONFIG.acceptedEmailSubject,
    getAiAgentsAcceptedEmailPlainText("Accepted Candidate"),
    {
      htmlBody: getAiAgentsAcceptedEmailHtml("Accepted Candidate"),
      name: REGISTRATION_CONFIG.senderName
    }
  );

  logAndToast_("Accepted test email sent to: " + testEmail);
}

function sendAcceptedReminderTestEmail() {
  const testEmail = getTestEmailRecipient_();

  GmailApp.sendEmail(
    testEmail,
    "[TEST] " + getAcceptedReminderEmailSubject_(),
    getAiAgentsAcceptedReminderPlainText("Accepted Candidate"),
    {
      htmlBody: getAiAgentsAcceptedReminderHtml("Accepted Candidate"),
      name: REGISTRATION_CONFIG.senderName
    }
  );

  logAndToast_("Accepted reminder test email sent to: " + testEmail);
}

function sendAcceptedEmails() {
  runAcceptedEmailBatch_({
    actionLabel: "Accepted email",
    summaryLabel: "Accepted email run complete",
    subject: function () {
      return REGISTRATION_CONFIG.acceptedEmailSubject;
    },
    getPlainText: getAiAgentsAcceptedEmailPlainText,
    getHtml: getAiAgentsAcceptedEmailHtml,
    getTrackingInfo: ensureAcceptedEmailStatusColumns_
  });
}

function sendAcceptedReminderEmails() {
  runAcceptedEmailBatch_({
    actionLabel: "Accepted reminder email",
    summaryLabel: "Accepted reminder email run complete",
    subject: getAcceptedReminderEmailSubject_,
    getPlainText: getAiAgentsAcceptedReminderPlainText,
    getHtml: getAiAgentsAcceptedReminderHtml,
    getTrackingInfo: ensureAcceptedReminderStatusColumns_
  });
}

function runAcceptedEmailBatch_(options) {
  withScriptLock_(function () {
    const acceptedSheet = getPreparedAcceptedSheetForSending_();
    const columns = getAcceptedSheetEmailColumns_(acceptedSheet);
    const trackingInfo = options.getTrackingInfo(acceptedSheet);
    const lastRow = acceptedSheet.getLastRow();

    if (lastRow < 2) {
      logAndToast_("No accepted rows found for " + options.actionLabel.toLowerCase() + " sending.");
      return;
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
      const row = acceptedSheet.getRange(rowNumber, 1, 1, acceptedSheet.getLastColumn()).getValues()[0];
      const email = normalizeEmail_(row[columns.emailIndex]);
      const statusInfo = getReviewStatusInfo_(row[columns.statusIndex]);
      const currentSendStatus = normalizeSendTrackingStatus_(row[trackingInfo.statusIndex]);
      const fullName = String(row[columns.fullNameIndex] || "").trim();

      if (!statusInfo || statusInfo.key !== "accepted") {
        skipped++;
        continue;
      }

      if (!email) {
        setEmailTrackingResult_(acceptedSheet, rowNumber, trackingInfo, "Skipped - No Email", "", "");
        skipped++;
        continue;
      }

      if (currentSendStatus === "sent") {
        skipped++;
        continue;
      }

      try {
        GmailApp.sendEmail(
          email,
          options.subject(fullName),
          options.getPlainText(fullName),
          {
            htmlBody: options.getHtml(fullName),
            name: REGISTRATION_CONFIG.senderName
          }
        );

        setEmailTrackingResult_(acceptedSheet, rowNumber, trackingInfo, "Sent", "", new Date());
        sent++;

        Utilities.sleep(200);
      } catch (err) {
        setEmailTrackingResult_(acceptedSheet, rowNumber, trackingInfo, "Failed", String(err), "");
        failed++;
      }
    }

    logAndToast_(
      options.summaryLabel + ". Sent: " + sent +
      ", Failed: " + failed +
      ", Skipped: " + skipped
    );
  });
}

function getPreparedAcceptedSheetForSending_() {
  const sourceSheet = getRegistrationSourceSheet_();
  const columns = getReviewColumnIndexes_(sourceSheet);
  return syncAcceptedCandidatesSheet_(sourceSheet, columns);
}

function ensureAcceptedEmailStatusColumns_(sheet) {
  const indexes = ensureAcceptedTrackingColumns_(sheet);
  return {
    statusIndex: indexes.acceptedStatusIndex,
    errorIndex: indexes.acceptedErrorIndex,
    sentAtIndex: indexes.acceptedSentAtIndex
  };
}

function ensureAcceptedReminderStatusColumns_(sheet) {
  const indexes = ensureAcceptedTrackingColumns_(sheet);
  return {
    statusIndex: indexes.acceptedReminderStatusIndex,
    errorIndex: indexes.acceptedReminderErrorIndex,
    sentAtIndex: indexes.acceptedReminderSentAtIndex
  };
}

function ensureAcceptedTrackingColumns_(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h || "").trim();
  });
  const workingHeaders = headers.slice();
  const columnConfig = getAcceptedTrackingColumnConfig_();
  const indexes = {};

  for (let i = 0; i < columnConfig.length; i++) {
    const config = columnConfig[i];
    let index = findExactHeaderIndex_(workingHeaders, config.label);
    if (index === -1) {
      index = appendHeaderColumn_(sheet, workingHeaders, config.label);
    }
    indexes[config.key] = index;
  }

  return indexes;
}

function getAcceptedTrackingColumnConfig_() {
  return [
    { key: "acceptedStatusIndex", label: REGISTRATION_CONFIG.acceptedEmailStatusColumn },
    { key: "acceptedErrorIndex", label: REGISTRATION_CONFIG.acceptedEmailErrorColumn },
    { key: "acceptedSentAtIndex", label: REGISTRATION_CONFIG.acceptedEmailSentAtColumn },
    { key: "acceptedReminderStatusIndex", label: REGISTRATION_CONFIG.acceptedReminderStatusColumn },
    { key: "acceptedReminderErrorIndex", label: REGISTRATION_CONFIG.acceptedReminderErrorColumn },
    { key: "acceptedReminderSentAtIndex", label: REGISTRATION_CONFIG.acceptedReminderSentAtColumn }
  ];
}

function getAcceptedTrackingHeaders_() {
  return getAcceptedTrackingColumnConfig_().map(function (config) {
    return config.label;
  });
}

function createEmptyAcceptedTrackingRow_() {
  return getAcceptedTrackingHeaders_().map(function () {
    return "";
  });
}

function ensureAcceptedEmailHelperColumns_(sheet, sourceColumnCount) {
  const helperHeaders = getAcceptedTrackingHeaders_();

  for (let i = 0; i < helperHeaders.length; i++) {
    const targetColumn = sourceColumnCount + i + 1;
    if (normalizeHeader_(sheet.getRange(1, targetColumn).getValue()) !== normalizeHeader_(helperHeaders[i])) {
      sheet.getRange(1, targetColumn)
        .setValue(helperHeaders[i])
        .setFontWeight("bold")
        .setBackground("#e8eefc");
    }
  }
}

function setEmailTrackingResult_(sheet, rowNumber, trackingInfo, status, error, sentAt) {
  sheet.getRange(rowNumber, trackingInfo.statusIndex + 1).setValue(status);
  sheet.getRange(rowNumber, trackingInfo.errorIndex + 1).setValue(truncateEmailTrackingError_(error));
  sheet.getRange(rowNumber, trackingInfo.sentAtIndex + 1).setValue(sentAt || "");
}

function normalizeSendTrackingStatus_(value) {
  return String(value || "").trim().toLowerCase();
}

function truncateEmailTrackingError_(value) {
  return String(value || "").slice(0, 500);
}

function appendHeaderColumn_(sheet, headers, label) {
  headers.push(label);
  const index = headers.length - 1;
  sheet.getRange(1, index + 1).setValue(label);
  return index;
}

function findExactHeaderIndex_(headers, label) {
  const target = String(label || "").trim().toLowerCase();
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i] || "").trim().toLowerCase() === target) {
      return i;
    }
  }
  return -1;
}

function getAcceptedSheetEmailColumns_(sheet) {
  return getDecisionEmailColumns_(sheet, "Accepted sheet");
}

function getDecisionEmailColumns_(sheet, sheetLabel) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h || "").trim();
  });

  const emailIndex = findColumnIndexByCandidates_(headers, REGISTRATION_CONFIG.emailColumnCandidates);
  const fullNameIndex = findColumnIndexByCandidates_(headers, REGISTRATION_CONFIG.fullNameColumnCandidates);
  const statusIndex = findColumnIndexByCandidates_(headers, REGISTRATION_CONFIG.statusColumnCandidates);

  if (emailIndex === -1 || fullNameIndex === -1 || statusIndex === -1) {
    throw new Error(
      sheetLabel + " is missing one of these required columns: Email address, Full Name, Status."
    );
  }

  return {
    emailIndex: emailIndex,
    fullNameIndex: fullNameIndex,
    statusIndex: statusIndex
  };
}
