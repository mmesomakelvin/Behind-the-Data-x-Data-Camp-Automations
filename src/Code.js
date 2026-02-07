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
    .addToUi();
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
