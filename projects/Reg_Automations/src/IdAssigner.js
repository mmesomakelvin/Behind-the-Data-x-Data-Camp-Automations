/**
 * =============================================
 * BEHIND THE DATA ACADEMY - ID ASSIGNER
 * Separate helper to assign unique IDs in Auto-Reg Email
 * =============================================
 */

const ID_CONFIG = {
  destSheet: "Auto-Reg Email",
  idPrefix: "BTD-",
  idDigits: 6,
  counterKey: "BTD_ID_COUNTER"
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
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    let counter = getOrInitCounter_(sheet);
    for (let i = 0; i < ids.length; i++) {
      if (!ids[i][0] && emails[i][0]) {
        ids[i][0] = formatId_(counter);
        counter++;
        updated++;
      }
    }

    sheet.getRange(2, 1, ids.length, 1).setValues(ids);
    setCounter_(counter);
  } finally {
    lock.releaseLock();
  }

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

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    let counter = getOrInitCounter_(sheet);
    for (let attempt = 0; attempt < 10; attempt++) {
      Utilities.sleep(300);
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) continue;

      const emails = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

      for (let i = emails.length - 1; i >= 0; i--) {
        if (emails[i][0] === email && !ids[i][0]) {
          sheet.getRange(i + 2, 1).setValue(formatId_(counter));
          counter++;
          setCounter_(counter);
          return;
        }
      }
    }
  } finally {
    lock.releaseLock();
  }
}

function generateId_() {
  return ID_CONFIG.idPrefix + Utilities.getUuid();
}

function formatId_(counter) {
  const num = String(counter).padStart(ID_CONFIG.idDigits, "0");
  return ID_CONFIG.idPrefix + num;
}

function getOrInitCounter_(sheet) {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty(ID_CONFIG.counterKey);
  const parsed = parseInt(raw, 10);
  if (!isNaN(parsed) && parsed > 0) return parsed;

  const next = getNextCounterFromSheet_(sheet);
  props.setProperty(ID_CONFIG.counterKey, String(next));
  return next;
}

function setCounter_(counter) {
  PropertiesService.getScriptProperties().setProperty(ID_CONFIG.counterKey, String(counter));
}

function getNextCounterFromSheet_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 1;

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let max = 0;
  const prefix = ID_CONFIG.idPrefix;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i][0];
    if (typeof id === "string" && id.indexOf(prefix) === 0) {
      const num = parseInt(id.slice(prefix.length), 10);
      if (!isNaN(num) && num > max) max = num;
    }
  }
  return max + 1;
}
