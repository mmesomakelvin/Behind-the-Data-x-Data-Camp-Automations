function handleStatusEdit(e) {
  if (!e || !e.range) {
    Logger.log("Status edit event did not include a range.");
    return;
  }

  withScriptLock_(function () {
    const sheet = e.range.getSheet();
    const sourceSheet = getRegistrationSourceSheet_();
    if (sheet.getSheetId() !== sourceSheet.getSheetId()) {
      return;
    }

    let columns;
    try {
      columns = getReviewColumnIndexes_(sourceSheet);
    } catch (err) {
      Logger.log("Skipped status edit: " + err);
      return;
    }

    const statusColumnNumber = columns.statusIndex + 1;
    const editStartColumn = e.range.getColumn();
    const editEndColumn = e.range.getLastColumn();
    if (statusColumnNumber < editStartColumn || statusColumnNumber > editEndColumn) {
      return;
    }

    ensureAcceptedSheet_();
    ensureColorGuideSheet_();

    const startRow = Math.max(e.range.getRow(), 2);
    const endRow = e.range.getLastRow();
    for (let row = startRow; row <= endRow; row++) {
      applyReviewStateToRow_(sourceSheet, row, columns);
    }

    syncAcceptedCandidatesSheet_(sourceSheet, columns);
    Logger.log("Processed status edit rows " + startRow + " to " + endRow + ".");
  });
}

function refreshReviewTracking() {
  withScriptLock_(function () {
    refreshReviewTracking_();
    logAndToast_("Review tracking refreshed.");
  });
}

function refreshReviewTracking_() {
  const sourceSheet = getRegistrationSourceSheet_();
  const columns = getReviewColumnIndexes_(sourceSheet);
  ensureAcceptedSheet_();
  ensureColorGuideSheet_();

  const lastRow = sourceSheet.getLastRow();
  for (let row = 2; row <= lastRow; row++) {
    applyReviewStateToRow_(sourceSheet, row, columns);
  }

  syncAcceptedCandidatesSheet_(sourceSheet, columns);
}

function ensureAcceptedSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(REGISTRATION_CONFIG.acceptedSheetName);
  const sourceSheet = getRegistrationSourceSheet_();
  const sourceLastColumn = Math.max(sourceSheet.getLastColumn(), 1);
  const sourceHeaders = sourceSheet.getRange(1, 1, 1, sourceLastColumn).getValues()[0];

  if (!sheet) {
    sheet = ss.insertSheet(REGISTRATION_CONFIG.acceptedSheetName);
  }

  const shouldWriteHeaders = sheet.getLastRow() < 1 || !isHeaderRowMatch_(sheet, sourceHeaders);
  if (shouldWriteHeaders) {
    sheet.clear();
    sheet.getRange(1, 1, 1, sourceHeaders.length)
      .setValues([sourceHeaders])
      .setFontWeight("bold")
      .setBackground("#e8eefc");
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function syncAcceptedCandidatesSheet_(sourceSheet, columns) {
  const acceptedSheet = ensureAcceptedSheet_();
  const sourceLastColumn = Math.max(sourceSheet.getLastColumn(), 1);
  const lastRow = acceptedSheet.getLastRow();
  if (lastRow > 1) {
    acceptedSheet.getRange(2, 1, lastRow - 1, acceptedSheet.getLastColumn()).clearContent().clearFormat();
  }

  if (sourceSheet.getLastRow() < 2) {
    return acceptedSheet;
  }

  const sourceRows = sourceSheet.getRange(2, 1, sourceSheet.getLastRow() - 1, sourceSheet.getLastColumn()).getValues();
  const acceptedRows = [];

  for (let i = 0; i < sourceRows.length; i++) {
    const row = sourceRows[i];
    const statusInfo = getReviewStatusInfo_(row[columns.statusIndex]);
    if (!statusInfo || statusInfo.key !== "accepted") {
      continue;
    }

    acceptedRows.push(row.slice(0, sourceLastColumn));
  }

  if (acceptedRows.length) {
    acceptedSheet.getRange(2, 1, acceptedRows.length, sourceLastColumn).setValues(acceptedRows);
    acceptedSheet.getRange(2, 1, acceptedRows.length, sourceLastColumn).setBackground(REGISTRATION_CONFIG.acceptedRowColor);
  }

  acceptedSheet.autoResizeColumns(1, sourceLastColumn);
  return acceptedSheet;
}

function getReviewColumnIndexes_(sheet) {
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) {
    return String(h || "").trim();
  });

  const emailIndex = findColumnIndexByCandidates_(headers, REGISTRATION_CONFIG.emailColumnCandidates);
  const statusIndex = findColumnIndexByCandidates_(headers, REGISTRATION_CONFIG.statusColumnCandidates);

  if (emailIndex === -1 || statusIndex === -1) {
    throw new Error(
      "Required review columns not found in sheet: " + sheet.getName() +
      ". Expected Email address and Status."
    );
  }

  return {
    emailIndex: emailIndex,
    statusIndex: statusIndex
  };
}

function applyReviewStateToRow_(sheet, rowNumber, columns) {
  const width = Math.max(sheet.getLastColumn(), 1);
  const row = sheet.getRange(rowNumber, 1, 1, width).getValues()[0];
  const statusInfo = getReviewStatusInfo_(row[columns.statusIndex]);
  const rowRange = sheet.getRange(rowNumber, 1, 1, width);

  if (statusInfo) {
    rowRange.setBackground(statusInfo.color);
    return statusInfo.key;
  }

  if (hasDuplicateMarker_(sheet, rowNumber, columns.emailIndex)) {
    rowRange.setBackground(REGISTRATION_CONFIG.duplicateEmailRowColor);
    return "duplicate";
  }

  rowRange.setBackground(null);
  return "";
}

function getReviewStatusInfo_(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  if (normalized === "accepted") {
    return {
      key: "accepted",
      label: "Accepted",
      color: REGISTRATION_CONFIG.acceptedRowColor
    };
  }

  if (normalized === "rejected") {
    return {
      key: "rejected",
      label: "Rejected",
      color: REGISTRATION_CONFIG.rejectedRowColor
    };
  }

  if (normalized === "mayconsider" || normalized === "maybeconsider") {
    return {
      key: "may_consider",
      label: "May Consider",
      color: REGISTRATION_CONFIG.mayConsiderRowColor
    };
  }

  return null;
}

function getColorGuideRows_() {
  return [
    REGISTRATION_CONFIG.colorGuideHeaders,
    [
      "Orange",
      "Duplicate email already has a sent-email record in Mail sent",
      "Do not send another email. Highlight the new registration row orange.",
      REGISTRATION_CONFIG.duplicateEmailRowColor
    ],
    [
      "Green",
      "Status is Accepted",
      "Highlight the reviewed row and copy it into the Accepted sheet.",
      REGISTRATION_CONFIG.acceptedRowColor
    ],
    [
      "Red",
      "Status is Rejected",
      "Highlight the reviewed row as rejected.",
      REGISTRATION_CONFIG.rejectedRowColor
    ],
    [
      "Yellow",
      "Status is May Consider",
      "Highlight the reviewed row for possible follow-up.",
      REGISTRATION_CONFIG.mayConsiderRowColor
    ]
  ];
}

function hasDuplicateMarker_(sheet, rowNumber, emailIndex) {
  const note = String(sheet.getRange(rowNumber, emailIndex + 1).getNote() || "");
  return note.indexOf(REGISTRATION_CONFIG.duplicateNotePrefix) === 0;
}
