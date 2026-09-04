const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const projectRoot = path.resolve(__dirname, "..");

function loadProject(globals = {}) {
  const context = vm.createContext({ console, ...globals });
  ["RefundEmailTemplate.js", "Code.js"].forEach((fileName) => {
    const filePath = path.join(projectRoot, "src", fileName);
    if (!fs.existsSync(filePath)) return;
    vm.runInContext(fs.readFileSync(filePath, "utf8"), context, { filename: fileName });
  });
  return context;
}

test("refund email confirms the completed refund", () => {
  const context = loadProject();

  for (const body of [
    context.getAefRefundEmailPlainText("Ada Lovelace", false),
    context.getAefRefundEmailHtml("Ada Lovelace", false)
  ]) {
    assert.match(body, /Hello Ada/i);
    assert.match(body, /commitment deposit has been refunded/i);
    assert.match(body, /account details you submitted/i);
  }
});

test("refund email only promises a certificate for a submitted portfolio", () => {
  const context = loadProject();
  const standardPlain = context.getAefRefundEmailPlainText("Ada Lovelace", false);
  const submittedPlain = context.getAefRefundEmailPlainText("Ada Lovelace", true);
  const standardHtml = context.getAefRefundEmailHtml("Ada Lovelace", false);
  const submittedHtml = context.getAefRefundEmailHtml("Ada Lovelace", true);

  assert.doesNotMatch(standardPlain, /certificate/i);
  assert.doesNotMatch(standardHtml, /certificate/i);
  assert.match(submittedPlain, /certificate will be sent by the weekend/i);
  assert.match(submittedHtml, /certificate will be sent by the weekend/i);
});
