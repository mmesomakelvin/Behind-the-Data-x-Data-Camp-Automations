/**
 * =============================================
 * BEHIND THE DATA ACADEMY - ID ASSIGNER
 * Separate helper to assign unique IDs in Auto-Reg Email
 * =============================================
 */

const ID_CONFIG = {
  destSheet: "Auto-Reg Email",
  idPrefix: "BTD-"
};

function migrateToIdColumn() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ID_CONFIG.destSheet);
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Sheet not found: " + ID_CONFIG.destSheet);
    return;
  }

  const header = sheet.getRange(1, 1).getValue();
  if (String(header).trim().toLowerCase() === "id") {
    SpreadsheetApp.getUi().alert("ID column already exists.");
    return;
  }

  sheet.insertColumnBefore(1);
  if (typeof setupSheet === "function") {
    setupSheet();
  } else {
    sheet.getRange(1, 1, 1, 6).setValues([["ID", "Email Address", "Full Name", "Country", "Status", "Error"]]);
  }

  SpreadsheetApp.getUi().alert("ID column added. Existing data shifted to the right.");
}

function assignMissingIds() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ID_CONFIG.destSheet);
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Sheet not found: " + ID_CONFIG.destSheet);
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert("No data to process");
    return;
  }

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const emails = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  let updated = 0;

  for (let i = 0; i < ids.length; i++) {
    if (!ids[i][0] && emails[i][0]) {
      ids[i][0] = generateId_();
      updated++;
    }
  }

  sheet.getRange(2, 1, ids.length, 1).setValues(ids);
  SpreadsheetApp.getUi().alert("IDs assigned: " + updated);
}

function createIdTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "assignIdOnFormSubmit") ScriptApp.deleteTrigger(t);
  });

  ScriptApp.newTrigger("assignIdOnFormSubmit")
    .forSpreadsheet(SpreadsheetApp.getActive())
    .onFormSubmit()
    .create();

  SpreadsheetApp.getUi().alert("ID trigger created. New registrations will auto-receive IDs.");
}

function assignIdOnFormSubmit(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(ID_CONFIG.destSheet);
  if (!sheet || !e || !e.values) return;

  const emailIndex = (typeof CONFIG !== "undefined" && CONFIG.sourceColumns && CONFIG.sourceColumns.email)
    ? CONFIG.sourceColumns.email - 1
    : 1;

  const email = e.values[emailIndex];
  if (!email) return;

  // Give Code.js onFormSubmit a moment to append the row
  Utilities.sleep(500);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const emails = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (let i = emails.length - 1; i >= 0; i--) {
    if (emails[i][0] === email && !ids[i][0]) {
      sheet.getRange(i + 2, 1).setValue(generateId_());
      break;
    }
  }
}

function generateId_() {
  return ID_CONFIG.idPrefix + Utilities.getUuid();
}
