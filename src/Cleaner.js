/**
 * =============================================
 * BEHIND THE DATA ACADEMY - CASE CLEANUP
 * Normalize case for Country, Full Name, State / Region
 * across key sheets.
 * =============================================
 */

const CLEAN_CONFIG = {
  sheets: ["Auto-Reg Email", "Location Master", "Data Drill Downs"],
  fullNameHeaders: ["full name", "name"],
  countryHeaders: ["country", "country/region", "country or region"],
  stateHeaders: ["state / region", "state/region", "state", "region"]
};

function cleanCaseSensitiveColumns() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let updatedSheets = 0;
  let updatedCells = 0;

  for (let s = 0; s < CLEAN_CONFIG.sheets.length; s++) {
    const sheetName = CLEAN_CONFIG.sheets[s];
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) continue;

    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 2 || lastCol < 1) continue;

    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const fullNameCol = findHeaderIndex_(headers, CLEAN_CONFIG.fullNameHeaders);
    const countryCol = findHeaderIndex_(headers, CLEAN_CONFIG.countryHeaders);
    const stateCol = findHeaderIndex_(headers, CLEAN_CONFIG.stateHeaders);

    let changedThisSheet = false;
    const updatedNames = normalizeColumnCase_(sheet, lastRow, fullNameCol);
    updatedCells += updatedNames;
    if (updatedNames > 0) changedThisSheet = true;
    const updatedCountries = normalizeColumnCase_(sheet, lastRow, countryCol);
    updatedCells += updatedCountries;
    if (updatedCountries > 0) changedThisSheet = true;
    const updatedStates = normalizeColumnCase_(sheet, lastRow, stateCol);
    updatedCells += updatedStates;
    if (updatedStates > 0) changedThisSheet = true;

    if (changedThisSheet) updatedSheets++;
  }

  SpreadsheetApp.getUi().alert(
    "Case cleanup complete.\n\nSheets updated: " + updatedSheets + "\nCells updated: " + updatedCells
  );
}

function normalizeColumnCase_(sheet, lastRow, colIndex) {
  if (!colIndex) return 0;

  const range = sheet.getRange(2, colIndex, lastRow - 1, 1);
  const values = range.getValues();
  let updated = 0;

  for (let i = 0; i < values.length; i++) {
    const original = values[i][0];
    const normalized = toTitleCase_(original);
    if (normalized !== original) {
      values[i][0] = normalized;
      updated++;
    }
  }

  if (updated > 0) {
    range.setValues(values);
  }

  return updated;
}

function toTitleCase_(value) {
  if (value === null || value === undefined) return value;
  const raw = String(value);
  const trimmed = raw.trim();
  if (!trimmed) return value;

  const parts = trimmed.split(/(\s+|[-/])/);
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part || part.match(/^\s+$/) || part === "-" || part === "/") continue;
    parts[i] = formatToken_(part);
  }
  return parts.join("");
}

function formatToken_(token) {
  const subParts = token.split("'");
  for (let i = 0; i < subParts.length; i++) {
    const part = subParts[i];
    if (!part) continue;
    if (shouldKeepUpper_(part)) {
      subParts[i] = part.toUpperCase();
    } else {
      subParts[i] = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
    }
  }
  return subParts.join("'");
}

function shouldKeepUpper_(token) {
  if (!token) return false;
  if (!/^[A-Za-z0-9.&]+$/.test(token)) return false;
  if (token.length <= 3 && token.toUpperCase() === token) return true;
  return false;
}
