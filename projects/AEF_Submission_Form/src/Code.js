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
    'Submit this form four separate times — once for each capstone engagement you completed.\n\n' +
    'Choose one engagement in each submission, then share its GitHub repo link, ' +
    'Google Drive/Docs link, or both. ' +
    'If you only have one of the two, type Nill in the other field — do not leave it blank.',
  spreadsheetName: 'AEF Submissions',
  trackerSheetName: 'Review Tracker',
  senderName: 'Analytics Engineering Fellowship',
  cohortName: 'AEF Cohort 1',
  requiredSubmissionCount: 4
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
  projects: 'Which engagement are you submitting?',
  github: 'GitHub repo link',
  google: 'Google Drive / Docs link',
  presentFinalSession: 'Would you like to present this project during our final fellowship session?',
  notes: 'Anything the reviewer should know? (optional)'
};

var LEGACY_PROJECTS_QUESTION = 'Which four engagements did you complete?';

var TRACKER_HEADERS = [
  'Submitted at', 'Name', 'Email', 'Cohort', 'Engagement submitted',
  '# Engagements', 'GitHub link', 'Google link', 'Would present at final session?',
  'Status', 'Issues', 'Notes'
];

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
    migrateExistingForm_(existing);
    updateExistingTrackerHeaders_();
    Logger.log('Existing form checked and updated.');
    logUrls_(existing);
    return;
  }

  var form = FormApp.create(CONFIG.formTitle)
    .setDescription(CONFIG.formDescription)
    .setCollectEmail(false) // we ask for email explicitly so non-Google users can submit
    .setLimitOneResponsePerUser(false)
    .setAllowResponseEdits(true)
    .setConfirmationMessage(getFormConfirmationMessage_());

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

  buildCohortQuestion_(form);

  buildEngagementQuestion_(form);

  form.addTextItem()
    .setTitle(Q.github)
    .setHelpText('e.g. https://github.com/your-username/your-repo — or type Nill if you have none.')
    .setRequired(true);

  form.addTextItem()
    .setTitle(Q.google)
    .setHelpText('A Drive folder, Doc or Slides link — or type Nill if you have none. Make sure sharing is set to "Anyone with the link can view".')
    .setRequired(true);

  buildPresentationQuestion_(form);

  form.addParagraphTextItem()
    .setTitle(Q.notes)
    .setRequired(false);
}

function buildEngagementQuestion_(form) {
  return configureEngagementListItem_(form.addListItem());
}

function buildCohortQuestion_(form) {
  return configureCohortListItem_(form.addListItem());
}

function buildPresentationQuestion_(form) {
  return configurePresentationQuestion_(form.addMultipleChoiceItem());
}

function configurePresentationQuestion_(item) {
  return item
    .setTitle(Q.presentFinalSession)
    .setHelpText('Choose Yes if you would like to show this project during our final fellowship session.')
    .setChoiceValues(['Yes', 'No'])
    .setRequired(true);
}

function configureCohortListItem_(item) {
  return item
    .setTitle(Q.cohort)
    .setHelpText('This submission form is for AEF Cohort 1.')
    .setChoiceValues([CONFIG.cohortName])
    .setRequired(true);
}

function configureEngagementListItem_(item) {
  return item
    .setTitle(Q.projects)
    .setHelpText('Choose one engagement. Submit this form four times in total — once per engagement.')
    .setChoiceValues(ENGAGEMENTS)
    .setRequired(true);
}

/** Updates the already-created live form without rebuilding its response setup. */
function updateExistingFormForSingleEngagementSubmissions() {
  var formId = PropertiesService.getScriptProperties().getProperty('FORM_ID');
  if (!formId) {
    throw new Error('No saved form was found. Run setUpForm() first.');
  }

  var form = FormApp.openById(formId);
  migrateExistingForm_(form);
  updateExistingTrackerHeaders_();

  Logger.log('Live form updated: ' + form.getEditUrl());
  return form.getEditUrl();
}

function migrateExistingForm_(form) {
  // Change the question first. If that fails, the old working instructions stay in place.
  replaceEngagementQuestion_(form);
  replaceCohortQuestion_(form);
  ensurePresentationQuestion_(form);
  ensureCoreQuestionOrder_(form);
  form.setDescription(CONFIG.formDescription);
  form.setConfirmationMessage(getFormConfirmationMessage_());
}

function ensurePresentationQuestion_(form) {
  var items = form.getItems();
  var presentationItem = null;
  var oldItems = [];
  var preferredIndex = -1;

  for (var i = 0; i < items.length; i++) {
    if (items[i].getTitle() !== Q.presentFinalSession) {
      continue;
    }
    if (preferredIndex === -1) preferredIndex = i;

    if (
      items[i].getType() === FormApp.ItemType.MULTIPLE_CHOICE &&
      !presentationItem
    ) {
      presentationItem = items[i];
    } else {
      oldItems.push(items[i]);
    }
  }

  if (presentationItem) {
    configurePresentationQuestion_(presentationItem.asMultipleChoiceItem());
  } else {
    presentationItem = configurePresentationQuestion_(form.addMultipleChoiceItem());
    if (preferredIndex !== -1) form.moveItem(presentationItem, preferredIndex);
  }

  oldItems.forEach(function (item) {
    form.deleteItem(item);
  });
  moveQuestionImmediatelyBefore_(form, Q.presentFinalSession, Q.notes);
  return presentationItem;
}

function getFormConfirmationMessage_() {
  return 'Engagement submission received. Submit this form ' +
    CONFIG.requiredSubmissionCount + ' separate times in total — once for each ' +
    'completed engagement. You will get a confirmation email shortly.';
}

function replaceEngagementQuestion_(form) {
  var items = form.getItems();
  var listItem = null;
  var oldItems = [];
  var engagementIndex = -1;

  for (var i = 0; i < items.length; i++) {
    var title = items[i].getTitle();
    if (title === Q.projects && items[i].getType() === FormApp.ItemType.LIST && !listItem) {
      listItem = items[i];
      if (engagementIndex === -1) {
        engagementIndex = i;
      }
    } else if (title === Q.projects || title === LEGACY_PROJECTS_QUESTION) {
      oldItems.push(items[i]);
      if (engagementIndex === -1) {
        engagementIndex = i;
      }
    }
  }

  if (listItem) {
    configureEngagementListItem_(listItem.asListItem());
    oldItems.forEach(function (item) {
      form.deleteItem(item);
    });
    return;
  }

  if (oldItems.length === 0) {
    throw new Error('The engagement question could not be found in the live form.');
  }

  // Build and position the replacement before deleting the old required question.
  // This keeps the live form usable if creating the dropdown fails halfway through.
  var newItem = configureEngagementListItem_(form.addListItem());
  form.moveItem(newItem, engagementIndex);
  oldItems.forEach(function (item) {
    form.deleteItem(item);
  });
}

function replaceCohortQuestion_(form) {
  var items = form.getItems();
  var listItem = null;
  var oldItems = [];
  var cohortIndex = -1;

  for (var i = 0; i < items.length; i++) {
    if (items[i].getTitle() !== Q.cohort) {
      continue;
    }

    if (cohortIndex === -1) {
      cohortIndex = i;
    }

    if (items[i].getType() === FormApp.ItemType.LIST && !listItem) {
      listItem = items[i];
    } else {
      oldItems.push(items[i]);
    }
  }

  if (listItem) {
    configureCohortListItem_(listItem.asListItem());
    oldItems.forEach(function (item) {
      form.deleteItem(item);
    });
    return;
  }

  if (oldItems.length === 0) {
    throw new Error('The cohort question could not be found in the live form.');
  }

  var newItem = configureCohortListItem_(form.addListItem());
  form.moveItem(newItem, cohortIndex);
  oldItems.forEach(function (item) {
    form.deleteItem(item);
  });
}

function ensureCoreQuestionOrder_(form) {
  moveQuestionImmediatelyBefore_(form, Q.projects, Q.github);
  moveQuestionImmediatelyBefore_(form, Q.cohort, Q.projects);
}

function moveQuestionImmediatelyBefore_(form, questionTitle, nextQuestionTitle) {
  var items = form.getItems();
  var question = null;
  var questionIndex = -1;
  var nextQuestionIndex = -1;

  for (var i = 0; i < items.length; i++) {
    var title = items[i].getTitle();
    if (title === questionTitle) {
      question = items[i];
      questionIndex = i;
    }
    if (title === nextQuestionTitle) {
      nextQuestionIndex = i;
    }
  }

  if (!question || nextQuestionIndex === -1) {
    throw new Error('The form questions could not be arranged in the required order.');
  }

  if (questionIndex === nextQuestionIndex - 1) {
    return;
  }

  var destinationIndex = questionIndex < nextQuestionIndex
    ? nextQuestionIndex - 1
    : nextQuestionIndex;
  form.moveItem(question, destinationIndex);
}

function createTrackerSheet_(ss) {
  var sheet = ss.insertSheet(CONFIG.trackerSheetName);
  sheet.getRange(1, 1, 1, TRACKER_HEADERS.length)
    .setValues([TRACKER_HEADERS])
    .setFontWeight('bold')
    .setBackground('#1f2937')
    .setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(5, 320);
  sheet.setColumnWidth(10, 320);
  return sheet;
}

function updateExistingTrackerHeaders_() {
  var ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!ssId) {
    return;
  }

  var sheet = SpreadsheetApp.openById(ssId).getSheetByName(CONFIG.trackerSheetName);
  if (!sheet) {
    return;
  }

  var lastColumn = Math.max(sheet.getLastColumn(), 1);
  var existingHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  var presentationHeader = 'Would present at final session?';
  var presentationIndex = existingHeaders.indexOf(presentationHeader);
  var statusIndex = existingHeaders.indexOf('Status');

  // Older tracker rows have Status in column I. Insert a real column so their
  // existing Status, Issues and Notes values stay under the correct headers.
  if (presentationIndex === -1 && statusIndex !== -1) {
    sheet.insertColumnBefore(statusIndex + 1);
  }

  sheet.getRange(1, 1, 1, TRACKER_HEADERS.length).setValues([TRACKER_HEADERS]);
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

  var hasNewQuestion = Object.prototype.hasOwnProperty.call(byTitle, Q.projects);
  var hasLegacyQuestion = Object.prototype.hasOwnProperty.call(byTitle, LEGACY_PROJECTS_QUESTION);
  var projects = byTitle[Q.projects] || byTitle[LEGACY_PROJECTS_QUESTION] || [];
  if (!Array.isArray(projects)) {
    projects = [projects];
  }

  return {
    timestamp: formResponse.getTimestamp(),
    name: String(byTitle[Q.name] || '').trim(),
    email: String(byTitle[Q.email] || '').trim(),
    cohort: String(byTitle[Q.cohort] || '').trim(),
    projects: projects,
    legacyEngagementQuestion: hasLegacyQuestion && !hasNewQuestion,
    github: String(byTitle[Q.github] || '').trim(),
    google: String(byTitle[Q.google] || '').trim(),
    presentFinalSession: String(byTitle[Q.presentFinalSession] || '').trim(),
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

  if (a.legacyEngagementQuestion && a.projects.length !== CONFIG.requiredSubmissionCount) {
    issues.push(
      'This response came from the older form and must contain exactly ' +
      CONFIG.requiredSubmissionCount + ' engagements.'
    );
  } else if (!a.legacyEngagementQuestion && a.projects.length !== 1) {
    issues.push(
      'Choose one engagement per submission. You selected ' +
      a.projects.length + ' engagement(s).'
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
      a.presentFinalSession,
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
  MailApp.sendEmail({
    to: a.email,
    subject: 'Submission received — Analytics Engineering Fellowship',
    htmlBody: buildConfirmationEmailHtml_(a),
    name: CONFIG.senderName
  });
}

function buildConfirmationEmailHtml_(a) {
  return (
    '<p>Hi ' + escapeHtml_(a.name) + ',</p>' +
    '<p>We have received this Analytics Engineering Fellowship engagement submission. ' +
    'Here is what we logged:</p>' +
    '<p><strong>Engagement submitted:</strong></p>' +
    projectListHtml_(a.projects) +
    linkLineHtml_('GitHub repo', a.github) +
    linkLineHtml_('Google Drive / Docs', a.google) +
    '<p><strong>Present at the final fellowship session:</strong> ' +
    escapeHtml_(a.presentFinalSession || 'No answer') + '</p>' +
    '<p>Please make sure both links stay accessible to reviewers until you hear back. ' +
    'If a link is private, we will not be able to grade it.</p>' +
    '<p>Remember to submit this form separately for each of your four engagements.</p>' +
    '<p>— ' + escapeHtml_(CONFIG.senderName) + '</p>'
  );
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
