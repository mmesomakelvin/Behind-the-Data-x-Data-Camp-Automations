/**
 * =============================================
 * BEHIND THE DATA ACADEMY - SELECTED PEOPLE
 * Syncs selected rows from Data Drill Downs into a dedicated sheet.
 * =============================================
 */

const SELECTED_CONFIG = {
  drillSheet: "Data Drill Downs",
  destSheet: "Selected People",
  selectionHeader: "Selection Status",
  selectedValue: "Selected",
  idHeader: "ID",
  emailHeader: "Email Address",
  fullNameHeader: "Full Name",
  linkedinHeaders: ["linkedin url", "linkedin profile", "linkedin"]
};

function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (!sheet || sheet.getName() !== SELECTED_CONFIG.drillSheet) return;

  const lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const selectionCol = findHeaderIndex_(headers, [SELECTED_CONFIG.selectionHeader]);
  if (!selectionCol) return;

  const editStartCol = e.range.getColumn();
  const editEndCol = e.range.getColumn() + e.range.getNumColumns() - 1;
  if (selectionCol < editStartCol || selectionCol > editEndCol) return;

  const startRow = e.range.getRow();
  if (startRow === 1) return;

  const numRows = e.range.getNumRows();
  syncSelectedFromDrillDown_(sheet, headers, selectionCol, startRow, numRows);
}

function rebuildSelectedPeopleFromDrillDowns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const drill = ss.getSheetByName(SELECTED_CONFIG.drillSheet);
  if (!drill) {
    SpreadsheetApp.getUi().alert("Sheet not found: " + SELECTED_CONFIG.drillSheet);
    return;
  }

  const lastRow = drill.getLastRow();
  const lastCol = drill.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    SpreadsheetApp.getUi().alert("No data found in: " + SELECTED_CONFIG.drillSheet);
    return;
  }

  const headers = drill.getRange(1, 1, 1, lastCol).getValues()[0];
  const selectionCol = findHeaderIndex_(headers, [SELECTED_CONFIG.selectionHeader]);
  if (!selectionCol) {
    SpreadsheetApp.getUi().alert("Selection column not found in: " + SELECTED_CONFIG.drillSheet);
    return;
  }

  syncSelectedFromDrillDown_(drill, headers, selectionCol, 2, lastRow - 1, true);
  SpreadsheetApp.getUi().alert("Selected People rebuilt.");
}

function syncSelectedFromDrillDown_(drill, headers, selectionCol, startRow, numRows, fullRebuild) {
  const lastRow = drill.getLastRow();
  if (lastRow < startRow) return;

  const endRow = Math.min(startRow + numRows - 1, lastRow);
  const rowCount = endRow - startRow + 1;
  const drillData = drill.getRange(startRow, 1, rowCount, drill.getLastColumn()).getValues();

  const linkedinCol = findHeaderIndex_(headers, SELECTED_CONFIG.linkedinHeaders);
  const idToContact = buildIdToContactMap_();
  const selectedSheet = getOrCreateSelectedSheet_();

  if (fullRebuild) {
    const selectedLastRow = selectedSheet.getLastRow();
    const selectedLastCol = selectedSheet.getLastColumn();
    if (selectedLastRow > 1 && selectedLastCol > 0) {
      selectedSheet.getRange(2, 1, selectedLastRow - 1, selectedLastCol).clearContent();
    }
  }

  const selectedMap = buildSelectedRowMap_(selectedSheet);

  for (let i = 0; i < drillData.length; i++) {
    const row = drillData[i];
    const id = row[0];
    const selection = row[selectionCol - 1];
    if (!id) continue;

    const isSelected = String(selection).trim().toLowerCase() === SELECTED_CONFIG.selectedValue.toLowerCase();
    if (!isSelected) {
      removeSelectedRow_(selectedSheet, selectedMap, id);
      continue;
    }

    const contact = idToContact.get(String(id)) || { email: "", fullName: "" };
    const linkedin = linkedinCol ? row[linkedinCol - 1] : "";
    upsertSelectedRow_(selectedSheet, selectedMap, id, contact.fullName, contact.email, linkedin);
  }
}

function getOrCreateSelectedSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SELECTED_CONFIG.destSheet);
  if (!sheet) {
    sheet = ss.insertSheet(SELECTED_CONFIG.destSheet);
  }

  const headers = ["ID", "Full Name", "Email Address", "LinkedIn Url"];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#1e2a38")
    .setFontColor("#ffffff");
  return sheet;
}

function buildSelectedRowMap_(sheet) {
  const map = new Map();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return map;

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i][0];
    if (id) map.set(String(id), i + 2);
  }
  return map;
}

function upsertSelectedRow_(sheet, selectedMap, id, fullName, email, linkedin) {
  const rowValues = [[id, fullName, email, linkedin]];
  if (selectedMap.has(String(id))) {
    const row = selectedMap.get(String(id));
    sheet.getRange(row, 1, 1, rowValues[0].length).setValues(rowValues);
  } else {
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, rowValues[0].length).setValues(rowValues);
    selectedMap.set(String(id), sheet.getLastRow());
  }
}

function removeSelectedRow_(sheet, selectedMap, id) {
  const key = String(id);
  if (!selectedMap.has(key)) return;
  const row = selectedMap.get(key);
  sheet.deleteRow(row);

  const updated = new Map();
  selectedMap.forEach((value, mapId) => {
    if (mapId === key) return;
    updated.set(mapId, value > row ? value - 1 : value);
  });
  selectedMap.clear();
  updated.forEach((value, mapId) => selectedMap.set(mapId, value));
}

function buildIdToContactMap_() {
  const map = new Map();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = (typeof CONFIG !== "undefined" && CONFIG.destSheet) ? CONFIG.destSheet : "Auto-Reg Email";
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return map;

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return map;

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const idCol = findHeaderIndex_(headers, [SELECTED_CONFIG.idHeader, "id"]);
  const emailCol = findHeaderIndex_(headers, [SELECTED_CONFIG.emailHeader, "email", "email address"]);
  const nameCol = findHeaderIndex_(headers, [SELECTED_CONFIG.fullNameHeader, "name"]);
  if (!idCol) return map;

  const rows = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  for (let i = 0; i < rows.length; i++) {
    const id = rows[i][idCol - 1];
    if (!id) continue;
    map.set(String(id), {
      email: emailCol ? rows[i][emailCol - 1] : "",
      fullName: nameCol ? rows[i][nameCol - 1] : ""
    });
  }
  return map;
}
