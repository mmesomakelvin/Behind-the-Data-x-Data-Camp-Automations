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

test("reads the status even when the tracker headings are shifted one column", () => {
  const app = loadProject();
  const headers = ["Submitted at", "Name", "Email", "Cohort", "Engagement submitted",
    "# Engagements", "GitHub link", "Google link", "Status", "Issues"];
  const sheet = {
    getDataRange: () => ({
      getValues: () => [
        headers,
        // Older row: status under "Status".
        ["2026-08-01", "Old Row", "old@example.com", "AEF Cohort 1", "01 — A", 1, "x", "Nil", "OK", ""],
        // Newer rows: presentation answer under "Status", real status under "Issues".
        ["2026-08-31", "New Blank", "blank@example.com", "AEF Cohort 1", "02 — B", 1, "x", "Nil", "", "OK"],
        ["2026-08-31", "New Yes", "yes@example.com", "AEF Cohort 1", "03 — C", 1, "x", "Nil", "Yes", "OK"],
        ["2026-08-31", "New Fix", "fix@example.com", "AEF Cohort 1", "04 — D", 1, "x", "x", "No", "NEEDS FIX"]
      ]
    })
  };
  const rows = app.readTrackerRows_(sheet);
  assert.deepEqual(rows.map((r) => r.status), ["OK", "OK", "OK", "NEEDS FIX"]);

  const merged = app.mergeCertificateRows_([], rows);
  assert.deepEqual(merged.rows.map((r) => r.email).sort(),
    ["blank@example.com", "old@example.com", "yes@example.com"]);
});
