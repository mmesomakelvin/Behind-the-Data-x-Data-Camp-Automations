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
  emailHeader: "Email Address"
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
  if (!dest) {
    dest = ss.insertSheet(destName);
  } else {
    dest.clearContents();
  }

  const totalCols = 1 + includeHeaders.length;
  dest.getRange(1, 1, 1, totalCols).setValues([["ID", ...includeHeaders]]);
  dest.getRange(1, 1, 1, totalCols)
    .setFontWeight("bold")
    .setBackground("#1e2a38")
    .setFontColor("#ffffff");

  if (output.length > 0) {
    dest.getRange(2, 1, output.length, totalCols).setValues(output);
  }

  SpreadsheetApp.getUi().alert("Data Drill Downs updated: " + output.length + " rows.");
}

function getSourceEmailCol_(sourceHeaders) {
  if (typeof CONFIG !== "undefined" && CONFIG.sourceColumns && CONFIG.sourceColumns.email) {
    return CONFIG.sourceColumns.email;
  }
  return findHeaderIndex_(sourceHeaders, [DRILL_CONFIG.emailHeader, "email", "email address"]);
}

function getExcludedSourceIndexes_() {
  const excluded = new Set();
  if (typeof CONFIG !== "undefined" && CONFIG.sourceColumns) {
    Object.keys(CONFIG.sourceColumns).forEach(k => {
      const idx = CONFIG.sourceColumns[k];
      if (idx) excluded.add(idx);
    });
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