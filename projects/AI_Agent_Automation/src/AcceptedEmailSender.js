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

function sendAcceptedEmails() {
  withScriptLock_(function () {
    const acceptedSheet = ensureAcceptedSheet_();
    const columns = getAcceptedSheetEmailColumns_(acceptedSheet);
    const emailStatusInfo = ensureAcceptedEmailStatusColumns_(acceptedSheet);
    const lastRow = acceptedSheet.getLastRow();

    if (lastRow < 2) {
      logAndToast_("No accepted rows found for accepted email sending.");
      return;
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
      const row = acceptedSheet.getRange(rowNumber, 1, 1, acceptedSheet.getLastColumn()).getValues()[0];
      const email = normalizeEmail_(row[columns.emailIndex]);
      const statusInfo = getReviewStatusInfo_(row[columns.statusIndex]);
      const currentSendStatus = String(row[emailStatusInfo.statusIndex] || "").trim().toLowerCase();
      const fullName = String(row[columns.fullNameIndex] || "").trim();

      if (!statusInfo || statusInfo.key !== "accepted") {
        skipped++;
        continue;
      }

      if (!email) {
        acceptedSheet.getRange(rowNumber, emailStatusInfo.statusIndex + 1).setValue("Skipped - No Email");
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
          REGISTRATION_CONFIG.acceptedEmailSubject,
          getAiAgentsAcceptedEmailPlainText(fullName),
          {
            htmlBody: getAiAgentsAcceptedEmailHtml(fullName),
            name: REGISTRATION_CONFIG.senderName
          }
        );

        acceptedSheet.getRange(rowNumber, emailStatusInfo.statusIndex + 1).setValue("Sent");
        acceptedSheet.getRange(rowNumber, emailStatusInfo.errorIndex + 1).setValue("");
        acceptedSheet.getRange(rowNumber, emailStatusInfo.sentAtIndex + 1).setValue(new Date());
        sent++;

        Utilities.sleep(200);
      } catch (err) {
        acceptedSheet.getRange(rowNumber, emailStatusInfo.statusIndex + 1).setValue("Failed");
        acceptedSheet.getRange(rowNumber, emailStatusInfo.errorIndex + 1).setValue(String(err));
        failed++;
      }
    }

    logAndToast_(
      "Accepted email run complete. Sent: " + sent +
      ", Failed: " + failed +
      ", Skipped: " + skipped
    );
  });
}

function ensureAcceptedEmailStatusColumns_(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h || "").trim();
  });
  const workingHeaders = headers.slice();

  let statusIndex = findExactHeaderIndex_(workingHeaders, REGISTRATION_CONFIG.acceptedEmailStatusColumn);
  if (statusIndex === -1) {
    statusIndex = appendHeaderColumn_(sheet, workingHeaders, REGISTRATION_CONFIG.acceptedEmailStatusColumn);
  }

  let errorIndex = findExactHeaderIndex_(workingHeaders, REGISTRATION_CONFIG.acceptedEmailErrorColumn);
  if (errorIndex === -1) {
    errorIndex = appendHeaderColumn_(sheet, workingHeaders, REGISTRATION_CONFIG.acceptedEmailErrorColumn);
  }

  let sentAtIndex = findExactHeaderIndex_(workingHeaders, REGISTRATION_CONFIG.acceptedEmailSentAtColumn);
  if (sentAtIndex === -1) {
    sentAtIndex = appendHeaderColumn_(sheet, workingHeaders, REGISTRATION_CONFIG.acceptedEmailSentAtColumn);
  }

  return {
    statusIndex: statusIndex,
    errorIndex: errorIndex,
    sentAtIndex: sentAtIndex
  };
}

function ensureAcceptedEmailHelperColumns_(sheet, sourceColumnCount) {
  const helperHeaders = [
    REGISTRATION_CONFIG.acceptedEmailStatusColumn,
    REGISTRATION_CONFIG.acceptedEmailErrorColumn,
    REGISTRATION_CONFIG.acceptedEmailSentAtColumn
  ];

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
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h || "").trim();
  });

  const emailIndex = findColumnIndexByCandidates_(headers, REGISTRATION_CONFIG.emailColumnCandidates);
  const fullNameIndex = findColumnIndexByCandidates_(headers, REGISTRATION_CONFIG.fullNameColumnCandidates);
  const statusIndex = findColumnIndexByCandidates_(headers, REGISTRATION_CONFIG.statusColumnCandidates);

  if (emailIndex === -1 || fullNameIndex === -1 || statusIndex === -1) {
    throw new Error("Accepted sheet is missing one of these required columns: Email address, Full Name, Status.");
  }

  return {
    emailIndex: emailIndex,
    fullNameIndex: fullNameIndex,
    statusIndex: statusIndex
  };
}
