const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function loadScripts(fileNames) {
  const context = vm.createContext({ console });

  fileNames.forEach((fileName) => {
    const filePath = path.join(projectRoot, "src", fileName);
    if (!fs.existsSync(filePath)) {
      return;
    }

    const source = fs.readFileSync(filePath, "utf8");
    vm.runInContext(source, context, { filename: fileName });
  });

  return context;
}

test("registration email confirms review and defers payment until acceptance", () => {
  const context = loadScripts(["EmailTemplate.js"]);

  assert.equal(typeof context.getAefCohort2RegistrationEmailHtml, "function");
  assert.equal(typeof context.getAefCohort2RegistrationEmailPlainText, "function");

  const html = context.getAefCohort2RegistrationEmailHtml("Ada Lovelace");
  const text = context.getAefCohort2RegistrationEmailPlainText("Ada Lovelace");

  for (const body of [html, text]) {
    assert.match(body, /Ada/);
    assert.match(body, /under review/i);
    assert.match(body, /separate email/i);
    assert.match(body, /₦30,100/);
    assert.match(body, /₦30,000/);
    assert.match(body, /₦100/);
    assert.match(body, /within 24 hours/i);
    assert.match(body, /do not make payment/i);
    assert.match(body, /acceptance email/i);
  }
});

test("registration email safely personalizes the applicant name", () => {
  const context = loadScripts(["EmailTemplate.js"]);

  assert.equal(typeof context.getAefCohort2RegistrationEmailHtml, "function");
  assert.match(
    context.getAefCohort2RegistrationEmailHtml("<Ada> Lovelace"),
    /Hello &lt;Ada&gt;/
  );
  assert.match(
    context.getAefCohort2RegistrationEmailPlainText(""),
    /Hello Applicant/
  );
});

test("email normalization and primary fallback resolution are deterministic", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);

  assert.equal(typeof context.normalizeAefEmail_, "function");
  assert.equal(typeof context.resolveAefRegistrationEmail_, "function");

  const columns = { primaryEmailIndex: 1, fallbackEmailIndex: 4 };
  assert.equal(context.normalizeAefEmail_("  ADA@Example.COM "), "ada@example.com");
  assert.equal(
    context.resolveAefRegistrationEmail_(["", "primary@example.com", "", "", "fallback@example.com"], columns),
    "primary@example.com"
  );
  assert.equal(
    context.resolveAefRegistrationEmail_(["", "", "", "", "Fallback@Example.com"], columns),
    "fallback@example.com"
  );
});

test("registration actions prevent repeat sends and allow failed retries", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);

  assert.equal(typeof context.determineAefRegistrationAction_, "function");
  assert.equal(context.determineAefRegistrationAction_("", "", {}), "skip-no-email");
  assert.equal(context.determineAefRegistrationAction_("ada@example.com", "Sent", {}), "skip-sent");
  assert.equal(
    context.determineAefRegistrationAction_("ada@example.com", "", { "ada@example.com": true }),
    "skip-duplicate"
  );
  assert.equal(context.determineAefRegistrationAction_("ada@example.com", "Failed", {}), "send");
  assert.equal(context.determineAefRegistrationAction_("ada@example.com", "", {}), "send");
});

test("header resolution distinguishes the two live email columns", () => {
  const context = loadScripts(["EmailTemplate.js", "Code.js"]);

  assert.equal(typeof context.getAefRegistrationColumnIndexes_, "function");

  const headers = ["Timestamp", "Email address", "Column 2", "Full Name", "Email Address"];
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.getAefRegistrationColumnIndexes_(headers))),
    { primaryEmailIndex: 1, fullNameIndex: 3, fallbackEmailIndex: 4 }
  );
});
