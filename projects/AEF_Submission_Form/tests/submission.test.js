const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadCode(globals = {}) {
  const source = fs.readFileSync(
    path.resolve(__dirname, "..", "src", "Code.js"),
    "utf8"
  );
  const context = vm.createContext({ console, ...globals });
  vm.runInContext(source, context, { filename: "Code.js" });
  return context;
}

test("one selected engagement is valid for one form submission", () => {
  const context = loadCode();
  const result = context.validate_({
    projects: ["01 — E-Commerce Revenue Leakage (Retail / Finance)"],
    github: "https://github.com/example/project-one",
    google: "Nill"
  });

  assert.equal(result.valid, true);
  assert.deepEqual(Array.from(result.issues), []);
});

test("more than one selected engagement is rejected", () => {
  const context = loadCode();
  const result = context.validate_({
    projects: [
      "01 — E-Commerce Revenue Leakage (Retail / Finance)",
      "02 — Ride-Hailing Marketplace (Mobility)"
    ],
    github: "https://github.com/example/projects",
    google: "Nill"
  });

  assert.equal(result.valid, false);
  assert.match(result.issues.join(" "), /one engagement per submission/i);
});

test("an old four-choice response remains valid during the live-form change", () => {
  const context = loadCode();
  const result = context.validate_({
    projects: [
      "01 — E-Commerce Revenue Leakage (Retail / Finance)",
      "02 — Ride-Hailing Marketplace (Mobility)",
      "03 — Telecom Customer Churn (Telecom)",
      "04 — Fintech Loan Portfolio (Lending)"
    ],
    legacyEngagementQuestion: true,
    github: "https://github.com/example/projects",
    google: "Nill"
  });

  assert.equal(result.valid, true);
  assert.deepEqual(Array.from(result.issues), []);
});

test("the response reader recognizes the old engagement question", () => {
  const context = loadCode();
  const responses = [
    ["Full name", "Ada Lovelace"],
    ["Email address", "ada@example.com"],
    ["Which four engagements did you complete?", ["One", "Two", "Three", "Four"]],
    ["GitHub repo link", "https://github.com/example/projects"],
    ["Google Drive / Docs link", "Nill"]
  ].map(([title, value]) => ({
    getItem: () => ({ getTitle: () => title }),
    getResponse: () => value
  }));

  const result = context.readResponse_({
    getItemResponses: () => responses,
    getTimestamp: () => new Date("2026-08-24T00:00:00Z")
  });

  assert.equal(result.legacyEngagementQuestion, true);
  assert.equal(result.projects.length, 4);
});

test("the engagement question allows one choice from the full catalog", () => {
  const calls = [];
  const item = {
    setTitle(value) { calls.push(["title", value]); return this; },
    setHelpText(value) { calls.push(["help", value]); return this; },
    setChoiceValues(value) { calls.push(["choices", value.slice()]); return this; },
    setRequired(value) { calls.push(["required", value]); return this; }
  };
  const form = {
    addListItem() { calls.push(["type", "list"]); return item; },
    addCheckboxItem() { calls.push(["type", "checkbox"]); return item; }
  };
  const context = loadCode();

  context.buildEngagementQuestion_(form);

  assert.deepEqual(calls[0], ["type", "list"]);
  assert.equal(calls.find((call) => call[0] === "choices")[1].length, 10);
  assert.deepEqual(calls.at(-1), ["required", true]);
});

test("the receipt describes one engagement for the current submission", () => {
  const context = loadCode();
  const html = context.buildConfirmationEmailHtml_({
    name: "Ada Lovelace",
    projects: ["03 — Telecom Customer Churn (Telecom)"],
    github: "https://github.com/example/churn",
    google: "Nill"
  });

  assert.match(html, /Engagement submitted/i);
  assert.doesNotMatch(html, /Engagements submitted/i);
  assert.match(html, /Telecom Customer Churn/);
});

test("the live-form updater replaces the old checkbox question with a dropdown", () => {
  const calls = [];
  const oldItem = {
    getTitle: () => "Which four engagements did you complete?",
    getType: () => "CHECKBOX"
  };
  const newItem = {
    setTitle(value) { calls.push(["title", value]); return this; },
    setHelpText(value) { calls.push(["help", value]); return this; },
    setChoiceValues(value) { calls.push(["choices", value.slice()]); return this; },
    setRequired(value) { calls.push(["required", value]); return this; }
  };
  const form = {
    getItems: () => [oldItem],
    deleteItem(item) { calls.push(["delete", item]); },
    addListItem() { calls.push(["add", "list"]); return newItem; },
    moveItem(item, index) { calls.push(["move", item, index]); }
  };
  const context = loadCode({
    FormApp: { ItemType: { LIST: "LIST" } }
  });

  context.replaceEngagementQuestion_(form);

  assert.equal(calls.some((call) => call[0] === "delete"), true);
  assert.equal(calls.some((call) => call[0] === "add"), true);
  assert.equal(calls.some((call) => call[0] === "move" && call[2] === 0), true);
  assert.ok(
    calls.findIndex((call) => call[0] === "move") <
      calls.findIndex((call) => call[0] === "delete"),
    "the ready dropdown must be moved into place before the old checkbox is deleted"
  );
});

test("a rerun removes a leftover legacy checkbox after finding the new dropdown", () => {
  const deleted = [];
  const listItem = {
    setTitle() { return this; },
    setHelpText() { return this; },
    setChoiceValues() { return this; },
    setRequired() { return this; }
  };
  const currentItem = {
    getTitle: () => "Which engagement are you submitting?",
    getType: () => "LIST",
    asListItem: () => listItem
  };
  const oldItem = {
    getTitle: () => "Which four engagements did you complete?",
    getType: () => "CHECKBOX"
  };
  const form = {
    getItems: () => [currentItem, oldItem],
    deleteItem(item) { deleted.push(item); }
  };
  const context = loadCode({ FormApp: { ItemType: { LIST: "LIST" } } });

  context.replaceEngagementQuestion_(form);

  assert.deepEqual(deleted, [oldItem]);
});

test("rerunning the live-form updater keeps the existing dropdown", () => {
  let deleteCount = 0;
  const listItem = {
    setTitle() { return this; },
    setHelpText() { return this; },
    setChoiceValues() { return this; },
    setRequired() { return this; }
  };
  const existingItem = {
    getTitle: () => "Which engagement are you submitting?",
    getType: () => "LIST",
    asListItem: () => listItem
  };
  const form = {
    getItems: () => [existingItem],
    deleteItem() { deleteCount++; }
  };
  const context = loadCode({
    FormApp: { ItemType: { LIST: "LIST" } }
  });

  context.replaceEngagementQuestion_(form);

  assert.equal(deleteCount, 0);
});

test("the public updater refreshes the live form instructions", () => {
  const values = [];
  const listItem = {
    setTitle() { return this; },
    setHelpText() { return this; },
    setChoiceValues() { return this; },
    setRequired() { return this; }
  };
  const form = {
    setDescription(value) { values.push(value); return this; },
    setConfirmationMessage(value) { values.push(value); return this; },
    getItems: () => [{
      getTitle: () => "Which engagement are you submitting?",
      getType: () => "LIST",
      asListItem: () => listItem
    }],
    getEditUrl: () => "https://docs.google.com/forms/example/edit"
  };
  const context = loadCode({
    FormApp: {
      ItemType: { LIST: "LIST" },
      openById: () => form
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => key === "FORM_ID" ? "live-form-id" : null
      })
    },
    Logger: { log: () => {} }
  });

  context.updateExistingFormForSingleEngagementSubmissions();

  assert.equal(values.length, 2);
  assert.match(values.join(" "), /four separate times/i);
});

test("rerunning setup updates an existing form instead of doing nothing", () => {
  const values = [];
  const listItem = {
    setTitle() { return this; },
    setHelpText() { return this; },
    setChoiceValues() { return this; },
    setRequired() { return this; }
  };
  const form = {
    getItems: () => [{
      getTitle: () => "Which engagement are you submitting?",
      getType: () => "LIST",
      asListItem: () => listItem
    }],
    setDescription(value) { values.push(value); return this; },
    setConfirmationMessage(value) { values.push(value); return this; },
    getPublishedUrl: () => "https://docs.google.com/forms/example/viewform",
    getEditUrl: () => "https://docs.google.com/forms/example/edit"
  };
  const context = loadCode({
    FormApp: {
      ItemType: { LIST: "LIST" },
      openById: () => form
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => key === "FORM_ID" ? "live-form-id" : null
      })
    },
    Logger: { log: () => {} }
  });

  context.setUpForm();

  assert.equal(values.length, 2);
  assert.match(values.join(" "), /one engagement/i);
});

test("the live update relabels the existing review tracker", () => {
  let writtenHeaders;
  const sheet = {
    getRange: () => ({
      setValues(values) { writtenHeaders = values[0]; return this; }
    })
  };
  const context = loadCode({
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: () => "spreadsheet-id" })
    },
    SpreadsheetApp: {
      openById: () => ({ getSheetByName: () => sheet })
    }
  });

  context.updateExistingTrackerHeaders_();

  assert.equal(writtenHeaders[4], "Engagement submitted");
  assert.equal(writtenHeaders[5], "# Engagements");
});
