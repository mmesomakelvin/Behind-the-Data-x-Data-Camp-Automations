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
