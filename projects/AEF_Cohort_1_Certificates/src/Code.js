/**
 * AEF Cohort 1 certificates.
 *
 * This script is attached to the "AEF Submissions" spreadsheet. It:
 *   1. lists every fellow with at least one accepted project (Review Tracker Status = OK)
 *      in a "Certificates" tab and gives each one a permanent certificate ID;
 *   2. waits for the team to check each name and tick "Approved";
 *   3. makes each approved fellow's PDF, saves it to Google Drive and emails it.
 *
 * PDFs are built in Google Slides: the certificate design is a background image and
 * the name and ID are placed on top using CertificateLayout.js.
 */

var AEF_CERT_CONFIG = {
  trackerSheetName: "Review Tracker",
  certificateSheetName: "Certificates",
  acceptedStatus: "OK",
  idPrefix: "AEF-2026-C1-",
  idDigits: 4,
  // Random code after the number (AEF-2026-C1-0001-K7QX) so IDs cannot be guessed.
  // No look-alike characters (0/O, 1/I/L).
  idCodeAlphabet: "ABCDEFGHJKMNPQRSTUVWXYZ23456789",
  idCodeLength: 4,
  // Public details shown by the verification website; they match the printed certificate.
  programme: "Analytics Engineering Fellowship",
  cohortLabel: "2026 · Cohort 1",
  award: "Certificate of Participation",
  issuedLabel: "September 2026",
  siteUrl: "https://btd-certificates.vercel.app",
  folderName: "AEF Cohort 1 Certificates",
  backgroundFileName: "aef-cohort-1-certificate-background.png",
  senderName: "Behind the Data Academy",
  // Apps Script stops a run after 6 minutes; stop early and ask the user to run again.
  timeBudgetMs: 4.5 * 60 * 1000,
  headers: [
    "Certificate ID", "Name on certificate", "Email", "Name as submitted",
    "Projects submitted", "Approved", "Certificate Status", "PDF Link",
    "Sent At", "Error"
  ]
};

var AEF_CERT_FIELDS = [
  "certificateId", "nameOnCertificate", "email", "submittedName",
  "projectCount", "approved", "status", "pdfLink", "sentAt", "error"
];

var AEF_CERT_STATUS = { pdfReady: "PDF ready", sent: "Sent", error: "Error" };

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("AEF Cohort 1 Certificates")
    .addItem("Open Automation Buttons", "openAefCertificateButtons")
    .addSeparator()
    .addItem("1. Setup Certificates", "setupAefCertificates")
    .addItem("2. Build / Refresh Certificate List", "refreshAefCertificateList")
    .addSeparator()
    .addItem("Set Test Email Recipient", "setAefCertificateTestEmailRecipient")
    .addItem("Preview Certificate Email", "previewAefCertificateEmail")
    .addItem("Send Test Certificate (selected row)", "sendAefCertificateTestEmail")
    .addSeparator()
    .addItem("Count Approved Certificates Waiting", "countPendingAefCertificates")
    .addItem("LIVE: Send Approved Certificates", "sendApprovedAefCertificates")
    .addSeparator()
    .addItem("Create Website Lookup Key", "createAefCertificateLookupKey")
    .addToUi();
}

function openAefCertificateButtons() {
  var html = HtmlService.createHtmlOutputFromFile("AutomationButtons")
    .setTitle("AEF Cohort 1 Certificates");
  SpreadsheetApp.getUi().showSidebar(html);
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

function setupAefCertificates() {
  return withAefCertLock_(function () {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss.getSheetByName(AEF_CERT_CONFIG.trackerSheetName)) {
      throw new Error('This spreadsheet has no "' + AEF_CERT_CONFIG.trackerSheetName +
        '" tab. Attach this script to the AEF Submissions spreadsheet.');
    }

    getOrCreateCertificateSheet_(ss);
    rememberSpreadsheetId_(ss);
    var folder = getOrCreateCertificateFolder_();
    var background = findBackgroundFile_(folder);

    var message = "Certificates tab is ready.\n\nDrive folder: " + folder.getUrl() + "\n\n";
    message += background
      ? "Background image found. You can build the certificate list next."
      : 'Next: upload "' + AEF_CERT_CONFIG.backgroundFileName + '" into that folder, then build the certificate list.';
    return notifyAefCert_(message);
  });
}

function getOrCreateCertificateSheet_(ss) {
  var sheet = ss.getSheetByName(AEF_CERT_CONFIG.certificateSheetName);
  if (sheet) return sheet;

  var headers = AEF_CERT_CONFIG.headers;
  sheet = ss.insertSheet(AEF_CERT_CONFIG.certificateSheetName);
  sheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight("bold")
    .setBackground("#0f2747")
    .setFontColor("#ffffff");
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(2, 260);
  sheet.setColumnWidth(3, 240);
  sheet.setColumnWidth(4, 220);
  sheet.setColumnWidth(10, 320);
  return sheet;
}

function getOrCreateCertificateFolder_() {
  var props = PropertiesService.getScriptProperties();
  var folderId = props.getProperty("AEF_CERT_FOLDER_ID");
  if (folderId) {
    try {
      return DriveApp.getFolderById(folderId);
    } catch (err) {
      // The folder was deleted or access was lost; make a new one below.
    }
  }

  var folder = DriveApp.createFolder(AEF_CERT_CONFIG.folderName);
  props.setProperty("AEF_CERT_FOLDER_ID", folder.getId());
  return folder;
}

function findBackgroundFile_(folder) {
  var files = folder.getFilesByName(AEF_CERT_CONFIG.backgroundFileName);
  return files.hasNext() ? files.next() : null;
}

function getBackgroundBlob_() {
  var file = findBackgroundFile_(getOrCreateCertificateFolder_());
  if (!file) {
    throw new Error('Upload "' + AEF_CERT_CONFIG.backgroundFileName +
      '" into the "' + AEF_CERT_CONFIG.folderName + '" Drive folder first.');
  }
  return file.getBlob();
}

// ---------------------------------------------------------------------------
// Certificate list
// ---------------------------------------------------------------------------

function refreshAefCertificateList() {
  return withAefCertLock_(function () {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var tracker = ss.getSheetByName(AEF_CERT_CONFIG.trackerSheetName);
    if (!tracker) throw new Error('The "' + AEF_CERT_CONFIG.trackerSheetName + '" tab was not found.');

    var sheet = getOrCreateCertificateSheet_(ss);
    rememberSpreadsheetId_(ss);
    var existing = readCertificateRows_(sheet);
    var merged = mergeCertificateRows_(existing, readTrackerRows_(tracker));
    writeCertificateRows_(sheet, merged.rows);

    return notifyAefCert_(
      merged.added + " new fellow(s) added. " + merged.rows.length + " fellow(s) on the list.\n\n" +
      'Check each "Name on certificate", then tick "Approved" for the ones ready to send.'
    );
  });
}

/** Reads Review Tracker rows by header name, so column moves do not break it. */
function readTrackerRows_(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  var headers = values[0].map(function (h) { return String(h).trim(); });
  var col = function (name) {
    var index = headers.indexOf(name);
    if (index === -1) throw new Error('Review Tracker is missing the "' + name + '" column.');
    return index;
  };
  var at = col("Submitted at");
  var name = col("Name");
  var email = col("Email");
  var engagement = col("Engagement submitted");
  var status = col("Status");

  return values.slice(1).map(function (row) {
    return {
      submittedAt: row[at],
      name: row[name],
      email: row[email],
      engagement: row[engagement],
      status: trackerRowStatus_(row, status)
    };
  });
}

/**
 * The live Review Tracker's headings are one column behind its newer rows: those rows
 * hold the "present at final session" answer under "Status" and the real status under
 * "Issues". Use whichever of the two cells holds a real status.
 */
function trackerRowStatus_(row, statusIndex) {
  var candidates = [row[statusIndex], row[statusIndex + 1]];
  for (var i = 0; i < candidates.length; i++) {
    var value = String(candidates[i] == null ? "" : candidates[i]).trim().toUpperCase();
    if (value === AEF_CERT_CONFIG.acceptedStatus || value === "NEEDS FIX") return value;
  }
  return "";
}

/**
 * Adds fellows with at least one accepted submission to the certificate list.
 *
 * Existing rows keep their ID, corrected name, approval and send status; only
 * "Name as submitted" and "Projects submitted" are refreshed. New fellows are
 * numbered in the order they first submitted.
 */
function mergeCertificateRows_(existingRows, trackerRows) {
  var fellows = {};
  var order = [];

  trackerRows.forEach(function (row) {
    var email = normaliseEmail_(row.email);
    var accepted = String(row.status || "").trim().toUpperCase() === AEF_CERT_CONFIG.acceptedStatus;
    if (!email || !accepted) return;

    var time = toTime_(row.submittedAt);
    var fellow = fellows[email];
    if (!fellow) {
      fellow = fellows[email] = { email: email, firstAt: time, latestAt: -Infinity, name: "", engagements: {} };
      order.push(email);
    }
    fellow.firstAt = Math.min(fellow.firstAt, time);
    if (String(row.name || "").trim() && time >= fellow.latestAt) {
      fellow.latestAt = time;
      fellow.name = String(row.name).replace(/\s+/g, " ").trim();
    }
    String(row.engagement || "").split("\n").forEach(function (item) {
      var key = item.trim();
      if (key) fellow.engagements[key] = true;
    });
  });

  var rows = existingRows.map(function (row) {
    var copy = Object.assign({}, row);
    // Older IDs without a random code get one, unless that certificate was already sent.
    if (copy.status !== AEF_CERT_STATUS.sent && certificateNumber_(copy.certificateId) &&
        !hasCertificateCode_(copy.certificateId)) {
      copy.certificateId = formatCertificateId_(certificateNumber_(copy.certificateId), randomCertificateCode_());
    }
    return copy;
  });
  var byEmail = {};
  rows.forEach(function (row) { byEmail[normaliseEmail_(row.email)] = row; });

  var nextNumber = rows.reduce(function (max, row) {
    return Math.max(max, certificateNumber_(row.certificateId));
  }, 0) + 1;

  var newFellows = [];
  order.forEach(function (email) {
    var fellow = fellows[email];
    var projectCount = Object.keys(fellow.engagements).length;
    var row = byEmail[email];
    if (row) {
      row.submittedName = fellow.name;
      row.projectCount = projectCount;
    } else {
      newFellows.push(fellow);
    }
  });

  newFellows.sort(function (a, b) { return a.firstAt - b.firstAt; });
  newFellows.forEach(function (fellow) {
    rows.push({
      certificateId: formatCertificateId_(nextNumber++, randomCertificateCode_()),
      nameOnCertificate: tidyName_(fellow.name),
      email: fellow.email,
      submittedName: fellow.name,
      projectCount: Object.keys(fellow.engagements).length,
      approved: false,
      status: "",
      pdfLink: "",
      sentAt: "",
      error: ""
    });
  });

  return { rows: rows, added: newFellows.length };
}

function formatCertificateId_(number, code) {
  var digits = String(number);
  while (digits.length < AEF_CERT_CONFIG.idDigits) digits = "0" + digits;
  return AEF_CERT_CONFIG.idPrefix + digits + "-" + code;
}

function randomCertificateCode_() {
  var alphabet = AEF_CERT_CONFIG.idCodeAlphabet;
  var hex = Utilities.getUuid().replace(/-/g, "");
  var code = "";
  for (var i = 0; i < AEF_CERT_CONFIG.idCodeLength; i++) {
    code += alphabet.charAt(parseInt(hex.substr(i * 2, 2), 16) % alphabet.length);
  }
  return code;
}

function hasCertificateCode_(certificateId) {
  var pattern = new RegExp(
    "^" + AEF_CERT_CONFIG.idPrefix.replace(/[-]/g, "\\-") +
    "\\d{" + AEF_CERT_CONFIG.idDigits + "}-[" + AEF_CERT_CONFIG.idCodeAlphabet + "]{" +
    AEF_CERT_CONFIG.idCodeLength + "}$"
  );
  return pattern.test(String(certificateId || ""));
}

function certificateNumber_(certificateId) {
  var id = String(certificateId || "");
  if (id.indexOf(AEF_CERT_CONFIG.idPrefix) !== 0) return 0;
  var number = parseInt(id.slice(AEF_CERT_CONFIG.idPrefix.length), 10);
  return isNaN(number) ? 0 : number;
}

/** Fixes spacing, and capitalises names typed in all lower or all upper case. */
function tidyName_(raw) {
  var name = String(raw || "").replace(/\s+/g, " ").trim();
  if (name && (name === name.toLowerCase() || name === name.toUpperCase())) {
    name = name.toLowerCase().replace(/(^|[\s\-'’])([a-z])/g, function (match, before, letter) {
      return before + letter.toUpperCase();
    });
  }
  return name;
}

function normaliseEmail_(email) {
  return String(email || "").trim().toLowerCase();
}

function toTime_(value) {
  var time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return isNaN(time) ? Infinity : time;
}

function readCertificateRows_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, AEF_CERT_FIELDS.length).getValues()
    .map(rowToCertificate_)
    .filter(function (row) { return row.certificateId || row.email; });
}

function rowToCertificate_(values) {
  var row = {};
  AEF_CERT_FIELDS.forEach(function (field, index) { row[field] = values[index]; });
  return row;
}

function certificateToRow_(row) {
  return AEF_CERT_FIELDS.map(function (field) {
    return row[field] === undefined || row[field] === null ? "" : row[field];
  });
}

function writeCertificateRows_(sheet, rows) {
  if (!rows.length) return;
  sheet.getRange(2, 1, rows.length, AEF_CERT_FIELDS.length).setValues(rows.map(certificateToRow_));
  var approvedColumn = AEF_CERT_FIELDS.indexOf("approved") + 1;
  sheet.getRange(2, approvedColumn, rows.length, 1).insertCheckboxes();
}

function writeCertificateRow_(sheet, index, row) {
  sheet.getRange(index + 2, 1, 1, AEF_CERT_FIELDS.length).setValues([certificateToRow_(row)]);
  SpreadsheetApp.flush();
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

function isApproved_(value) {
  return value === true || /^(true|yes|y)$/i.test(String(value || "").trim());
}

function isPendingCertificate_(row) {
  return isApproved_(row.approved) && row.status !== AEF_CERT_STATUS.sent;
}

function countPendingAefCertificates() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AEF_CERT_CONFIG.certificateSheetName);
  var pending = sheet ? readCertificateRows_(sheet).filter(isPendingCertificate_).length : 0;
  return notifyAefCert_(pending + " approved certificate(s) are waiting to be sent.");
}

function sendApprovedAefCertificates() {
  return withAefCertLock_(function () {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(AEF_CERT_CONFIG.certificateSheetName);
    if (!sheet) throw new Error("Run Setup and build the certificate list first.");

    var started = Date.now();
    var background = null;
    var folder = getOrCreateCertificateFolder_();

    var result = processPendingCertificates_(readCertificateRows_(sheet), {
      hasTime: function () { return Date.now() - started < AEF_CERT_CONFIG.timeBudgetMs; },
      now: function () { return new Date(); },
      getOrCreatePdf: function (row) {
        var existing = getPdfFromLink_(row.pdfLink);
        if (existing) {
          shareCertificateFile_(existing);
          return { blob: existing.getBlob(), url: existing.getUrl() };
        }
        background = background || getBackgroundBlob_();
        var file = folder.createFile(createCertificatePdf_(row.nameOnCertificate, row.certificateId, background));
        shareCertificateFile_(file);
        return { blob: file.getBlob(), url: file.getUrl() };
      },
      sendEmail: sendCertificateEmail_,
      saveRow: function (index, row) { writeCertificateRow_(sheet, index, row); }
    });

    var message = result.sent + " certificate(s) sent.";
    if (result.failed) message += "\n" + result.failed + " could not be sent - see the Error column.";
    if (result.remaining) message += "\n" + result.remaining + " still waiting. Run this again to continue.";
    return notifyAefCert_(message);
  });
}

/**
 * Sends every approved, unsent certificate. The PDF link is saved before the
 * email goes out, so a retry reuses the same PDF instead of making a duplicate.
 */
function processPendingCertificates_(rows, deps) {
  var result = { sent: 0, failed: 0, remaining: 0 };

  rows.forEach(function (row, index) {
    if (!isPendingCertificate_(row)) return;
    if (!deps.hasTime()) {
      result.remaining++;
      return;
    }

    try {
      var problem = certificateRowProblem_(row);
      if (problem) throw new Error(problem);

      var pdf = deps.getOrCreatePdf(row);
      if (row.pdfLink !== pdf.url) {
        row.pdfLink = pdf.url;
        row.status = AEF_CERT_STATUS.pdfReady;
        deps.saveRow(index, row);
      }

      deps.sendEmail(row, pdf.blob);
      row.status = AEF_CERT_STATUS.sent;
      row.sentAt = deps.now();
      row.error = "";
      result.sent++;
    } catch (err) {
      row.status = AEF_CERT_STATUS.error;
      row.error = err && err.message ? err.message : String(err);
      result.failed++;
    }
    deps.saveRow(index, row);
  });

  return result;
}

function certificateRowProblem_(row) {
  var name = String(row.nameOnCertificate || "").trim();
  if (!name) return "Name on certificate is empty.";
  if (!nameFitsOnOneLine_(name)) return "Name is too long to fit on one line. Shorten it in Name on certificate.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(row.email || "").trim())) return "Email address looks invalid.";
  if (!row.certificateId) return "Certificate ID is missing.";
  return "";
}

function getPdfFromLink_(link) {
  var match = String(link || "").match(/[-\w]{25,}/);
  if (!match) return null;
  try {
    var file = DriveApp.getFileById(match[0]);
    return file.isTrashed() ? null : file;
  } catch (err) {
    return null;
  }
}

function sendCertificateEmail_(row, pdfBlob, recipientOverride) {
  MailApp.sendEmail({
    to: recipientOverride || String(row.email).trim(),
    subject: AEF_CERT_EMAIL_SUBJECT,
    body: getAefCertificateEmailPlainText(row.nameOnCertificate, row.certificateId),
    htmlBody: getAefCertificateEmailHtml(row.nameOnCertificate, row.certificateId),
    name: AEF_CERT_CONFIG.senderName,
    attachments: [pdfBlob]
  });
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

/** Builds one certificate in a temporary Google Slides file and returns it as a PDF. */
function createCertificatePdf_(name, certificateId, backgroundBlob) {
  var page = CERT_LAYOUT.page;
  var created = Slides.Presentations.create({
    title: "Certificate " + certificateId,
    pageSize: {
      width: { magnitude: page.width, unit: "PT" },
      height: { magnitude: page.height, unit: "PT" }
    }
  });
  var presentationId = created.presentationId;

  try {
    var presentation = SlidesApp.openById(presentationId);
    var slide = presentation.getSlides()[0];
    slide.getPageElements().forEach(function (element) { element.remove(); });

    slide.insertImage(backgroundBlob, 0, 0, page.width, page.height);
    addCertificateText_(slide, name, CERT_LAYOUT.name, nameFontSize_(name), SlidesApp.ParagraphAlignment.CENTER);
    addCertificateText_(slide, certificateId, CERT_LAYOUT.certificateId,
      CERT_LAYOUT.certificateId.fontSize, SlidesApp.ParagraphAlignment.START);
    presentation.saveAndClose();

    return DriveApp.getFileById(presentationId)
      .getAs(MimeType.PDF)
      .setName(certificateId + " - " + name + ".pdf");
  } finally {
    DriveApp.getFileById(presentationId).setTrashed(true);
  }
}

function addCertificateText_(slide, text, spec, fontSize, alignment) {
  var box = slide.insertTextBox(text, spec.left, spec.top, spec.width, spec.height);
  box.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);
  var range = box.getText();
  range.getTextStyle()
    .setFontFamilyAndWeight(spec.fontFamily, spec.fontWeight)
    .setItalic(spec.italic)
    .setFontSize(fontSize)
    .setForegroundColor(spec.color);
  range.getParagraphStyle().setParagraphAlignment(alignment);
  return box;
}

// ---------------------------------------------------------------------------
// Testing
// ---------------------------------------------------------------------------

function setAefCertificateTestEmailRecipient() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt("Test email recipient", "Test certificates will be sent to this address:", ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() !== ui.Button.OK) return;
  return saveAefCertificateTestEmail(response.getResponseText());
}

function saveAefCertificateTestEmail(email) {
  var value = String(email || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) throw new Error("Enter a valid email address.");
  PropertiesService.getScriptProperties().setProperty("AEF_CERT_TEST_EMAIL", value);
  return notifyAefCert_("Test certificates will be sent to " + value + ".");
}

function getAefCertificateTestEmail_() {
  return PropertiesService.getScriptProperties().getProperty("AEF_CERT_TEST_EMAIL") ||
    Session.getActiveUser().getEmail();
}

/** Uses the selected row on the Certificates tab, or a sample name. Never changes the sheet. */
function sendAefCertificateTestEmail() {
  var recipient = getAefCertificateTestEmail_();
  if (!recipient) throw new Error("Set a test email recipient first.");

  var row = getSelectedCertificateRow_() || {
    certificateId: formatCertificateId_(1, "K7QX"),
    nameOnCertificate: "Ada Lovelace",
    email: recipient
  };
  var problem = certificateRowProblem_(row);
  if (problem) throw new Error(problem);

  var pdf = createCertificatePdf_(row.nameOnCertificate, row.certificateId, getBackgroundBlob_());
  sendCertificateEmail_(row, pdf, recipient);
  return notifyAefCert_("Test certificate for " + row.nameOnCertificate + " sent to " + recipient + ".");
}

function getSelectedCertificateRow_() {
  var sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== AEF_CERT_CONFIG.certificateSheetName) return null;
  var rowNumber = sheet.getActiveRange().getRow();
  if (rowNumber < 2) return null;
  var row = rowToCertificate_(sheet.getRange(rowNumber, 1, 1, AEF_CERT_FIELDS.length).getValues()[0]);
  return row.nameOnCertificate ? row : null;
}

function previewAefCertificateEmail() {
  var html = HtmlService.createHtmlOutput(getAefCertificateEmailHtml("Ada Lovelace", formatCertificateId_(1, "K7QX")))
    .setWidth(720)
    .setHeight(640);
  SpreadsheetApp.getUi().showModalDialog(html, "Certificate email preview");
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function withAefCertLock_(work) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) throw new Error("Another certificate task is running. Try again in a minute.");
  try {
    return work();
  } finally {
    lock.releaseLock();
  }
}

/** Shows a message in the sheet when run from a menu; always returns it for the sidebar. */
function notifyAefCert_(message) {
  try {
    SpreadsheetApp.getActiveSpreadsheet().toast(message, "AEF Certificates", 10);
  } catch (err) {
    // No spreadsheet UI (for example, when run from the script editor).
  }
  Logger.log(message);
  return message;
}
