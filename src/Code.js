/**
 * =============================================
 * BEHIND THE DATA ACADEMY - AUTO REGISTRATION
 * File 1 of 2: Code.gs
 * =============================================
 */

const CONFIG = {
  sourceSheet: "Form responses 1",
  destSheet: "Auto-Reg Email",
  sourceColumns: {
    email: 2,      // Column B
    fullName: 4,   // Column D
    country: 6     // Column F (used for Location Master)
  },
  senderName: "Behind The Data Academy",
  emailSubject: "Welcome to Behind The Data Academy – Join Our Discord!"
};

const ACCEPTANCE_CONFIG = {
  sourceSheet: "Selection Map",
  senderName: "Behind the Data Academy",
  subject: "You are Accepted: Analytics Engineering Fellowship | Behind the Data Academy",
  testEmail: "mmesomakelvin@gmail.com",
  testName: "Test User",
  triggerHour: 10,
  headers: {
    email: ["Email address", "Email Address", "email", "email address"],
    fullName: ["Full Name", "full name", "Name"],
    ableToCommit: ["Able to Commit", "able to commit"],
    decision: ["Decision", "decision"],
    status: "Acceptance Email Status",
    error: "Acceptance Email Error"
  }
};

// =============================================
// STEP 1: Run this first to test email
// =============================================
function sendTestEmail() {
  const testEmail = "mmesomakelvin@gmail.com";  // ← CHANGE THIS
  const testName = "Test User";
  
  try {
    GmailApp.sendEmail(testEmail, "[TEST] " + CONFIG.emailSubject, getPlainText(testName), {
      name: CONFIG.senderName,
      htmlBody: getEmailHTML(testName)
    });
    SpreadsheetApp.getUi().alert("✅ Test email sent to: " + testEmail);
  } catch (error) {
    SpreadsheetApp.getUi().alert("❌ Error: " + error);
  }
}

// =============================================
// STEP 2: Setup the Auto-Reg Email sheet
// =============================================
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.destSheet);

  removeCountryColumnIfPresent_(sheet);

  sheet.getRange(1, 1, 1, 5).setValues([["ID", "Email Address", "Full Name", "Status", "Error"]]);
  sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#1e2a38").setFontColor("#ffffff");
  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 250);
  sheet.setColumnWidth(3, 180);
  sheet.setColumnWidth(4, 100);
  sheet.setColumnWidth(5, 360);
  
  SpreadsheetApp.getUi().alert("✅ Sheet setup complete!");
}

// =============================================
// STEP 3: Pull existing data from form responses
// =============================================
function syncData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const source = ss.getSheetByName(CONFIG.sourceSheet);
  const dest = ss.getSheetByName(CONFIG.destSheet);
  
  removeCountryColumnIfPresent_(dest);

  const lastRow = source.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert("No data found");
    return;
  }
  
  const data = source.getRange(2, 1, lastRow - 1, source.getLastColumn()).getValues();
  
  // Clear old data (keep header)
  if (dest.getLastRow() > 1) {
    dest.getRange(2, 1, dest.getLastRow() - 1, 5).clearContent();
  }
  
  // Map to destination format
  const output = data.map(row => [
    "",
    row[CONFIG.sourceColumns.email - 1],
    row[CONFIG.sourceColumns.fullName - 1],
    "",
    ""
  ]);
  
  dest.getRange(2, 1, output.length, 5).setValues(output);
  SpreadsheetApp.getUi().alert("✅ Synced " + output.length + " registrations!");
}

// =============================================
// STEP 4: Send emails to all pending
// =============================================
function sendAllEmails() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.destSheet);

  removeCountryColumnIfPresent_(sheet);
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert("No data to process");
    return;
  }
  
  const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  let sent = 0, failed = 0, skipped = 0;
  
  for (let i = 0; i < data.length; i++) {
    const [id, email, fullName, status] = data[i];
    
    if (status === "Sent" || !email) {
      skipped++;
      continue;
    }
    
    const row = i + 2;
    const result = sendEmail(email, fullName);
    
    if (result.ok) {
      sheet.getRange(row, 4).setValue("Sent").setBackground("#c6efce").setFontColor("#006100");
      sheet.getRange(row, 5).setValue("");
      sent++;
    } else {
      sheet.getRange(row, 4).setValue("Failed").setBackground("#ffc7ce").setFontColor("#9c0006");
      sheet.getRange(row, 5).setValue(result.error || "Unknown error");
      failed++;
    }
    
    Utilities.sleep(500);
  }
  
  SpreadsheetApp.getUi().alert("Done!\n\n✅ Sent: " + sent + "\n❌ Failed: " + failed + "\n⏭️ Skipped: " + skipped);
}

// =============================================
// ACCEPTANCE EMAILS (Selection Map only)
// =============================================
function sendAcceptanceTestEmail() {
  const testEmail = ACCEPTANCE_CONFIG.testEmail;
  const testName = ACCEPTANCE_CONFIG.testName;

  try {
    GmailApp.sendEmail(testEmail, "[TEST] " + ACCEPTANCE_CONFIG.subject, getAcceptancePlainText(testName), {
      name: ACCEPTANCE_CONFIG.senderName,
      htmlBody: getAcceptanceEmailHTML(testName)
    });
    notifyUser_("Test acceptance email sent to: " + testEmail);
  } catch (error) {
    notifyUser_("Error sending acceptance test email: " + error);
  }
}

function sendAcceptanceEmails() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ACCEPTANCE_CONFIG.sourceSheet);
  if (!sheet) {
    notifyUser_("Sheet not found: " + ACCEPTANCE_CONFIG.sourceSheet);
    return;
  }

  const setup = ensureAcceptanceColumns_(sheet);
  if (!setup.ok) {
    notifyUser_(setup.message || "Could not prepare columns for acceptance email sending.");
    return;
  }

  const columns = setup.columns;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    notifyUser_("No data found in: " + ACCEPTANCE_CONFIG.sourceSheet);
    return;
  }

  const lastCol = sheet.getLastColumn();
  const rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();

  let eligible = 0;
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let alreadySent = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2;
    const email = row[columns.email - 1];
    const fullName = row[columns.fullName - 1] || "";
    const ableToCommit = row[columns.ableToCommit - 1];
    const decision = row[columns.decision - 1];
    const status = row[columns.status - 1];

    if (!email || !isAcceptanceEligible_(ableToCommit, decision)) {
      skipped++;
      continue;
    }

    eligible++;
    if (normalizeAcceptanceValue_(status) === "sent") {
      alreadySent++;
      continue;
    }

    const result = sendAcceptanceEmail_(email, fullName);
    if (result.ok) {
      sheet.getRange(rowNumber, columns.status).setValue("Sent").setBackground("#c6efce").setFontColor("#006100");
      sheet.getRange(rowNumber, columns.error).setValue("");
      sent++;
    } else {
      sheet.getRange(rowNumber, columns.status).setValue("Failed").setBackground("#ffc7ce").setFontColor("#9c0006");
      sheet.getRange(rowNumber, columns.error).setValue(truncateAcceptanceError_(result.error));
      failed++;
    }

    Utilities.sleep(300);
  }

  notifyUser_(
    "Acceptance email run complete.\n\n" +
    "Eligible: " + eligible + "\n" +
    "Sent: " + sent + "\n" +
    "Already Sent: " + alreadySent + "\n" +
    "Failed: " + failed + "\n" +
    "Skipped (not eligible / no email): " + skipped
  );
}

function scheduleAcceptanceEmailsAt10AM() {
  const nextRun = getNextAcceptanceRunAtHour_(ACCEPTANCE_CONFIG.triggerHour || 10);
  const clearedCount = clearAcceptanceEmailSchedules_();

  ScriptApp.newTrigger("sendAcceptanceEmails")
    .timeBased()
    .at(nextRun)
    .create();

  const timezone = Session.getScriptTimeZone();
  const formatted = Utilities.formatDate(nextRun, timezone, "EEEE, d MMMM yyyy 'at' h:mm a z");

  notifyUser_(
    "Acceptance email trigger scheduled.\n\n" +
    "Source sheet: " + ACCEPTANCE_CONFIG.sourceSheet + "\n" +
    "Run time: " + formatted + "\n" +
    "Old schedule triggers removed: " + clearedCount
  );
}

function clearAcceptanceEmailSchedule() {
  const removed = clearAcceptanceEmailSchedules_();
  notifyUser_("Removed acceptance schedule trigger(s): " + removed);
}

function sendAcceptanceEmail_(email, fullName) {
  try {
    GmailApp.sendEmail(email, ACCEPTANCE_CONFIG.subject, getAcceptancePlainText(fullName), {
      name: ACCEPTANCE_CONFIG.senderName,
      htmlBody: getAcceptanceEmailHTML(fullName)
    });
    return { ok: true, error: "" };
  } catch (error) {
    Logger.log("Error sending acceptance email to " + email + ": " + error);
    return { ok: false, error: String(error) };
  }
}

function ensureAcceptanceColumns_(sheet) {
  const initialLastCol = sheet.getLastColumn();
  if (initialLastCol < 1) {
    return { ok: false, message: "No headers found in: " + ACCEPTANCE_CONFIG.sourceSheet };
  }

  let headers = sheet.getRange(1, 1, 1, initialLastCol).getValues()[0];
  const columns = {
    email: acceptanceFindHeaderIndex_(headers, ACCEPTANCE_CONFIG.headers.email),
    fullName: acceptanceFindHeaderIndex_(headers, ACCEPTANCE_CONFIG.headers.fullName),
    ableToCommit: acceptanceFindHeaderIndex_(headers, ACCEPTANCE_CONFIG.headers.ableToCommit),
    decision: acceptanceFindHeaderIndex_(headers, ACCEPTANCE_CONFIG.headers.decision),
    status: acceptanceFindHeaderIndex_(headers, [ACCEPTANCE_CONFIG.headers.status]),
    error: acceptanceFindHeaderIndex_(headers, [ACCEPTANCE_CONFIG.headers.error])
  };

  const missingRequired = [];
  if (!columns.email) missingRequired.push("Email address");
  if (!columns.fullName) missingRequired.push("Full Name");
  if (!columns.ableToCommit) missingRequired.push("Able to Commit");
  if (!columns.decision) missingRequired.push("Decision");

  if (missingRequired.length) {
    return {
      ok: false,
      message: "Missing required columns in '" + ACCEPTANCE_CONFIG.sourceSheet + "': " + missingRequired.join(", ")
    };
  }

  let currentLastCol = initialLastCol;

  if (!columns.status) {
    currentLastCol++;
    sheet.getRange(1, currentLastCol).setValue(ACCEPTANCE_CONFIG.headers.status);
    sheet.getRange(1, currentLastCol).setFontWeight("bold");
    columns.status = currentLastCol;
  }

  if (!columns.error) {
    currentLastCol++;
    sheet.getRange(1, currentLastCol).setValue(ACCEPTANCE_CONFIG.headers.error);
    sheet.getRange(1, currentLastCol).setFontWeight("bold");
    sheet.setColumnWidth(currentLastCol, 360);
    columns.error = currentLastCol;
  }

  return { ok: true, columns };
}

function acceptanceFindHeaderIndex_(headers, candidates) {
  if (!headers || !headers.length) return 0;
  const normalizedHeaders = headers.map(value => normalizeAcceptanceValue_(value));
  for (let i = 0; i < candidates.length; i++) {
    const target = normalizeAcceptanceValue_(candidates[i]);
    const index = normalizedHeaders.indexOf(target);
    if (index !== -1) return index + 1;
  }
  return 0;
}

function isAcceptanceEligible_(ableToCommit, decision) {
  return normalizeAcceptanceValue_(ableToCommit) === "yes" &&
    normalizeAcceptanceValue_(decision) === "yes";
}

function normalizeAcceptanceValue_(value) {
  return String(value || "").trim().toLowerCase();
}

function truncateAcceptanceError_(value) {
  return String(value || "").slice(0, 500);
}

function clearAcceptanceEmailSchedules_() {
  let removed = 0;
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === "sendAcceptanceEmails") {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  });
  return removed;
}

function getNextAcceptanceRunAtHour_(hour24) {
  const timezone = Session.getScriptTimeZone();
  const now = new Date();

  const todayYmd = Utilities.formatDate(now, timezone, "yyyy-MM-dd");
  const todayOffset = Utilities.formatDate(now, timezone, "XXX");
  let target = new Date(todayYmd + "T" + pad2_(hour24) + ":00:00" + todayOffset);

  if (target.getTime() <= now.getTime()) {
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const tomorrowYmd = Utilities.formatDate(tomorrow, timezone, "yyyy-MM-dd");
    const tomorrowOffset = Utilities.formatDate(tomorrow, timezone, "XXX");
    target = new Date(tomorrowYmd + "T" + pad2_(hour24) + ":00:00" + tomorrowOffset);
  }

  return target;
}

function pad2_(value) {
  return String(value).padStart(2, "0");
}

// =============================================
// STEP 5: Enable auto-send for new registrations
// =============================================
function createTrigger() {
  // Remove old triggers
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "onFormSubmit") ScriptApp.deleteTrigger(t);
  });
  
  // Create new trigger
  ScriptApp.newTrigger("onFormSubmit")
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onFormSubmit()
    .create();
  
  SpreadsheetApp.getUi().alert("✅ Trigger created!\n\nNew registrations will auto-receive emails.");
}

// =============================================
// STEP 5B: Enable auto-build for Drill Downs + Location Master
// =============================================
function createDrilldownLocationTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "onFormSubmitBuildSheets") ScriptApp.deleteTrigger(t);
  });

  ScriptApp.newTrigger("onFormSubmitBuildSheets")
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onFormSubmit()
    .create();

  SpreadsheetApp.getUi().alert("✅ Trigger created!\n\nNew registrations will auto-build Drill Downs and Location Master.");
}

// =============================================
// AUTO TRIGGER (runs on new form submit)
// =============================================
function onFormSubmit(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.destSheet);

  removeCountryColumnIfPresent_(sheet);
  
  const email = e.values[CONFIG.sourceColumns.email - 1];
  const fullName = e.values[CONFIG.sourceColumns.fullName - 1];
  
  const newRow = sheet.getLastRow() + 1;
  sheet.getRange(newRow, 1, 1, 5).setValues([["", email, fullName, "", ""]]);
  
  const result = sendEmail(email, fullName);
  if (result.ok) {
    sheet.getRange(newRow, 4).setValue("Sent").setBackground("#c6efce").setFontColor("#006100");
    sheet.getRange(newRow, 5).setValue("");
  } else {
    sheet.getRange(newRow, 4).setValue("Failed").setBackground("#ffc7ce").setFontColor("#9c0006");
    sheet.getRange(newRow, 5).setValue(result.error || "Unknown error");
  }
}

function onFormSubmitBuildSheets(e) {
  buildDataDrillDowns();
  buildLocationMaster();
}

// =============================================
// HELPER: Send single email
// =============================================
function sendEmail(email, fullName) {
  try {
    GmailApp.sendEmail(email, CONFIG.emailSubject, getPlainText(fullName), {
      name: CONFIG.senderName,
      htmlBody: getEmailHTML(fullName)
    });
    return { ok: true, error: "" };
  } catch (e) {
    Logger.log("Error sending to " + email + ": " + e);
    return { ok: false, error: String(e) };
  }
}

// =============================================
// MENU (appears when you open the sheet)
// =============================================
function onOpen() {
  SpreadsheetApp.getUi().createMenu("Email Manager")
    .addItem("Step 0: Add ID Column", "migrateToIdColumn")
    .addItem("Step 1: Send Test Email", "sendTestEmail")
    .addItem("Step 2: Setup Sheet", "setupSheet")
    .addItem("Step 3: Sync Data", "syncData")
    .addItem("Step 4: Send All Emails", "sendAllEmails")
    .addItem("Step 5: Create Trigger", "createTrigger")
    .addItem("Step 6: Assign Missing IDs", "assignMissingIds")
    .addItem("Step 7: Create ID Trigger", "createIdTrigger")
    .addItem("Step 8: Build Data Drill Downs", "buildDataDrillDowns")
    .addItem("Step 9: Build Location Master", "buildLocationMaster")
    .addItem("Step 10: Clean Case-Sensitive Columns", "cleanCaseSensitiveColumns")
    .addItem("Step 11: Create Drilldown/Location Trigger", "createDrilldownLocationTrigger")
    .addItem("Step 12: Rebuild Selected People", "rebuildSelectedPeopleFromDrillDowns")
    .addItem("Step 13: Send Report", "sendReport")
    .addItem("Step 14: Test Gemini Key", "testGeminiKey")
    .addItem("Step 15: Send Acceptance Test Email", "sendAcceptanceTestEmail")
    .addItem("Step 16: Send Acceptance Emails (Eligible Only)", "sendAcceptanceEmails")
    .addItem("Step 17: Schedule Acceptance Send (10AM)", "scheduleAcceptanceEmailsAt10AM")
    .addItem("Step 18: Clear Acceptance Send Schedule", "clearAcceptanceEmailSchedule")
    .addToUi();
}

function notifyUser_(message) {
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (error) {
    Logger.log(message);
  }
}

function removeCountryColumnIfPresent_(sheet) {
  if (!sheet) return;
  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  let countryCol = -1;
  for (let i = 0; i < headers.length; i++) {
    if (String(headers[i]).trim().toLowerCase() === "country") {
      countryCol = i + 1;
      break;
    }
  }

  if (countryCol !== -1) {
    sheet.deleteColumn(countryCol);
  }
}
