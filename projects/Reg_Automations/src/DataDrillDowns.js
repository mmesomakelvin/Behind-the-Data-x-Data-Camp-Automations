/**
 * =============================================
 * BEHIND THE DATA ACADEMY - DATA DRILL DOWNS
 * Create "Data Drill Downs" sheet with remaining form columns
 * and matching Unique ID from Auto-Reg Email.
 * =============================================
 */

const DRILL_CONFIG = {
  sourceSheet: "Form responses 1",
  idSheet: "Auto-Reg Email",
  destSheet: "Data Drill Downs",
  idHeader: "ID",
  emailHeader: "Email Address",
  selectionHeader: "Selection Status",
  selectionValues: ["Selected", "Not Selected"],
  excludeSourceColumns: [1, 2],
  excludeHeaderNames: [
    "timestamp",
    "column 2",
    "please confirm the following:",
    "please confirm the following",
    "country",
    "country/region",
    "country or region",
    "state / region",
    "state/region",
    "state",
    "region",
    "column 19",
    "column 20",
    "column 21",
    "column 22"
  ]
};

function buildDataDrillDowns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceName = (typeof CONFIG !== "undefined" && CONFIG.sourceSheet) ? CONFIG.sourceSheet : DRILL_CONFIG.sourceSheet;
  const idName = (typeof CONFIG !== "undefined" && CONFIG.destSheet) ? CONFIG.destSheet : DRILL_CONFIG.idSheet;
  const destName = DRILL_CONFIG.destSheet;

  const source = ss.getSheetByName(sourceName);
  const idSheet = ss.getSheetByName(idName);

  if (!source) {
    SpreadsheetApp.getUi().alert("Sheet not found: " + sourceName);
    return;
  }
  if (!idSheet) {
    SpreadsheetApp.getUi().alert("Sheet not found: " + idName);
    return;
  }

  const sourceLastRow = source.getLastRow();
  const sourceLastCol = source.getLastColumn();
  if (sourceLastRow < 2 || sourceLastCol < 1) {
    SpreadsheetApp.getUi().alert("No form responses found in: " + sourceName);
    return;
  }

  const sourceHeaders = source.getRange(1, 1, 1, sourceLastCol).getValues()[0];

  const idLastRow = idSheet.getLastRow();
  const idLastCol = idSheet.getLastColumn();
  if (idLastRow < 1 || idLastCol < 1) {
    SpreadsheetApp.getUi().alert("No headers found in: " + idName);
    return;
  }

  const idHeaders = idSheet.getRange(1, 1, 1, idLastCol).getValues()[0];

  const sourceEmailCol = getSourceEmailCol_(sourceHeaders);
  if (!sourceEmailCol) {
    SpreadsheetApp.getUi().alert("Could not find email column in: " + sourceName);
    return;
  }

  const idCol = findHeaderIndex_(idHeaders, [DRILL_CONFIG.idHeader, "id"]);
  const idEmailCol = findHeaderIndex_(idHeaders, [DRILL_CONFIG.emailHeader, "email", "email address"]);
  if (!idCol || !idEmailCol) {
    SpreadsheetApp.getUi().alert("Auto-Reg Email sheet must have ID and Email Address columns.");
    return;
  }

  const excludedIndexes = getExcludedSourceIndexes_();
  const idHeaderSet = new Set(idHeaders.map(h => String(h).trim().toLowerCase()).filter(Boolean));

  const includeIndexes = [];
  const includeHeaders = [];
  for (let i = 0; i < sourceHeaders.length; i++) {
    const header = sourceHeaders[i];
    const headerKey = String(header).trim().toLowerCase();
    const colIndex = i + 1;

    if (excludedIndexes.has(colIndex)) continue;
    if (headerKey && DRILL_CONFIG.excludeHeaderNames.indexOf(headerKey) !== -1) continue;
    if (headerKey && idHeaderSet.has(headerKey)) continue;

    includeIndexes.push(colIndex);
    includeHeaders.push(header);
  }

  if (includeIndexes.length === 0) {
    SpreadsheetApp.getUi().alert("No remaining columns to add from: " + sourceName);
    return;
  }

  const idMap = buildIdMap_(idSheet, idLastRow, idLastCol, idCol, idEmailCol);

  const sourceData = source.getRange(2, 1, sourceLastRow - 1, sourceLastCol).getValues();
  const output = [];
  for (let i = 0; i < sourceData.length; i++) {
    const row = sourceData[i];
    const email = row[sourceEmailCol - 1];
    const id = email ? (idMap.get(normalizeEmail_(email)) || "") : "";

    const outRow = [id];
    for (let j = 0; j < includeIndexes.length; j++) {
      outRow.push(row[includeIndexes[j] - 1]);
    }
    output.push(outRow);
  }

  let dest = ss.getSheetByName(destName);
  const selectionMap = new Map();
  if (!dest) {
    dest = ss.insertSheet(destName);
  } else {
    cacheExistingSelections_(dest, selectionMap);
    dest.clearContents();
  }

  const totalCols = 1 + includeHeaders.length + 1;
  dest.getRange(1, 1, 1, totalCols).setValues([["ID", ...includeHeaders, DRILL_CONFIG.selectionHeader]]);
  dest.getRange(1, 1, 1, totalCols)
    .setFontWeight("bold")
    .setBackground("#1e2a38")
    .setFontColor("#ffffff");

  if (output.length > 0) {
    const selectionValues = applySelectionValues_(output, selectionMap);
    dest.getRange(2, 1, output.length, totalCols).setValues(selectionValues);
    applySelectionValidation_(dest, totalCols, output.length);
  }

  SpreadsheetApp.getUi().alert("Data Drill Downs updated: " + output.length + " rows.");
}

function cacheExistingSelections_(sheet, selectionMap) {
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return;

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const selectionCol = findHeaderIndex_(headers, [DRILL_CONFIG.selectionHeader]);
  if (!selectionCol) return;

  const ids = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  const selections = sheet.getRange(2, selectionCol, lastRow - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i][0];
    const selection = selections[i][0];
    if (id && selection) {
      selectionMap.set(String(id), selection);
    }
  }
}

function applySelectionValues_(rows, selectionMap) {
  const output = [];
  const defaultValue = DRILL_CONFIG.selectionValues[1];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].slice();
    const id = row[0];
    const selection = id && selectionMap.has(String(id)) ? selectionMap.get(String(id)) : defaultValue;
    row.push(selection);
    output.push(row);
  }
  return output;
}

function applySelectionValidation_(sheet, selectionCol, numRows) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(DRILL_CONFIG.selectionValues, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, selectionCol, numRows, 1).setDataValidation(rule);
}

function getSourceEmailCol_(sourceHeaders) {
  if (typeof CONFIG !== "undefined" && CONFIG.sourceColumns && CONFIG.sourceColumns.email) {
    return CONFIG.sourceColumns.email;
  }
  return findHeaderIndex_(sourceHeaders, [DRILL_CONFIG.emailHeader, "email", "email address"]);
}

function getExcludedSourceIndexes_() {
  const excluded = new Set(DRILL_CONFIG.excludeSourceColumns || []);
  if (typeof CONFIG !== "undefined" && CONFIG.sourceColumns) {
    if (CONFIG.sourceColumns.email) excluded.add(CONFIG.sourceColumns.email);
    if (CONFIG.sourceColumns.fullName) excluded.add(CONFIG.sourceColumns.fullName);
  }
  return excluded;
}

function buildIdMap_(idSheet, idLastRow, idLastCol, idCol, idEmailCol) {
  const map = new Map();
  if (idLastRow < 2) return map;

  const rows = idSheet.getRange(2, 1, idLastRow - 1, idLastCol).getValues();
  for (let i = 0; i < rows.length; i++) {
    const email = rows[i][idEmailCol - 1];
    const id = rows[i][idCol - 1];
    if (!email || !id) continue;

    const key = normalizeEmail_(email);
    if (!map.has(key)) {
      map.set(key, id);
    }
  }
  return map;
}

function findHeaderIndex_(headers, candidates) {
  if (!headers || !headers.length) return 0;
  const lower = headers.map(h => String(h).trim().toLowerCase());
  for (let i = 0; i < candidates.length; i++) {
    const target = String(candidates[i]).trim().toLowerCase();
    const idx = lower.indexOf(target);
    if (idx !== -1) return idx + 1;
  }
  return 0;
}

function normalizeEmail_(value) {
  return String(value).trim().toLowerCase();
}
