/**
 * =============================================
 * BEHIND THE DATA ACADEMY - LOCATION MASTER
 * Create "Location Master" sheet with Country and State / Region
 * matched to Unique ID from Auto-Reg Email.
 * =============================================
 */

const LOCATION_CONFIG = {
  sourceSheet: "Form responses 1",
  idSheet: "Auto-Reg Email",
  destSheet: "Location Master",
  idHeader: "ID",
  emailHeader: "Email Address",
  countryHeaders: ["country", "country/region", "country or region"],
  stateHeaders: ["state / region", "state/region", "state", "region"]
};

function buildLocationMaster() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sourceName = (typeof CONFIG !== "undefined" && CONFIG.sourceSheet) ? CONFIG.sourceSheet : LOCATION_CONFIG.sourceSheet;
  const idName = (typeof CONFIG !== "undefined" && CONFIG.destSheet) ? CONFIG.destSheet : LOCATION_CONFIG.idSheet;
  const destName = LOCATION_CONFIG.destSheet;

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

  const sourceEmailCol = getLocationEmailCol_(sourceHeaders);
  if (!sourceEmailCol) {
    SpreadsheetApp.getUi().alert("Could not find email column in: " + sourceName);
    return;
  }

  let countryCol = findHeaderIndex_(sourceHeaders, LOCATION_CONFIG.countryHeaders);
  if (!countryCol && typeof CONFIG !== "undefined" && CONFIG.sourceColumns && CONFIG.sourceColumns.country) {
    countryCol = CONFIG.sourceColumns.country;
  }
  if (!countryCol) {
    SpreadsheetApp.getUi().alert("Could not find Country column in: " + sourceName);
    return;
  }

  const stateCol = findHeaderIndex_(sourceHeaders, LOCATION_CONFIG.stateHeaders);
  if (!stateCol) {
    SpreadsheetApp.getUi().alert("Could not find State / Region column in: " + sourceName);
    return;
  }

  const idCol = findHeaderIndex_(idHeaders, [LOCATION_CONFIG.idHeader, "id"]);
  const idEmailCol = findHeaderIndex_(idHeaders, [LOCATION_CONFIG.emailHeader, "email", "email address"]);
  if (!idCol || !idEmailCol) {
    SpreadsheetApp.getUi().alert("Auto-Reg Email sheet must have ID and Email Address columns.");
    return;
  }

  const idMap = buildIdMap_(idSheet, idLastRow, idLastCol, idCol, idEmailCol);

  const sourceData = source.getRange(2, 1, sourceLastRow - 1, sourceLastCol).getValues();
  const output = [];
  for (let i = 0; i < sourceData.length; i++) {
    const row = sourceData[i];
    const email = row[sourceEmailCol - 1];
    const id = email ? (idMap.get(normalizeEmail_(email)) || "") : "";
    const country = row[countryCol - 1];
    const state = row[stateCol - 1];
    output.push([id, country, state]);
  }

  let dest = ss.getSheetByName(destName);
  if (!dest) {
    dest = ss.insertSheet(destName);
  } else {
    dest.clearContents();
  }

  dest.getRange(1, 1, 1, 3).setValues([["ID", "Country", "State / Region"]]);
  dest.getRange(1, 1, 1, 3)
    .setFontWeight("bold")
    .setBackground("#1e2a38")
    .setFontColor("#ffffff");

  if (output.length > 0) {
    dest.getRange(2, 1, output.length, 3).setValues(output);
  }

  SpreadsheetApp.getUi().alert("Location Master updated: " + output.length + " rows.");
}

function getLocationEmailCol_(sourceHeaders) {
  if (typeof CONFIG !== "undefined" && CONFIG.sourceColumns && CONFIG.sourceColumns.email) {
    return CONFIG.sourceColumns.email;
  }
  return findHeaderIndex_(sourceHeaders, [LOCATION_CONFIG.emailHeader, "email", "email address"]);
}
