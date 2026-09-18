/**
 * Certificate lookup for the verification website.
 *
 * Deployed as an Apps Script web app. The website (server side only) calls
 *   <web app url>?id=AEF-2026-C1-0001-K7QX&key=<secret>
 * and gets back the PUBLIC details of that one certificate, or "not found".
 * Emails, approval state, errors and send times never leave the sheet.
 *
 * Only certificates whose status is "Sent" (and that have a PDF) verify.
 */

var AEF_CERT_LOOKUP_KEY_PROPERTY = "AEF_CERT_LOOKUP_KEY";
var AEF_CERT_SPREADSHEET_ID_PROPERTY = "AEF_CERT_SPREADSHEET_ID";
var AEF_CERT_MAX_ID_LENGTH = 40;

function doGet(e) {
  var params = (e && e.parameter) || {};
  var reply;
  try {
    var expectedKey = PropertiesService.getScriptProperties().getProperty(AEF_CERT_LOOKUP_KEY_PROPERTY);
    if (!keysMatch_(params.key, expectedKey)) {
      reply = { ok: false, error: "unauthorized" };
    } else {
      reply = buildLookupReply_(readCertificateRows_(getCertificateSheetForLookup_()), params.id);
    }
  } catch (err) {
    Logger.log("Certificate lookup failed: " + (err && err.stack ? err.stack : err));
    reply = { ok: false, error: "unavailable" };
  }
  return ContentService.createTextOutput(JSON.stringify(reply))
    .setMimeType(ContentService.MimeType.JSON);
}

/** The only place that decides what the public can see about a certificate. */
function buildLookupReply_(rows, rawId) {
  var id = normaliseCertificateId_(rawId);
  if (!id) return { ok: true, found: false };

  var match = null;
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (normaliseCertificateId_(row.certificateId) === id &&
        row.status === AEF_CERT_STATUS.sent &&
        String(row.pdfLink || "").trim()) {
      match = row;
      break;
    }
  }
  if (!match) return { ok: true, found: false };

  return {
    ok: true,
    found: true,
    certificate: {
      id: String(match.certificateId).trim(),
      name: String(match.nameOnCertificate || "").replace(/\s+/g, " ").trim(),
      programme: AEF_CERT_CONFIG.programme,
      cohort: AEF_CERT_CONFIG.cohortLabel,
      award: AEF_CERT_CONFIG.award,
      issued: AEF_CERT_CONFIG.issuedLabel,
      pdfUrl: pdfDownloadUrl_(match.pdfLink)
    }
  };
}

/** Upper case, no spaces; anything too long is treated as no ID at all. */
function normaliseCertificateId_(value) {
  var id = String(value == null ? "" : value).replace(/\s+/g, "").toUpperCase();
  return id.length > AEF_CERT_MAX_ID_LENGTH ? "" : id;
}

function pdfDownloadUrl_(link) {
  var match = String(link || "").match(/[-\w]{25,}/);
  return match ? "https://drive.google.com/uc?export=download&id=" + match[0] : "";
}

/** Compares every character so the time taken does not hint at how close a guess was. */
function keysMatch_(given, expected) {
  if (!expected || typeof given !== "string" || given.length !== expected.length) return false;
  var difference = 0;
  for (var i = 0; i < expected.length; i++) {
    difference |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return difference === 0;
}

function getCertificateSheetForLookup_() {
  var ssId = PropertiesService.getScriptProperties().getProperty(AEF_CERT_SPREADSHEET_ID_PROPERTY);
  var ss = ssId ? SpreadsheetApp.openById(ssId) : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss && ss.getSheetByName(AEF_CERT_CONFIG.certificateSheetName);
  if (!sheet) throw new Error("Certificates tab not found. Run Setup from the spreadsheet.");
  return sheet;
}

/** The web app runs outside the open spreadsheet, so it needs the spreadsheet's ID. */
function rememberSpreadsheetId_(ss) {
  PropertiesService.getScriptProperties().setProperty(AEF_CERT_SPREADSHEET_ID_PROPERTY, ss.getId());
}

/** The website's Download button needs the PDF to open for anyone who has the link. */
function shareCertificateFile_(file) {
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
}

/**
 * Makes the secret the website uses to ask for certificates. Shown once; paste it
 * into Vercel. Making a new one stops the old one working immediately.
 */
function createAefCertificateLookupKey() {
  return withAefCertLock_(function () {
    rememberSpreadsheetId_(SpreadsheetApp.getActiveSpreadsheet());
    var key = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, "");
    PropertiesService.getScriptProperties().setProperty(AEF_CERT_LOOKUP_KEY_PROPERTY, key);
    return "New website lookup key (copy it now - it is only shown once):\n\n" + key +
      "\n\nPaste it into Vercel. The old key, if any, no longer works.";
  });
}
