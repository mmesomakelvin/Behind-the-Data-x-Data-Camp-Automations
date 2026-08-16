/**
 * Analytics Engineering Fellowship — project submission form.
 *
 * Run setUpForm() once. It builds the Form, creates the response spreadsheet,
 * adds a Review Tracker sheet, and installs the submit trigger.
 * Everything after that happens automatically in onFormSubmitHandler().
 *
 * Catalog source: github.com/tripleaceme/analytics-engineering-fellowship
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

var CONFIG = {
  formTitle: 'Analytics Engineering Fellowship — Project Submission',
  formDescription:
    'Submit the four capstone engagements you completed.\n\n' +
    'Share your work as a GitHub repo link, a Google Drive/Docs link, or both. ' +
    'If you only have one of the two, type Nill in the other field — do not leave it blank.',
  spreadsheetName: 'AEF Submissions',
  trackerSheetName: 'Review Tracker',
  senderName: 'Analytics Engineering Fellowship',
  requiredProjectCount: 4
};

// Titles match the engagement catalog table in the repo README.
var ENGAGEMENTS = [
  '01 — E-Commerce Revenue Leakage (Retail / Finance)',
  '02 — Ride-Hailing Marketplace (Mobility)',
  '03 — Telecom Customer Churn (Telecom)',
  '04 — Fintech Loan Portfolio (Lending)',
  '05 — Healthcare Appointments (Healthcare)',
  '06 — Subscription / MRR Platform (SaaS / Streaming)',
  '07 — Logistics Delivery Performance (Logistics)',
  '08 — HR Workforce Analytics (People Ops)',
  '09 — EdTech Learning Analytics (Education)',
  '10 — Multi-Country Retail (Retail)'
];

// Question titles are the contract between setUpForm() and the handler.
// Change one here and both sides stay in sync.
var Q = {
  name: 'Full name',
  email: 'Email address',
  cohort: 'Cohort / group',
  projects: 'Which four engagements did you complete?',
  github: 'GitHub repo link',
  google: 'Google Drive / Docs link',
  notes: 'Anything the reviewer should know? (optional)'
};

// Accepted ways of saying "I did not submit this one".
var NILL_TOKENS = ['nill', 'nil', 'none', 'n/a', 'na', '-'];

var GITHUB_PATTERN = /^https:\/\/(www\.)?github\.com\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+(\/.*)?$/i;
var GOOGLE_PATTERN = /^https:\/\/(docs|drive|colab\.research)\.google\.com\/.+/i;

// ---------------------------------------------------------------------------
// Setup — run this once
// ---------------------------------------------------------------------------

/**
 * Builds the form, spreadsheet and trigger. Safe to re-run: if a form was
 * already created by a previous run it reports the URLs instead of making
 * a duplicate.
 */
function setUpForm() {
  var props = PropertiesService.getScriptProperties();
  var existingId = props.getProperty('FORM_ID');

  if (existingId) {
    var existing = FormApp.openById(existingId);
    Logger.log('Form already exists — nothing created.');
    logUrls_(existing);
    return;
  }

  var form = FormApp.create(CONFIG.formTitle)
    .setDescription(CONFIG.formDescription)
    .setCollectEmail(false) // we ask for email explicitly so non-Google users can submit
    .setLimitOneResponsePerUser(false)
    .setAllowResponseEdits(true)
    .setConfirmationMessage(
      'Submission received. You will get a confirmation email shortly — ' +
      'if anything is wrong with your links, that email will tell you what to fix.'
    );

  buildQuestions_(form);

  var ss = SpreadsheetApp.create(CONFIG.spreadsheetName);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  createTrackerSheet_(ss);

  ScriptApp.newTrigger('onFormSubmitHandler').forForm(form).onFormSubmit().create();

  props.setProperties({
    FORM_ID: form.getId(),
    SPREADSHEET_ID: ss.getId()
  });

  Logger.log('Setup complete.');
  logUrls_(form);
}

function buildQuestions_(form) {
  form.addTextItem()
    .setTitle(Q.name)
    .setRequired(true);

  form.addTextItem()
    .setTitle(Q.email)
    .setHelpText('We send your confirmation here — double-check it.')
    .setRequired(true)
    .setValidation(FormApp.createTextValidation().requireTextIsEmail().build());

  form.addTextItem()
    .setTitle(Q.cohort)
    .setRequired(false);

  form.addCheckboxItem()
    .setTitle(Q.projects)
    .setHelpText('Select exactly ' + CONFIG.requiredProjectCount + '.')
    .setChoiceValues(ENGAGEMENTS)
    .setRequired(true)
    .setValidation(
      FormApp.createCheckboxValidation()
        .requireSelectExactly(CONFIG.requiredProjectCount)
        .build()
    );

  form.addTextItem()
    .setTitle(Q.github)
    .setHelpText('e.g. https://github.com/your-username/your-repo — or type Nill if you have none.')
    .setRequired(true);

  form.addTextItem()
    .setTitle(Q.google)
    .setHelpText('A Drive folder, Doc or Slides link — or type Nill if you have none. Make sure sharing is set to "Anyone with the link can view".')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle(Q.notes)
    .setRequired(false);
}

function createTrackerSheet_(ss) {
  var sheet = ss.insertSheet(CONFIG.trackerSheetName);
  var headers = [
    'Submitted at', 'Name', 'Email', 'Cohort', 'Projects selected',
    '# Projects', 'GitHub link', 'Google link', 'Status', 'Issues', 'Notes'
  ];
  sheet.getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setFontWeight('bold')
    .setBackground('#1f2937')
    .setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(5, 320);
  sheet.setColumnWidth(10, 320);
  return sheet;
}

function logUrls_(form) {
  Logger.log('Live form:   ' + form.getPublishedUrl());
  Logger.log('Edit form:   ' + form.getEditUrl());
  var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (ssId) {
    Logger.log('Responses:   ' + SpreadsheetApp.openById(ssId).getUrl());
  }
}

// ---------------------------------------------------------------------------
// Submit handler
// ---------------------------------------------------------------------------

/**
 * Installed trigger. Validates the submission, records it on the tracker
 * sheet, and emails the fellow either a receipt or a fix-it note.
 */
function onFormSubmitHandler(e) {
  try {
    var answers = readResponse_(e.response);
    var result = validate_(answers);

    recordSubmission_(answers, result);

    if (result.valid) {
      sendConfirmationEmail_(answers);
    } else {
      sendFixItEmail_(answers, result.issues);
    }
  } catch (err) {
    // Never let a bad email address or a transient failure lose the submission.
    Logger.log('onFormSubmitHandler failed: ' + err.stack);
  }
}

/** Reads a FormResponse into a plain object keyed by our question titles. */
function readResponse_(formResponse) {
  var byTitle = {};
  formResponse.getItemResponses().forEach(function (itemResponse) {
    byTitle[itemResponse.getItem().getTitle()] = itemResponse.getResponse();
  });

  var projects = byTitle[Q.projects] || [];
  if (!Array.isArray(projects)) {
    projects = [projects];
  }

  return {
    timestamp: formResponse.getTimestamp(),
    name: String(byTitle[Q.name] || '').trim(),
    email: String(byTitle[Q.email] || '').trim(),
    cohort: String(byTitle[Q.cohort] || '').trim(),
    projects: projects,
    github: String(byTitle[Q.github] || '').trim(),
    google: String(byTitle[Q.google] || '').trim(),
    notes: String(byTitle[Q.notes] || '').trim()
  };
}

function isNill_(value) {
  return NILL_TOKENS.indexOf(value.toLowerCase().replace(/\.$/, '')) !== -1;
}

/**
 * Each link field has exactly three legal states: a valid URL, the word Nill,
 * or an error. On top of that, at least one of the two must be a real link.
 */
function validate_(a) {
  var issues = [];

  var githubGiven = !isNill_(a.github);
  var googleGiven = !isNill_(a.google);

  if (githubGiven && !GITHUB_PATTERN.test(a.github)) {
    issues.push(
      'The GitHub link does not look like a repository URL. Expected something like ' +
      'https://github.com/your-username/your-repo — you sent "' + a.github + '". ' +
      'If you have no GitHub repo, type Nill instead.'
    );
  }

  if (googleGiven && !GOOGLE_PATTERN.test(a.google)) {
    issues.push(
      'The Google link does not look like a Drive/Docs URL. Expected something starting with ' +
      'https://drive.google.com/ or https://docs.google.com/ — you sent "' + a.google + '". ' +
      'If you have no Google link, type Nill instead.'
    );
  }

  if (!githubGiven && !googleGiven) {
    issues.push(
      'Both link fields say Nill, so there is nothing for us to review. ' +
      'You must supply at least one working link.'
    );
  }

  if (a.projects.length !== CONFIG.requiredProjectCount) {
    issues.push(
      'You selected ' + a.projects.length + ' engagement(s). Exactly ' +
      CONFIG.requiredProjectCount + ' are required.'
    );
  }

  return { valid: issues.length === 0, issues: issues };
}

function recordSubmission_(a, result) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // appends from concurrent submissions must not interleave

  try {
    var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
    var ss = ssId ? SpreadsheetApp.openById(ssId) : SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(CONFIG.trackerSheetName) || createTrackerSheet_(ss);

    sheet.appendRow([
      a.timestamp,
      a.name,
      a.email,
      a.cohort,
      a.projects.join('\n'),
      a.projects.length,
      a.github,
      a.google,
      result.valid ? 'OK' : 'NEEDS FIX',
      result.issues.join('\n'),
      a.notes
    ]);

    var row = sheet.getLastRow();
    var range = sheet.getRange(row, 1, 1, sheet.getLastColumn());
    range.setBackground(result.valid ? '#e7f6ec' : '#fce8e6');
    range.setVerticalAlignment('top').setWrap(true);
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

function projectListHtml_(projects) {
  return '<ul>' + projects.map(function (p) {
    return '<li>' + escapeHtml_(p) + '</li>';
  }).join('') + '</ul>';
}

function linkLineHtml_(label, value) {
  if (isNill_(value)) {
    return '<p><strong>' + label + ':</strong> <em>Nill (not submitted)</em></p>';
  }
  var safe = escapeHtml_(value);
  return '<p><strong>' + label + ':</strong> <a href="' + safe + '">' + safe + '</a></p>';
}

function escapeHtml_(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function sendConfirmationEmail_(a) {
  var body =
    '<p>Hi ' + escapeHtml_(a.name) + ',</p>' +
    '<p>We have received your Analytics Engineering Fellowship submission. ' +
    'Here is what we logged:</p>' +
    '<p><strong>Engagements submitted:</strong></p>' +
    projectListHtml_(a.projects) +
    linkLineHtml_('GitHub repo', a.github) +
    linkLineHtml_('Google Drive / Docs', a.google) +
    '<p>Please make sure both links stay accessible to reviewers until you hear back. ' +
    'If a link is private, we will not be able to grade it.</p>' +
    '<p>— ' + escapeHtml_(CONFIG.senderName) + '</p>';

  MailApp.sendEmail({
    to: a.email,
    subject: 'Submission received — Analytics Engineering Fellowship',
    htmlBody: body,
    name: CONFIG.senderName
  });
}

function sendFixItEmail_(a, issues) {
  var body =
    '<p>Hi ' + escapeHtml_(a.name) + ',</p>' +
    '<p>Thanks for submitting — but we cannot process your entry yet. ' +
    'Please fix the following and submit the form again:</p>' +
    '<ul>' + issues.map(function (i) {
      return '<li>' + escapeHtml_(i) + '</li>';
    }).join('') + '</ul>' +
    '<p><strong>What we received:</strong></p>' +
    linkLineHtml_('GitHub repo', a.github) +
    linkLineHtml_('Google Drive / Docs', a.google) +
    '<p>Reminder: you may submit a GitHub link, a Google link, or both — but not ' +
    'Nill for both. At least one has to point at real work.</p>' +
    '<p>— ' + escapeHtml_(CONFIG.senderName) + '</p>';

  MailApp.sendEmail({
    to: a.email,
    subject: 'Action needed — your Fellowship submission could not be accepted',
    htmlBody: body,
    name: CONFIG.senderName
  });
}
