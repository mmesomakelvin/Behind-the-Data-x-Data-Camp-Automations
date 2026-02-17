/**
 * Payment Receipt / Onboarding email sender.
 * Project: Payment_Receipt_Onboarding
 */
const ONBOARDING_CONFIG = {
  sourceSheetName: "Form_Responses",
  emailColumnCandidates: ["Email address", "Email Address", "Email", "email"],
  nameColumnCandidates: ["Full Name", "FullName", "Name"],
  greenMarkerColumnCandidates: ["Full Name", "Name"],
  greenHexAllowList: ["#00ff00", "#34a853", "#b7e1cd"],
  statusColumn: "Onboarding Email Status",
  errorColumn: "Onboarding Email Error",
  sentAtColumn: "Onboarding Email Sent At",
  scheduleHour24: 8,
  testEmail: "mmesomakelvin@gmail.com",
  senderName: "Behind the Data Academy",
  subject: "Alpha Cohort Onboarding Details - Behind the Data Academy"
};

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Onboarding Email Manager")
    .addItem("Send Test Onboarding Email", "sendOnboardingTestEmail")
    .addItem("Preview Eligible Green Rows", "previewGreenEligibleRows")
    .addItem("Send Onboarding Emails (Pending)", "sendOnboardingEmails")
    .addItem("Schedule Send at 8:00 AM Today", "scheduleOnboardingEmailsFor8amToday")
    .addItem("Schedule Send at 8:00 AM Tomorrow", "scheduleOnboardingEmailsFor8amTomorrow")
    .addItem("Clear Scheduled Send Trigger", "clearOnboardingSendSchedule")
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
  var range = sheet.getDataRange();
  var values = range.getValues();
  var backgrounds = range.getBackgrounds();

  if (values.length < 2) {
    Logger.log("No data rows found in sheet: " + ONBOARDING_CONFIG.sourceSheetName);
    return;
  }

  var headers = values[0].map(function (h) { return String(h || "").trim(); });
  var statusInfo = ensureOnboardingStatusColumns_(sheet, headers);

  var emailIndex = findColumnIndexByCandidates_(statusInfo.headers, ONBOARDING_CONFIG.emailColumnCandidates);
  var nameIndex = findColumnIndexByCandidates_(statusInfo.headers, ONBOARDING_CONFIG.nameColumnCandidates);
  var greenMarkerIndex = findColumnIndexByCandidates_(statusInfo.headers, ONBOARDING_CONFIG.greenMarkerColumnCandidates);

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
    var rowBackgrounds = backgrounds[i] || [];

    if (!email) {
      sheet.getRange(rowNumber, statusInfo.statusIndex + 1).setValue("Skipped - No Email");
      skipped++;
      continue;
    }

    if (currentStatus === "sent") {
      skipped++;
      continue;
    }

    if (!isGreenEligibleRow_(rowBackgrounds, greenMarkerIndex)) {
      sheet.getRange(rowNumber, statusInfo.statusIndex + 1).setValue("Skipped - Not Green");
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

function previewGreenEligibleRows() {
  var sheet = getOnboardingSourceSheet_();
  var range = sheet.getDataRange();
  var values = range.getValues();
  var backgrounds = range.getBackgrounds();

  if (values.length < 2) {
    Logger.log("No data rows found in sheet: " + ONBOARDING_CONFIG.sourceSheetName);
    return;
  }

  var headers = values[0].map(function (h) { return String(h || "").trim(); });
  var emailIndex = findColumnIndexByCandidates_(headers, ONBOARDING_CONFIG.emailColumnCandidates);
  var greenMarkerIndex = findColumnIndexByCandidates_(headers, ONBOARDING_CONFIG.greenMarkerColumnCandidates);
  var eligibleCount = 0;
  var sampleRows = [];

  if (emailIndex === -1) {
    throw new Error("Could not find email column. Checked: " + ONBOARDING_CONFIG.emailColumnCandidates.join(", "));
  }

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var email = normalizeEmail_(row[emailIndex]);
    if (!email) {
      continue;
    }

    if (isGreenEligibleRow_(backgrounds[i] || [], greenMarkerIndex)) {
      eligibleCount++;
      if (sampleRows.length < 20) {
        sampleRows.push(i + 1);
      }
    }
  }

  Logger.log("Eligible green rows to send: " + eligibleCount);
  Logger.log("Sample eligible row numbers (max 20): " + sampleRows.join(", "));
  SpreadsheetApp.getActiveSpreadsheet().toast(
    "Eligible green rows: " + eligibleCount,
    "Onboarding Email Manager",
    8
  );
}

function previewOnboardingEmailHtml() {
  Logger.log(getOnboardingEmailHtml("Fellow"));
}

function scheduleOnboardingEmailsFor8amToday() {
  var now = new Date();
  var targetAt = buildDateAtHourForScriptDay_(now, ONBOARDING_CONFIG.scheduleHour24);
  var tz = Session.getScriptTimeZone();

  if (now.getTime() >= targetAt.getTime()) {
    throw new Error(
      "8:00 AM has already passed for today (" +
        Utilities.formatDate(now, tz, "yyyy-MM-dd") +
        "). Run scheduleOnboardingEmailsFor8amTomorrow instead."
    );
  }

  clearOnboardingSendSchedule();
  ScriptApp.newTrigger("sendOnboardingEmails").timeBased().at(targetAt).create();

  Logger.log(
    "Scheduled sendOnboardingEmails for " +
      Utilities.formatDate(targetAt, tz, "EEEE, MMMM d, yyyy h:mm a")
  );
}

function scheduleOnboardingEmailsFor8amTomorrow() {
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var targetAt = buildDateAtHourForScriptDay_(tomorrow, ONBOARDING_CONFIG.scheduleHour24);
  var tz = Session.getScriptTimeZone();

  clearOnboardingSendSchedule();
  ScriptApp.newTrigger("sendOnboardingEmails").timeBased().at(targetAt).create();

  Logger.log(
    "Scheduled sendOnboardingEmails for " +
      Utilities.formatDate(targetAt, tz, "EEEE, MMMM d, yyyy h:mm a")
  );
}

function clearOnboardingSendSchedule() {
  var triggers = ScriptApp.getProjectTriggers();
  var removed = 0;

  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "sendOnboardingEmails") {
      ScriptApp.deleteTrigger(triggers[i]);
      removed++;
    }
  }

  Logger.log("Removed onboarding send triggers: " + removed);
}

function getOnboardingSourceSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ONBOARDING_CONFIG.sourceSheetName);

  if (!sheet) {
    var targetKey = normalizeSheetNameKey_(ONBOARDING_CONFIG.sourceSheetName);
    var sheets = ss.getSheets();

    for (var i = 0; i < sheets.length; i++) {
      if (normalizeSheetNameKey_(sheets[i].getName()) === targetKey) {
        sheet = sheets[i];
        break;
      }
    }
  }

  if (!sheet) {
    var activeSheet = ss.getActiveSheet();
    if (activeSheet && sheetLooksLikeOnboardingSource_(activeSheet)) {
      sheet = activeSheet;
    }
  }

  if (!sheet) {
    var allSheetNames = ss.getSheets().map(function (s) { return s.getName(); });
    throw new Error(
      "Sheet not found: '" + ONBOARDING_CONFIG.sourceSheetName +
        "'. Available sheets: " + allSheetNames.join(", ") +
        ". Update ONBOARDING_CONFIG.sourceSheetName in Code.js if needed."
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

function sheetLooksLikeOnboardingSource_(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h || "").trim();
  });

  var emailIdx = findColumnIndexByCandidates_(headers, ONBOARDING_CONFIG.emailColumnCandidates);
  var nameIdx = findColumnIndexByCandidates_(headers, ONBOARDING_CONFIG.nameColumnCandidates);
  return emailIdx !== -1 && nameIdx !== -1;
}

function normalizeSheetNameKey_(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isGreenEligibleRow_(rowBackgrounds, greenMarkerIndex) {
  if (greenMarkerIndex >= 0 && greenMarkerIndex < rowBackgrounds.length) {
    return isGreenColor_(rowBackgrounds[greenMarkerIndex]);
  }

  for (var i = 0; i < rowBackgrounds.length; i++) {
    if (isGreenColor_(rowBackgrounds[i])) {
      return true;
    }
  }
  return false;
}

function isGreenColor_(hexColor) {
  var normalized = normalizeHexColor_(hexColor);
  if (!normalized) {
    return false;
  }

  if (ONBOARDING_CONFIG.greenHexAllowList.indexOf(normalized) !== -1) {
    return true;
  }

  var rgb = parseHexToRgb_(normalized);
  if (!rgb) {
    return false;
  }

  return rgb.g >= 120 && rgb.g >= rgb.r + 30 && rgb.g >= rgb.b + 30;
}

function normalizeHexColor_(value) {
  var raw = String(value || "").trim().toLowerCase();
  if (!raw) {
    return "";
  }

  if (/^#[0-9a-f]{6}$/.test(raw)) {
    return raw;
  }

  if (/^#[0-9a-f]{3}$/.test(raw)) {
    return (
      "#" +
      raw.charAt(1) + raw.charAt(1) +
      raw.charAt(2) + raw.charAt(2) +
      raw.charAt(3) + raw.charAt(3)
    );
  }

  return "";
}

function parseHexToRgb_(hex) {
  var m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) {
    return null;
  }

  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16)
  };
}

function buildDateAtHourForScriptDay_(referenceDate, hour24) {
  var tz = Session.getScriptTimeZone();
  var dayStamp = Utilities.formatDate(referenceDate, tz, "yyyy-MM-dd");
  var offsetRaw = Utilities.formatDate(referenceDate, tz, "Z");
  var offset = offsetRaw.substring(0, 3) + ":" + offsetRaw.substring(3);
  var hour = pad2_(hour24);
  var iso = dayStamp + "T" + hour + ":00:00" + offset;

  return new Date(iso);
}

function pad2_(value) {
  return value < 10 ? "0" + String(value) : String(value);
}
