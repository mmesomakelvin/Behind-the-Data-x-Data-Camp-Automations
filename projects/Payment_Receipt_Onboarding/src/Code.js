/**
 * Payment Receipt / Onboarding email sender.
 * Project: Payment_Receipt_Onboarding
 */
const ONBOARDING_CONFIG = {
  sourceSheetName: "Form_Responses",
  emailColumnCandidates: ["Email address", "Email Address", "Email", "email"],
  nameColumnCandidates: ["Full Name", "FullName", "Name"],
  statusColumn: "Onboarding Email Status",
  errorColumn: "Onboarding Email Error",
  sentAtColumn: "Onboarding Email Sent At",
  testEmail: "mmesomakelvin@gmail.com",
  senderName: "Behind the Data Academy",
  subject: "Alpha Cohort Onboarding Details - Behind the Data Academy"
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Onboarding Email Manager")
    .addItem("Send Test Onboarding Email", "sendOnboardingTestEmail")
    .addItem("Send Onboarding Emails (Pending)", "sendOnboardingEmails")
    .addItem("Preview Onboarding Email HTML (Logs)", "previewOnboardingEmailHtml")
    .addToUi();
}

function sendOnboardingTestEmail() {
  var firstName = "Fellow";
  var htmlBody = getOnboardingEmailHtml(firstName);
  var plainTextBody = getOnboardingEmailPlainText(firstName);

  GmailApp.sendEmail(
    ONBOARDING_CONFIG.testEmail,
    "[TEST] " + ONBOARDING_CONFIG.subject,
    plainTextBody,
    {
      htmlBody: htmlBody,
      name: ONBOARDING_CONFIG.senderName
    }
  );

  Logger.log("Test onboarding email sent to: " + ONBOARDING_CONFIG.testEmail);
}

function sendOnboardingEmails() {
  var sheet = getOnboardingSourceSheet_();
  var values = sheet.getDataRange().getValues();

  if (values.length < 2) {
    Logger.log("No data rows found in sheet: " + ONBOARDING_CONFIG.sourceSheetName);
    return;
  }

  var headers = values[0].map(function (h) { return String(h || "").trim(); });
  var statusInfo = ensureOnboardingStatusColumns_(sheet, headers);

  var emailIndex = findColumnIndexByCandidates_(statusInfo.headers, ONBOARDING_CONFIG.emailColumnCandidates);
  var nameIndex = findColumnIndexByCandidates_(statusInfo.headers, ONBOARDING_CONFIG.nameColumnCandidates);

  if (emailIndex === -1) {
    throw new Error("Could not find email column. Checked: " + ONBOARDING_CONFIG.emailColumnCandidates.join(", "));
  }

  var sent = 0;
  var failed = 0;
  var skipped = 0;

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var rowNumber = i + 1;
    var email = normalizeEmail_(row[emailIndex]);
    var fullName = nameIndex === -1 ? "" : String(row[nameIndex] || "").trim();
    var currentStatus = String(row[statusInfo.statusIndex] || "").trim().toLowerCase();

    if (!email) {
      sheet.getRange(rowNumber, statusInfo.statusIndex + 1).setValue("Skipped - No Email");
      skipped++;
      continue;
    }

    if (currentStatus === "sent") {
      skipped++;
      continue;
    }

    try {
      var firstName = getEmailFirstName_(fullName);
      GmailApp.sendEmail(
        email,
        ONBOARDING_CONFIG.subject,
        getOnboardingEmailPlainText(firstName),
        {
          htmlBody: getOnboardingEmailHtml(firstName),
          name: ONBOARDING_CONFIG.senderName
        }
      );

      sheet.getRange(rowNumber, statusInfo.statusIndex + 1).setValue("Sent");
      sheet.getRange(rowNumber, statusInfo.errorIndex + 1).setValue("");
      sheet.getRange(rowNumber, statusInfo.sentAtIndex + 1).setValue(new Date());
      sent++;

      Utilities.sleep(200);
    } catch (err) {
      failed++;
      sheet.getRange(rowNumber, statusInfo.statusIndex + 1).setValue("Failed");
      sheet.getRange(rowNumber, statusInfo.errorIndex + 1).setValue(String(err));
    }
  }

  Logger.log(
    "Onboarding email run completed. Sent: " + sent +
      ", Failed: " + failed +
      ", Skipped: " + skipped
  );
}

function previewOnboardingEmailHtml() {
  Logger.log(getOnboardingEmailHtml("Fellow"));
}

function getOnboardingSourceSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ONBOARDING_CONFIG.sourceSheetName);

  if (!sheet) {
    throw new Error(
      "Sheet not found: '" + ONBOARDING_CONFIG.sourceSheetName +
        "'. Update ONBOARDING_CONFIG.sourceSheetName in Code.js."
    );
  }

  return sheet;
}

function ensureOnboardingStatusColumns_(sheet, headers) {
  var workingHeaders = headers.slice();

  var statusIndex = findExactHeaderIndex_(workingHeaders, ONBOARDING_CONFIG.statusColumn);
  if (statusIndex === -1) {
    statusIndex = appendHeaderColumn_(sheet, workingHeaders, ONBOARDING_CONFIG.statusColumn);
  }

  var errorIndex = findExactHeaderIndex_(workingHeaders, ONBOARDING_CONFIG.errorColumn);
  if (errorIndex === -1) {
    errorIndex = appendHeaderColumn_(sheet, workingHeaders, ONBOARDING_CONFIG.errorColumn);
  }

  var sentAtIndex = findExactHeaderIndex_(workingHeaders, ONBOARDING_CONFIG.sentAtColumn);
  if (sentAtIndex === -1) {
    sentAtIndex = appendHeaderColumn_(sheet, workingHeaders, ONBOARDING_CONFIG.sentAtColumn);
  }

  return {
    headers: workingHeaders,
    statusIndex: statusIndex,
    errorIndex: errorIndex,
    sentAtIndex: sentAtIndex
  };
}

function appendHeaderColumn_(sheet, headers, label) {
  headers.push(label);
  var index = headers.length - 1;
  sheet.getRange(1, index + 1).setValue(label);
  return index;
}

function findColumnIndexByCandidates_(headers, candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var idx = findExactHeaderIndex_(headers, candidates[i]);
    if (idx !== -1) {
      return idx;
    }
  }
  return -1;
}

function findExactHeaderIndex_(headers, label) {
  var target = String(label || "").trim().toLowerCase();
  for (var i = 0; i < headers.length; i++) {
    if (String(headers[i] || "").trim().toLowerCase() === target) {
      return i;
    }
  }
  return -1;
}

function normalizeEmail_(value) {
  return String(value || "").trim();
}