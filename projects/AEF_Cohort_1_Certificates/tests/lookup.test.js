const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");
const KEY = "a".repeat(64);
const PDF_LINK = "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/view";

function loadProject(rows = [], storedKey = KEY) {
  const properties = { AEF_CERT_LOOKUP_KEY: storedKey, AEF_CERT_SPREADSHEET_ID: "sheet-id" };
  const sheetValues = rows.map((row) => [
    row.certificateId, row.nameOnCertificate, row.email, row.submittedName, row.projectCount,
    row.approved, row.status, row.pdfLink, row.sentAt, row.error
  ]);
  const sheet = {
    getLastRow: () => sheetValues.length + 1,
    getRange: () => ({ getValues: () => sheetValues })
  };
  const globals = {
    Utilities: { getUuid: () => "12345678-1234-4abc-8def-0123456789ab" },
    Logger: { log: () => {} },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (name) => (name in properties ? properties[name] : null),
        setProperty: (name, value) => { properties[name] = value; }
      })
    },
    SpreadsheetApp: { openById: () => ({ getSheetByName: () => sheet }) },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (text) => ({ text, setMimeType() { return this; } })
    }
  };
  const context = vm.createContext({ console, ...globals });
  ["CertificateLayout.js", "CertificateEmailTemplate.js", "Code.js", "Lookup.js"].forEach((fileName) => {
    vm.runInContext(fs.readFileSync(path.join(projectRoot, "src", fileName), "utf8"), context, { filename: fileName });
  });
  return context;
}

function sentRow(overrides) {
  return {
    certificateId: "AEF-2026-C1-0001-K7QX",
    nameOnCertificate: "Ada  Lovelace",
    email: "ada@example.com",
    submittedName: "ada lovelace",
    projectCount: 2,
    approved: true,
    status: "Sent",
    pdfLink: PDF_LINK,
    sentAt: "2026-09-20",
    error: "",
    ...overrides
  };
}

function callLookup(app, parameter) {
  return JSON.parse(app.doGet({ parameter }).text);
}

test("a sent certificate returns only its public details", () => {
  const app = loadProject([sentRow()]);
  const reply = callLookup(app, { id: "AEF-2026-C1-0001-K7QX", key: KEY });

  assert.equal(reply.ok, true);
  assert.equal(reply.found, true);
  assert.deepEqual(Object.keys(reply.certificate).sort(),
    ["award", "cohort", "id", "issued", "name", "pdfUrl", "programme"]);
  assert.equal(reply.certificate.name, "Ada Lovelace");
  assert.equal(reply.certificate.programme, "Analytics Engineering Fellowship");
  assert.equal(reply.certificate.pdfUrl,
    "https://drive.google.com/uc?export=download&id=1AbCdEfGhIjKlMnOpQrStUvWxYz012345");

  const text = JSON.stringify(reply);
  assert.doesNotMatch(text, /@/, "no email address may ever be returned");
  assert.doesNotMatch(text, /ada lovelace/, "the submitted spelling is private");
});

test("lower case and spaces in the typed ID still match", () => {
  const app = loadProject([sentRow()]);
  const reply = callLookup(app, { id: "  aef-2026-c1-0001-k7qx ", key: KEY });
  assert.equal(reply.found, true);
});

test("unknown, unsent, PDF-less and old-format IDs are not found", () => {
  const app = loadProject([
    sentRow({ certificateId: "AEF-2026-C1-0002-AAAA", status: "PDF ready" }),
    sentRow({ certificateId: "AEF-2026-C1-0003-BBBB", status: "Error" }),
    sentRow({ certificateId: "AEF-2026-C1-0004-CCCC", pdfLink: "" }),
    sentRow({ certificateId: "AEF-2026-C1-0005-DDDD" })
  ]);
  ["AEF-2026-C1-0002-AAAA", "AEF-2026-C1-0003-BBBB", "AEF-2026-C1-0004-CCCC",
    "AEF-2026-C1-0005", "AEF-2026-C1-9999-ZZZZ", "", "X".repeat(41)].forEach((id) => {
    assert.deepEqual(callLookup(app, { id, key: KEY }), { ok: true, found: false }, id);
  });
});

test("a missing or wrong key is refused", () => {
  const app = loadProject([sentRow()]);
  assert.deepEqual(callLookup(app, { id: "AEF-2026-C1-0001-K7QX" }), { ok: false, error: "unauthorized" });
  assert.deepEqual(callLookup(app, { id: "AEF-2026-C1-0001-K7QX", key: "b".repeat(64) }),
    { ok: false, error: "unauthorized" });
});

test("nothing is served until a key has been created", () => {
  const app = loadProject([sentRow()], null);
  assert.deepEqual(callLookup(app, { id: "AEF-2026-C1-0001-K7QX", key: "" }), { ok: false, error: "unauthorized" });
});

test("a sheet problem is reported as unavailable, never as not found", () => {
  const app = loadProject([sentRow()]);
  app.SpreadsheetApp.openById = () => { throw new Error("Service unavailable"); };
  assert.deepEqual(callLookup(app, { id: "AEF-2026-C1-0001-K7QX", key: KEY }), { ok: false, error: "unavailable" });
});
