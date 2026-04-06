function sendRejectedTestEmail() {
  const testEmail = getTestEmailRecipient_();

  GmailApp.sendEmail(
    testEmail,
    "[TEST] " + REGISTRATION_CONFIG.rejectedEmailSubject,
    getAiAgentsRejectedPlainText("Applicant"),
    {
      htmlBody: getAiAgentsRejectedEmailHtml("Applicant"),
      name: REGISTRATION_CONFIG.senderName
    }
  );

  logAndToast_("Rejected test email sent to: " + testEmail);
}

function sendRejectedEmails() {
  withScriptLock_(function () {
    const sourceSheet = getRegistrationSourceSheet_();
    const columns = getDecisionEmailColumns_(sourceSheet, "Source sheet");
    const trackingInfo = ensureRejectedEmailStatusColumns_(sourceSheet);
    const lastRow = sourceSheet.getLastRow();

    if (lastRow < 2) {
      logAndToast_("No source rows found for rejected email sending.");
      return;
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
      const row = sourceSheet.getRange(rowNumber, 1, 1, sourceSheet.getLastColumn()).getValues()[0];
      const email = normalizeEmail_(row[columns.emailIndex]);
      const statusInfo = getReviewStatusInfo_(row[columns.statusIndex]);
      const currentSendStatus = normalizeSendTrackingStatus_(row[trackingInfo.statusIndex]);
      const fullName = String(row[columns.fullNameIndex] || "").trim();

      if (!statusInfo || statusInfo.key !== "rejected") {
        skipped++;
        continue;
      }

      if (!email) {
        setEmailTrackingResult_(sourceSheet, rowNumber, trackingInfo, "Skipped - No Email", "", "");
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
          REGISTRATION_CONFIG.rejectedEmailSubject,
          getAiAgentsRejectedPlainText(fullName),
          {
            htmlBody: getAiAgentsRejectedEmailHtml(fullName),
            name: REGISTRATION_CONFIG.senderName
          }
        );

        setEmailTrackingResult_(sourceSheet, rowNumber, trackingInfo, "Sent", "", new Date());
        sent++;

        Utilities.sleep(200);
      } catch (err) {
        setEmailTrackingResult_(sourceSheet, rowNumber, trackingInfo, "Failed", String(err), "");
        failed++;
      }
    }

    logAndToast_(
      "Rejected email run complete. Sent: " + sent +
      ", Failed: " + failed +
      ", Skipped: " + skipped
    );
  });
}

function ensureRejectedEmailStatusColumns_(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h || "").trim();
  });
  const workingHeaders = headers.slice();

  let statusIndex = findExactHeaderIndex_(workingHeaders, REGISTRATION_CONFIG.rejectedEmailStatusColumn);
  if (statusIndex === -1) {
    statusIndex = appendHeaderColumn_(sheet, workingHeaders, REGISTRATION_CONFIG.rejectedEmailStatusColumn);
  }

  let errorIndex = findExactHeaderIndex_(workingHeaders, REGISTRATION_CONFIG.rejectedEmailErrorColumn);
  if (errorIndex === -1) {
    errorIndex = appendHeaderColumn_(sheet, workingHeaders, REGISTRATION_CONFIG.rejectedEmailErrorColumn);
  }

  let sentAtIndex = findExactHeaderIndex_(workingHeaders, REGISTRATION_CONFIG.rejectedEmailSentAtColumn);
  if (sentAtIndex === -1) {
    sentAtIndex = appendHeaderColumn_(sheet, workingHeaders, REGISTRATION_CONFIG.rejectedEmailSentAtColumn);
  }

  return {
    statusIndex: statusIndex,
    errorIndex: errorIndex,
    sentAtIndex: sentAtIndex
  };
}
