const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

let uuidCounter = 0;
const fakeUtilities = {
  getUuid: () => {
    uuidCounter++;
    return (uuidCounter.toString(16).padStart(8, "0") + "-1234-4abc-8def-0123456789ab");
  }
};

function loadProject(globals = {}) {
  const context = vm.createContext({ console, Utilities: fakeUtilities, ...globals });
  ["CertificateLayout.js", "CertificateEmailTemplate.js", "Code.js", "Lookup.js"].forEach((fileName) => {
    const filePath = path.join(projectRoot, "src", fileName);
    vm.runInContext(fs.readFileSync(filePath, "utf8"), context, { filename: fileName });
  });
  return context;
}

function trackerRow(overrides) {
  return {
    submittedAt: new Date("2026-08-01T10:00:00Z"),
    name: "Ada Lovelace",
    email: "ada@example.com",
    engagement: "01 — E-Commerce Revenue Leakage (Retail / Finance)",
    status: "OK",
    ...overrides
  };
}

function certRow(overrides) {
  return {
    certificateId: "AEF-2026-C1-0001",
    nameOnCertificate: "Ada Lovelace",
    email: "ada@example.com",
    submittedName: "Ada Lovelace",
    projectCount: 1,
    approved: true,
    status: "",
    pdfLink: "",
    sentAt: "",
    error: "",
    ...overrides
  };
}

function fakeDeps(overrides = {}) {
  const calls = { pdfs: [], emails: [], saves: [] };
  const deps = {
    hasTime: () => true,
    now: () => "NOW",
    getOrCreatePdf: (row) => {
      calls.pdfs.push(row.certificateId);
      return { blob: "BLOB-" + row.certificateId, url: "https://drive.google.com/file/d/" + row.certificateId + "xxxxxxxxxxxxxxxxxx/view" };
    },
    sendEmail: (row, blob) => calls.emails.push([row.email, blob]),
    saveRow: (index, row) => calls.saves.push([index, row.status]),
    ...overrides
  };
  return { deps, calls };
}

test("only fellows with at least one accepted submission are listed", () => {
  const app = loadProject();
  const result = app.mergeCertificateRows_([], [
    trackerRow({ email: "ok@example.com", name: "Ok Fellow" }),
    trackerRow({ email: "fix@example.com", name: "Fix Fellow", status: "NEEDS FIX" }),
    trackerRow({ email: "", name: "No Email" })
  ]);

  assert.equal(result.added, 1);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].email, "ok@example.com");
});

test("the roster adds participants while preserving existing completion approvals and IDs", () => {
  const app = loadProject();
  const existing = certRow({ certificateId: "AEF-2026-C1-0001-K7QX", email: "ada@example.com", projectCount: 2,
    nameOnCertificate: "Ada Corrected", approved: true, status: "PDF ready", pdfLink: "https://drive.google.com/old" });
  const roster = [
    { email: "ADA@example.com", name: "Ada Roster" },
    { email: "new@example.com", name: "new learner" },
    { email: "NEW@example.com", name: "Duplicate Learner" }
  ];
  const first = app.mergeCertificateRows_([existing], [trackerRow({ email: "ada@example.com" })], roster);
  assert.equal(first.rows.length, 2);
  assert.equal(first.rows[0].certificateId, existing.certificateId);
  assert.equal(first.rows[0].nameOnCertificate, "Ada Corrected");
  assert.equal(first.rows[0].approved, true);
  assert.equal(first.rows[0].pdfLink, existing.pdfLink);
  assert.equal(first.rows[1].email, "new@example.com");
  assert.equal(first.rows[1].projectCount, 0);
  assert.equal(first.rows[1].approved, false);
  assert.match(first.rows[1].certificateId, /^AEF-2026-C1-0002-[A-HJKMNP-Z2-9]{4}$/);
  const second = app.mergeCertificateRows_(first.rows, [trackerRow({ email: "ada@example.com" })], roster);
  assert.equal(second.rows.length, 2);
  assert.equal(second.rows[1].certificateId, first.rows[1].certificateId);
});

test("an accepted project from outside the certificate roster is not added", () => {
  const app = loadProject();
  const result = app.mergeCertificateRows_([], [trackerRow({ email: "outside@example.com" })], [
    { email: "inside@example.com", name: "Inside Learner" }
  ]);
  assert.deepEqual(result.rows.map((row) => row.email), ["inside@example.com"]);
});

test("roster reading only uses the email and name columns", () => {
  const app = loadProject({ SpreadsheetApp: { openById: (id) => {
    assert.equal(id, app.AEF_CERT_CONFIG.rosterSpreadsheetId);
    return { getSheetByName: (name) => {
      assert.equal(name, app.AEF_CERT_CONFIG.rosterSheetName);
      return { getLastRow: () => 3, getRange: (row, column, count, width) => {
        assert.deepEqual([row, column, count, width], [1, 1, 3, 2]);
        return { getValues: () => [["Email", "Name"], ["Ada@Example.com", "Ada"], ["", ""]] };
      } };
    } };
  } } });
  assert.deepEqual(Array.from(app.readRosterRows_(), (row) => row.email), ["ada@example.com"]);
});

test("the award follows accepted project count and manual participants get stable IDs", () => {
  const app = loadProject();
  const participant = certRow({ certificateId: "", email: "learner@example.com", nameOnCertificate: "Learner One", projectCount: 0 });
  const first = app.mergeCertificateRows_([participant], []);
  assert.match(first.rows[0].certificateId, /^AEF-2026-C1-0001-[A-HJKMNP-Z2-9]{4}$/);
  assert.equal(app.certificateAward_(first.rows[0]), "Certificate of Participation");
  assert.equal(app.certificateAward_(certRow({ projectCount: 1 })), "Certificate of Completion");
  assert.equal(app.certificateAward_(certRow({ projectCount: 4 })), "Certificate of Completion");
  assert.equal(app.certificateAward_(certRow({ status: "Sent", award: "Certificate of Completion", projectCount: 0 })), "Certificate of Completion");
  const second = app.mergeCertificateRows_(first.rows, []);
  assert.equal(second.rows[0].certificateId, first.rows[0].certificateId);
});

test("certificate file name changes with the award so an old PDF cannot be sent", () => {
  const app = loadProject();
  assert.match(app.certificatePdfName_(certRow({ projectCount: 0 })), /Participation - v2\.pdf$/);
  assert.match(app.certificatePdfName_(certRow({ projectCount: 2 })), /Completion - v2\.pdf$/);
});

test("each award uses its own current design image", () => {
  const app = loadProject();
  assert.equal(app.backgroundFileNameForRow_(certRow({ projectCount: 1 })), "aef-cohort-1-completion-background.png");
  assert.equal(app.backgroundFileNameForRow_(certRow({ projectCount: 0 })), "aef-cohort-1-participation-background.png");
});

test("repeat submissions become one fellow with a count of distinct projects", () => {
  const app = loadProject();
  const result = app.mergeCertificateRows_([], [
    trackerRow({ email: "Ada@Example.com", engagement: "01 — A" }),
    trackerRow({ email: "ada@example.com ", engagement: "02 — B", submittedAt: new Date("2026-08-02") }),
    trackerRow({ email: "ada@example.com", engagement: "02 — B", submittedAt: new Date("2026-08-03") }),
    trackerRow({ email: "ada@example.com", engagement: "03 — C", status: "NEEDS FIX" })
  ]);

  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].projectCount, 2);
});

test("IDs follow first-submission order and never change on refresh", () => {
  const app = loadProject();
  const first = app.mergeCertificateRows_([], [
    trackerRow({ email: "late@example.com", name: "Late", submittedAt: new Date("2026-08-05") }),
    trackerRow({ email: "early@example.com", name: "Early", submittedAt: new Date("2026-08-01") })
  ]);
  assert.deepEqual(first.rows.map((r) => r.email), ["early@example.com", "late@example.com"]);
  assert.match(first.rows[0].certificateId, /^AEF-2026-C1-0001-[A-HJKMNP-Z2-9]{4}$/);
  assert.match(first.rows[1].certificateId, /^AEF-2026-C1-0002-[A-HJKMNP-Z2-9]{4}$/);

  const edited = first.rows.map((r) => ({ ...r }));
  edited[0].nameOnCertificate = "Early Corrected";
  edited[0].approved = true;
  edited[0].status = "Sent";

  const second = app.mergeCertificateRows_(edited, [
    trackerRow({ email: "early@example.com", name: "Early", submittedAt: new Date("2026-08-01") }),
    trackerRow({ email: "early@example.com", name: "Early", engagement: "02 — B", submittedAt: new Date("2026-08-06") }),
    trackerRow({ email: "late@example.com", name: "Late", submittedAt: new Date("2026-08-05") }),
    trackerRow({ email: "new@example.com", name: "New", submittedAt: new Date("2026-07-01") })
  ]);

  assert.equal(second.added, 1);
  assert.equal(second.rows[0].certificateId, first.rows[0].certificateId);
  assert.equal(second.rows[1].certificateId, first.rows[1].certificateId);
  assert.equal(second.rows[0].nameOnCertificate, "Early Corrected");
  assert.equal(second.rows[0].approved, true);
  assert.equal(second.rows[0].status, "Sent");
  assert.equal(second.rows[0].projectCount, 2);
  assert.equal(second.rows[2].email, "new@example.com");
  assert.match(second.rows[2].certificateId, /^AEF-2026-C1-0003-[A-HJKMNP-Z2-9]{4}$/);
  assert.equal(second.rows[2].approved, false);
});

test("names typed in one case are tidied; mixed case is left alone", () => {
  const app = loadProject();
  assert.equal(app.tidyName_("  ada   lovelace "), "Ada Lovelace");
  assert.equal(app.tidyName_("CHUKWUEMEKA ADEBAYO-OKONKWO"), "Chukwuemeka Adebayo-Okonkwo");
  assert.equal(app.tidyName_("mary o'neil"), "Mary O'Neil");
  assert.equal(app.tidyName_("Ronald McDonald"), "Ronald McDonald");
});

test("long names shrink but stay within the allowed range", () => {
  const app = loadProject();
  const layout = app.CERT_LAYOUT.name;
  assert.equal(app.nameFontSize_("Ada Lovelace"), layout.maxFontSize);
  const long = app.nameFontSize_("Oluwatobiloba Ifeoluwa Babatunde-Ogunleye Adewale");
  assert.ok(long < layout.maxFontSize && long >= layout.minFontSize);
  assert.equal(app.nameFitsOnOneLine_("Oluwatobiloba Ifeoluwa Babatunde-Ogunleye Adewale"), true);
  assert.equal(app.nameFitsOnOneLine_("M".repeat(65)), false);
});

test("only approved, unsent certificates are sent", () => {
  const app = loadProject();
  const rows = [
    certRow({ certificateId: "AEF-2026-C1-0001", approved: true }),
    certRow({ certificateId: "AEF-2026-C1-0002", approved: false }),
    certRow({ certificateId: "AEF-2026-C1-0003", approved: true, status: "Sent" }),
    certRow({ certificateId: "AEF-2026-C1-0004", approved: "TRUE", status: "Error" })
  ];
  const { deps, calls } = fakeDeps();
  const result = app.processPendingCertificates_(rows, deps);

  assert.deepEqual(calls.pdfs, ["AEF-2026-C1-0001", "AEF-2026-C1-0004"]);
  assert.equal(calls.emails.length, 2);
  assert.equal(result.sent, 2);
  assert.equal(rows[0].status, "Sent");
  assert.equal(rows[0].sentAt, "NOW");
  assert.equal(rows[1].status, "");
  assert.equal(rows[3].status, "Sent");
  assert.equal(rows[3].error, "");
});

test("the PDF link is saved before emailing so a retry reuses it", () => {
  const app = loadProject();
  const rows = [certRow()];
  const { deps, calls } = fakeDeps({
    sendEmail: () => { throw new Error("Mail quota reached"); }
  });
  const result = app.processPendingCertificates_(rows, deps);

  assert.equal(result.failed, 1);
  assert.deepEqual(calls.saves.map((s) => s[1]), ["PDF ready", "Error"]);
  assert.match(rows[0].pdfLink, /drive\.google\.com/);
  assert.equal(rows[0].status, "Error");
  assert.equal(rows[0].error, "Mail quota reached");
});

test("bad rows are flagged without making a PDF", () => {
  const app = loadProject();
  const rows = [
    certRow({ nameOnCertificate: " " }),
    certRow({ nameOnCertificate: "M".repeat(65) }),
    certRow({ email: "not-an-email" })
  ];
  const { deps, calls } = fakeDeps();
  const result = app.processPendingCertificates_(rows, deps);

  assert.equal(result.failed, 3);
  assert.equal(calls.pdfs.length, 0);
  assert.match(rows[0].error, /empty/);
  assert.match(rows[1].error, /too long/);
  assert.match(rows[2].error, /Email/);
});

test("stops when time runs out and reports how many are left", () => {
  const app = loadProject();
  const rows = [certRow({ certificateId: "A" }), certRow({ certificateId: "B" }), certRow({ certificateId: "C" })];
  let budget = 1;
  const { deps, calls } = fakeDeps({ hasTime: () => budget-- > 0 });
  const result = app.processPendingCertificates_(rows, deps);

  assert.equal(result.sent, 1);
  assert.equal(result.remaining, 2);
  assert.deepEqual(calls.pdfs, ["A"]);
});

test("certificate email greets by first name, shows the ID and escapes HTML", () => {
  const app = loadProject();
  const html = app.getAefCertificateEmailHtml("Ada <b>Lovelace</b>", "AEF-2026-C1-0007");
  assert.match(html, /Hello Ada,/);
  assert.match(html, /AEF-2026-C1-0007/);
  assert.match(html, /Ayoade Adegbite/);
  assert.doesNotMatch(html, /<b>Lovelace/);

  const text = app.getAefCertificateEmailPlainText("Ada Lovelace", "AEF-2026-C1-0007");
  assert.match(text, /Certificate ID: AEF-2026-C1-0007/);
});

test("completion and participation emails describe the correct award", () => {
  const app = loadProject();
  const completion = app.getAefCertificateEmailHtml("Ada Lovelace", "AEF-2026-C1-0001-K7QX", "Certificate of Completion");
  const participation = app.getAefCertificateEmailHtml("Ada Lovelace", "AEF-2026-C1-0002-K7QX", "Certificate of Participation");
  assert.match(completion, /Certificate of Completion/);
  assert.match(completion, /project work/);
  assert.match(participation, /Certificate of Participation/);
  assert.doesNotMatch(participation, /project work|project you submitted/);
});

test("old IDs without a random code get one, unless already sent", () => {
  const app = loadProject();
  const result = app.mergeCertificateRows_([
    certRow({ certificateId: "AEF-2026-C1-0001", email: "a@example.com", status: "" }),
    certRow({ certificateId: "AEF-2026-C1-0002", email: "b@example.com", status: "Sent" }),
    certRow({ certificateId: "AEF-2026-C1-0003-K7QX", email: "c@example.com", status: "" })
  ], []);

  assert.match(result.rows[0].certificateId, /^AEF-2026-C1-0001-[A-HJKMNP-Z2-9]{4}$/);
  assert.equal(result.rows[1].certificateId, "AEF-2026-C1-0002");
  assert.equal(result.rows[2].certificateId, "AEF-2026-C1-0003-K7QX");
});

test("random codes never use look-alike characters", () => {
  const app = loadProject();
  for (let i = 0; i < 200; i++) {
    assert.match(app.randomCertificateCode_(), /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/);
  }
});

test("only rows the team marked Ok in the Status column count", () => {
  const app = loadProject();
  const headers = ["Submitted at", "Name", "Email", "Cohort", "Engagement submitted",
    "# Engagements", "GitHub link", "Google link", "Status", "Issues"];
  const sheet = {
    getDataRange: () => ({
      getValues: () => [
        headers,
        ["2026-08-01", "Marked Ok", "ok@example.com", "AEF Cohort 1", "01 — A", 1, "x", "Nil", "Ok", "OK"],
        ["2026-08-02", "Marked OK", "caps@example.com", "AEF Cohort 1", "02 — B", 1, "x", "Nil", " OK ", ""],
        ["2026-08-03", "Not Marked", "blank@example.com", "AEF Cohort 1", "03 — C", 1, "x", "Nil", "", "OK"],
        ["2026-08-04", "Rejected", "no@example.com", "AEF Cohort 1", "04 — D", 1, "x", "Nil", "Not ok", "OK"]
      ]
    })
  };
  const merged = app.mergeCertificateRows_([], app.readTrackerRows_(sheet));
  assert.deepEqual(merged.rows.map((r) => r.email), ["ok@example.com", "caps@example.com"]);
});

test("every tracker row shows its person's certificate ID", () => {
  const app = loadProject();
  const ids = app.certificateIdsForTracker_(
    ["Ada@Example.com", "bob@example.com", "ada@example.com ", ""],
    [certRow({ email: "ada@example.com", certificateId: "AEF-2026-C1-0001-K7QX" })]
  );
  assert.deepEqual(ids, ["AEF-2026-C1-0001-K7QX", "", "AEF-2026-C1-0001-K7QX", ""]);
});

function fakeEdit({ sheetName = "Review Tracker", row = 5, column = 9, numRows = 1, numColumns = 1, statuses = [["Ok"]] }) {
  const headers = ["Submitted at", "Name", "Email", "Cohort", "Engagement submitted",
    "# Engagements", "GitHub link", "Google link", "Status", "Issues"];
  const tracker = {
    getName: () => sheetName,
    getLastColumn: () => headers.length,
    getParent: () => "SPREADSHEET",
    getRange: (r) => ({ getValues: () => (r === 1 ? [headers] : statuses) })
  };
  return {
    range: {
      getSheet: () => tracker,
      getRow: () => row,
      getColumn: () => column,
      getNumRows: () => numRows,
      getNumColumns: () => numColumns
    }
  };
}

function loadWithFakeUpdate() {
  const toasts = [];
  const app = loadProject({
    Logger: { log: () => {} },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ toast: (message) => toasts.push(message) }) }
  });
  const updates = [];
  app.updateCertificateList_ = (ss) => { updates.push(ss); return { added: 1, rows: [] }; };
  return { app, updates, toasts };
}

test("marking a Review Tracker row Ok updates the certificate list straight away", () => {
  const { app, updates, toasts } = loadWithFakeUpdate();
  app.onEdit(fakeEdit({}));
  assert.deepEqual(updates, ["SPREADSHEET"]);
  assert.match(toasts[0], /1 fellow\(s\) added/);
});

test("other edits do not touch the certificate list", () => {
  const { app, updates } = loadWithFakeUpdate();
  app.onEdit(fakeEdit({ statuses: [["Not ok"]] }));
  app.onEdit(fakeEdit({ statuses: [[""]] }));
  app.onEdit(fakeEdit({ column: 2 }));
  app.onEdit(fakeEdit({ sheetName: "Certificates" }));
  app.onEdit(fakeEdit({ row: 1 }));
  assert.equal(updates.length, 0);
});

test("pasting Ok over several rows and columns is noticed", () => {
  const { app, updates } = loadWithFakeUpdate();
  app.onEdit(fakeEdit({ column: 8, numColumns: 3, numRows: 3, statuses: [[""], ["Ok"], [""]] }));
  assert.equal(updates.length, 1);
});

test("creating PDFs only makes PDFs for approved, unsent rows and emails nobody", () => {
  const app = loadProject();
  const rows = [
    certRow({ certificateId: "A", approved: true }),
    certRow({ certificateId: "B", approved: false }),
    certRow({ certificateId: "C", approved: true, status: "Sent" }),
    certRow({ certificateId: "D", approved: true, nameOnCertificate: "" })
  ];
  const made = [];
  const saves = [];
  const result = app.processPdfsOnly_(rows, {
    hasTime: () => true,
    createPdf: (row) => { made.push(row.certificateId); return { url: "https://drive.google.com/file/d/" + row.certificateId }; },
    saveRow: (index, row) => saves.push([index, row.status])
  });

  assert.deepEqual(made, ["A"]);
  assert.deepEqual({ ...result }, { made: 1, failed: 1, remaining: 0 });
  assert.equal(rows[0].status, "PDF ready");
  assert.match(rows[0].pdfLink, /\/A$/);
  assert.equal(rows[2].status, "Sent");
  assert.equal(rows[3].status, "Error");
  assert.deepEqual(saves.map((s) => s[0]), [0, 3]);
});

function fakeDrive(existingName) {
  const trashed = [];
  const created = [];
  const existing = existingName && {
    getName: () => existingName,
    getBlob: () => "OLD-BLOB",
    getUrl: () => "https://drive.google.com/file/d/OLDFILE1234567890123456789/view",
    isTrashed: () => false,
    setTrashed: () => trashed.push(existingName),
    setSharing: () => {}
  };
  const app = loadProject({
    DriveApp: {
      Access: { ANYONE_WITH_LINK: "anyone" },
      Permission: { VIEW: "view" },
      getFileById: () => existing
    }
  });
  app.createCertificatePdf_ = (name, id) => "BLOB " + id + " " + name;
  const folder = {
    createFile: (blob) => {
      created.push(blob);
      return { getBlob: () => blob, getUrl: () => "https://drive.google.com/file/d/NEWFILE1234567890123456789/view", setSharing: () => {} };
    }
  };
  return { app, folder, trashed, created };
}

test("a PDF that still matches the name is reused when sending", () => {
  const { app, folder, trashed, created } = fakeDrive("AEF-2026-C1-0001 - Ada Lovelace - Completion - v2.pdf");
  const row = certRow({ pdfLink: "https://drive.google.com/file/d/OLDFILE1234567890123456789/view" });
  const pdf = app.certificatePdfForRow_(row, folder, () => "BG", false);
  assert.equal(pdf.blob, "OLD-BLOB");
  assert.deepEqual(created, []);
  assert.deepEqual(trashed, []);
});

test("a PDF with an old name is replaced, so a corrected name is never sent wrong", () => {
  const { app, folder, trashed, created } = fakeDrive("AEF-2026-C1-0001 - ada lovelace.pdf");
  const row = certRow({ pdfLink: "https://drive.google.com/file/d/OLDFILE1234567890123456789/view" });
  const pdf = app.certificatePdfForRow_(row, folder, () => "BG", false);
  assert.equal(pdf.blob, "BLOB AEF-2026-C1-0001 Ada Lovelace");
  assert.deepEqual(trashed, ["AEF-2026-C1-0001 - ada lovelace.pdf"]);
  assert.equal(created.length, 1);
});

test("a failed replacement keeps the old PDF available for review", () => {
  const { app, folder, trashed } = fakeDrive("AEF-2026-C1-0001 - Ada Lovelace.pdf");
  const row = certRow({ pdfLink: "https://drive.google.com/file/d/OLDFILE1234567890123456789/view" });
  assert.throws(() => app.certificatePdfForRow_(row, folder, () => { throw new Error("New background missing"); }, false), /New background missing/);
  assert.deepEqual(trashed, []);
});

test("only an A4 landscape template is accepted", () => {
  const app = loadProject();
  assert.equal(app.isA4Landscape_(841.89, 595.28), true);
  assert.equal(app.isA4Landscape_(720, 405), false); // Google's default widescreen page
  assert.equal(app.isA4Landscape_(595.28, 841.89), false); // A4 portrait
});

test("the certificate email links to the fellow's own verification page", () => {
  const app = loadProject();
  const html = app.getAefCertificateEmailHtml("Ada Lovelace", "AEF-2026-C1-0001-K7QX");
  assert.match(html, /href="https:\/\/certificate\.behindthedata\.tech\/verify\/AEF-2026-C1-0001-K7QX"/);
  assert.match(html, /View or verify your certificate online/);
  const text = app.getAefCertificateEmailPlainText("Ada Lovelace", "AEF-2026-C1-0001-K7QX");
  assert.match(text, /https:\/\/certificate\.behindthedata\.tech\/verify\/AEF-2026-C1-0001-K7QX/);
  assert.equal(app.AEF_CERT_CONFIG.siteUrl, "https://certificate.behindthedata.tech");
});
