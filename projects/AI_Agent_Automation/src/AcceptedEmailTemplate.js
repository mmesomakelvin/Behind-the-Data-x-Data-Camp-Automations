const AI_AGENTS_ACCEPTED_DISCORD_LINK = "https://discord.gg/4mhSUaeTM";
const AI_AGENTS_ACCEPTED_COMPLIANCE_LINK = "https://docs.google.com/document/d/1_Nw_-GE94NsH2VoIaWcJ32NMcgtbXg17jX9I9FdrtWE/edit?usp=sharing";
const AI_AGENTS_ACCEPTED_FORM_LINK = "https://docs.google.com/forms/d/e/1FAIpQLSeFfwQhzVgzRAA4NPNJhpn7Rk9a-2yzaJaBMP0klqIh-_vigQ/viewform?usp=publish-editor";
const AI_AGENTS_ACCEPTED_PAYMENT_AMOUNT = "NGN 30,100";
const AI_AGENTS_ACCEPTED_REFUNDABLE_AMOUNT = "NGN 30,000";
const AI_AGENTS_ACCEPTED_PROCESSING_FEE = "NGN 100";
const AI_AGENTS_ACCEPTED_ACCOUNT_NAME = "BEHIND THE DATA LTD";
const AI_AGENTS_ACCEPTED_ACCOUNT_NUMBER = "1308690832";
const AI_AGENTS_ACCEPTED_BANK_NAME = "Providus Bank";

function getAiAgentsAcceptedEmailHtml(fullName) {
  const firstName = escapeAiAgentsHtml_(getAiAgentsFirstName_(fullName));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accepted into the Applied AI Development Bootcamp</title>
</head>
<body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background:#111827;padding:24px 20px;text-align:center;">
              <img src="${AI_AGENTS_LOGO_URL}" alt="Behind the Data Academy" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px 10px 28px;">
              <p style="margin:0 0 14px 0;font-size:18px;line-height:1.6;color:#111827;">Hello ${firstName},</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;"><strong>Congratulations.</strong> You have been accepted into the Applied AI Development Bootcamp.</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">We received strong applications, and your profile stood out during the review process. We are pleased to welcome you into this cohort.</p>
              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.75;color:#374151;">To secure your place and stay aligned with the program expectations, complete the next steps below as soon as possible.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;background:#f8fafc;border-left:4px solid #4f46e5;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 10px 0;font-size:15px;line-height:1.75;color:#374151;">To secure your spot, please complete the next steps below.</p>
                  </td>
                </tr>
              </table>

              <h3 style="margin:0 0 10px 0;font-size:17px;color:#111827;">Next Steps</h3>
              <ul style="margin:0 0 18px 20px;padding:0;color:#374151;font-size:14px;line-height:1.8;">
                <li>Confirm your participation via the cohort acceptance form.</li>
                <li>Pay the <strong>${AI_AGENTS_ACCEPTED_PAYMENT_AMOUNT}</strong> refundable commitment deposit.</li>
              </ul>

              <ul style="margin:-8px 0 18px 36px;padding:0;color:#374151;font-size:14px;line-height:1.8;">
                <li>${AI_AGENTS_ACCEPTED_REFUNDABLE_AMOUNT} will be refunded upon successful completion.</li>
                <li>${AI_AGENTS_ACCEPTED_PROCESSING_FEE} covers processing fees.</li>
              </ul>

              <h3 style="margin:0 0 10px 0;font-size:17px;color:#111827;">Payment Details</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;border:1px solid #e5e7eb;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;width:38%;">Account Name</td>
                  <td style="padding:10px 12px;font-size:14px;color:#111827;font-weight:600;">${AI_AGENTS_ACCEPTED_ACCOUNT_NAME}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;">Account Number</td>
                  <td style="padding:10px 12px;font-size:14px;color:#111827;font-weight:600;">${AI_AGENTS_ACCEPTED_ACCOUNT_NUMBER}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;">Bank</td>
                  <td style="padding:10px 12px;font-size:14px;color:#111827;font-weight:600;">${AI_AGENTS_ACCEPTED_BANK_NAME}</td>
                </tr>
              </table>

              <h3 style="margin:0 0 10px 0;font-size:17px;color:#111827;">After Payment</h3>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">After payment, open the compliance document, make a copy, fill and sign it, then download it. Use the cohort acceptance form to submit your details and upload the signed compliance document. Please read all instructions carefully before submitting.</p>
              <p style="margin:0 0 16px 0;font-size:14px;line-height:1.75;color:#6b7280;">If you have already received this email before and have made payment, please ignore this message.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;border:1px solid #e5e7eb;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;width:34%;">Discord Community</td>
                  <td style="padding:10px 12px;font-size:14px;"><a href="${AI_AGENTS_ACCEPTED_DISCORD_LINK}" style="color:#2563eb;text-decoration:underline;">Join Discord</a></td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;">Compliance Document</td>
                  <td style="padding:10px 12px;font-size:14px;"><a href="${AI_AGENTS_ACCEPTED_COMPLIANCE_LINK}" style="color:#2563eb;text-decoration:underline;">Review compliance document</a></td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;">Acceptance Form</td>
                  <td style="padding:10px 12px;font-size:14px;"><a href="${AI_AGENTS_ACCEPTED_FORM_LINK}" style="color:#2563eb;text-decoration:underline;">Complete acceptance form</a></td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;">
                <tr>
                  <td align="center" style="padding:0 0 10px 0;">
                    <a href="${AI_AGENTS_ACCEPTED_FORM_LINK}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-size:14px;font-weight:700;">Complete Cohort Acceptance Form</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${AI_AGENTS_ACCEPTED_COMPLIANCE_LINK}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-size:14px;font-weight:700;">Open Compliance Document</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">Please complete these steps promptly so you do not miss important instructions for onboarding and program kickoff.</p>
              <p style="margin:0 0 8px 0;font-size:13px;line-height:1.75;color:#6b7280;word-break:break-word;">If the buttons do not open, copy and paste these links into your browser:</p>
              <p style="margin:0 0 8px 0;font-size:13px;line-height:1.75;word-break:break-word;"><a href="${AI_AGENTS_ACCEPTED_FORM_LINK}" style="color:#2563eb;">${AI_AGENTS_ACCEPTED_FORM_LINK}</a></p>
              <p style="margin:0 0 14px 0;font-size:13px;line-height:1.75;word-break:break-word;"><a href="${AI_AGENTS_ACCEPTED_COMPLIANCE_LINK}" style="color:#2563eb;">${AI_AGENTS_ACCEPTED_COMPLIANCE_LINK}</a></p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">We are excited to have you in the cohort and look forward to what you will build.</p>
              <p style="margin:0;font-size:15px;line-height:1.75;color:#374151;">Welcome to the program.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#111827;padding:22px 28px;color:#d1d5db;">
              <p style="margin:0 0 4px 0;font-size:13px;">Warm regards,</p>
              <p style="margin:0 0 2px 0;font-size:14px;color:#ffffff;font-weight:600;">Ayoade Adegbite</p>
              <p style="margin:0;font-size:13px;">Behind the Data Academy</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getAiAgentsAcceptedEmailPlainText(fullName) {
  const firstName = getAiAgentsFirstName_(fullName);

  return "Hello " + firstName + ",\n\n" +
    "Congratulations. You have been accepted into the Applied AI Development Bootcamp.\n\n" +
    "We received strong applications, and your profile stood out during the review process. We are pleased to welcome you into this cohort.\n\n" +
    "To secure your spot, please complete the next steps below.\n\n" +
    "What happens next:\n" +
    "- Confirm your participation via the cohort acceptance form.\n" +
    "- Pay the " + AI_AGENTS_ACCEPTED_PAYMENT_AMOUNT + " refundable commitment deposit.\n" +
    "  - " + AI_AGENTS_ACCEPTED_REFUNDABLE_AMOUNT + " will be refunded upon successful completion.\n" +
    "  - " + AI_AGENTS_ACCEPTED_PROCESSING_FEE + " covers processing fees.\n\n" +
    "Payment details:\n" +
    "- Account Name: " + AI_AGENTS_ACCEPTED_ACCOUNT_NAME + "\n" +
    "- Account Number: " + AI_AGENTS_ACCEPTED_ACCOUNT_NUMBER + "\n" +
    "- Bank: " + AI_AGENTS_ACCEPTED_BANK_NAME + "\n\n" +
    "After payment, open the compliance document, make a copy, fill and sign it, then download it. Use the cohort acceptance form to submit your details and upload the signed compliance document. Please read all instructions carefully before submitting.\n\n" +
    "If you have already received this email before and have made payment, please ignore this message.\n\n" +
    "Discord community: " + AI_AGENTS_ACCEPTED_DISCORD_LINK + "\n" +
    "Compliance document: " + AI_AGENTS_ACCEPTED_COMPLIANCE_LINK + "\n" +
    "Cohort acceptance form: " + AI_AGENTS_ACCEPTED_FORM_LINK + "\n\n" +
    "Please complete these steps promptly so you do not miss important instructions for onboarding and program kickoff.\n\n" +
    "We are excited to have you in the cohort and look forward to what you will build.\n\n" +
    "Welcome to the program.\n\n" +
    "Warm regards,\n" +
    "Ayoade Adegbite\n" +
    "Behind the Data Academy";
}

function getAiAgentsAcceptedReminderHtml(fullName) {
  const firstName = escapeAiAgentsHtml_(getAiAgentsFirstName_(fullName));
  const deadlineLabel = escapeAiAgentsHtml_(getAiAgentsAcceptanceDeadlineLabel_());

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acceptance Reminder</title>
</head>
<body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background:#111827;padding:24px 20px;text-align:center;">
              <img src="${AI_AGENTS_LOGO_URL}" alt="Behind the Data Academy" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px 10px 28px;">
              <p style="margin:0 0 14px 0;font-size:18px;line-height:1.6;color:#111827;">Hello ${firstName},</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">This is a reminder that you have been admitted into the <strong>Applied AI Development Bootcamp</strong>.</p>
              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.75;color:#374151;">To keep your place in the cohort, please accept your admission and complete your commitment-fee payment <strong>by ${deadlineLabel}</strong>.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;background:#fff7ed;border-left:4px solid #ea580c;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 8px 0;font-size:14px;line-height:1.75;color:#7c2d12;"><strong>Deadline:</strong> ${deadlineLabel}</p>
                    <p style="margin:0;font-size:14px;line-height:1.75;color:#7c2d12;">Please submit your acceptance and payment before the deadline so your admission remains active.</p>
                  </td>
                </tr>
              </table>

              <h3 style="margin:0 0 10px 0;font-size:17px;color:#111827;">What You Need To Do</h3>
              <ul style="margin:0 0 18px 20px;padding:0;color:#374151;font-size:14px;line-height:1.8;">
                <li>Complete the cohort acceptance form to confirm your admission.</li>
                <li>Pay the <strong>${AI_AGENTS_ACCEPTED_PAYMENT_AMOUNT}</strong> commitment fee.</li>
                <li>Upload your signed compliance document through the acceptance form after payment.</li>
              </ul>

              <ul style="margin:-8px 0 18px 36px;padding:0;color:#374151;font-size:14px;line-height:1.8;">
                <li>${AI_AGENTS_ACCEPTED_REFUNDABLE_AMOUNT} will be refunded upon successful completion.</li>
                <li>${AI_AGENTS_ACCEPTED_PROCESSING_FEE} covers processing fees.</li>
              </ul>

              <h3 style="margin:0 0 10px 0;font-size:17px;color:#111827;">Payment Details</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;border:1px solid #e5e7eb;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;width:38%;">Account Name</td>
                  <td style="padding:10px 12px;font-size:14px;color:#111827;font-weight:600;">${AI_AGENTS_ACCEPTED_ACCOUNT_NAME}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;">Account Number</td>
                  <td style="padding:10px 12px;font-size:14px;color:#111827;font-weight:600;">${AI_AGENTS_ACCEPTED_ACCOUNT_NUMBER}</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;">Bank</td>
                  <td style="padding:10px 12px;font-size:14px;color:#111827;font-weight:600;">${AI_AGENTS_ACCEPTED_BANK_NAME}</td>
                </tr>
              </table>

              <p style="margin:0 0 16px 0;font-size:15px;line-height:1.75;color:#374151;">After payment, open the compliance document, make a copy, complete it, sign it, and upload it in the acceptance form.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;border:1px solid #e5e7eb;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;width:34%;">Acceptance Form</td>
                  <td style="padding:10px 12px;font-size:14px;"><a href="${AI_AGENTS_ACCEPTED_FORM_LINK}" style="color:#2563eb;text-decoration:underline;">Complete acceptance form</a></td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;">Compliance Document</td>
                  <td style="padding:10px 12px;font-size:14px;"><a href="${AI_AGENTS_ACCEPTED_COMPLIANCE_LINK}" style="color:#2563eb;text-decoration:underline;">Open compliance document</a></td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;">
                <tr>
                  <td align="center" style="padding:0 0 10px 0;">
                    <a href="${AI_AGENTS_ACCEPTED_FORM_LINK}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-size:14px;font-weight:700;">Accept Admission</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${AI_AGENTS_ACCEPTED_COMPLIANCE_LINK}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-size:14px;font-weight:700;">Open Compliance Document</a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px 0;font-size:13px;line-height:1.75;color:#6b7280;word-break:break-word;">If you have already completed these steps, please ignore this reminder.</p>
              <p style="margin:0 0 8px 0;font-size:13px;line-height:1.75;color:#6b7280;word-break:break-word;">Acceptance form link: <a href="${AI_AGENTS_ACCEPTED_FORM_LINK}" style="color:#2563eb;">${AI_AGENTS_ACCEPTED_FORM_LINK}</a></p>
              <p style="margin:0 0 14px 0;font-size:13px;line-height:1.75;color:#6b7280;word-break:break-word;">Compliance document link: <a href="${AI_AGENTS_ACCEPTED_COMPLIANCE_LINK}" style="color:#2563eb;">${AI_AGENTS_ACCEPTED_COMPLIANCE_LINK}</a></p>
              <p style="margin:0;font-size:15px;line-height:1.75;color:#374151;">We look forward to having you in the cohort.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#111827;padding:22px 28px;color:#d1d5db;">
              <p style="margin:0 0 4px 0;font-size:13px;">Warm regards,</p>
              <p style="margin:0 0 2px 0;font-size:14px;color:#ffffff;font-weight:600;">Ayoade Adegbite</p>
              <p style="margin:0;font-size:13px;">Behind the Data Academy</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getAiAgentsAcceptedReminderPlainText(fullName) {
  const firstName = getAiAgentsFirstName_(fullName);
  const deadlineLabel = getAiAgentsAcceptanceDeadlineLabel_();

  return "Hello " + firstName + ",\n\n" +
    "This is a reminder that you have been admitted into the Applied AI Development Bootcamp.\n\n" +
    "To keep your place in the cohort, please accept your admission and complete your commitment-fee payment by " + deadlineLabel + ".\n\n" +
    "What you need to do:\n" +
    "- Complete the cohort acceptance form to confirm your admission.\n" +
    "- Pay the " + AI_AGENTS_ACCEPTED_PAYMENT_AMOUNT + " commitment fee.\n" +
    "- Upload your signed compliance document through the acceptance form after payment.\n\n" +
    "Payment details:\n" +
    "- Account Name: " + AI_AGENTS_ACCEPTED_ACCOUNT_NAME + "\n" +
    "- Account Number: " + AI_AGENTS_ACCEPTED_ACCOUNT_NUMBER + "\n" +
    "- Bank: " + AI_AGENTS_ACCEPTED_BANK_NAME + "\n\n" +
    "Breakdown:\n" +
    "- " + AI_AGENTS_ACCEPTED_REFUNDABLE_AMOUNT + " will be refunded upon successful completion.\n" +
    "- " + AI_AGENTS_ACCEPTED_PROCESSING_FEE + " covers processing fees.\n\n" +
    "Acceptance form: " + AI_AGENTS_ACCEPTED_FORM_LINK + "\n" +
    "Compliance document: " + AI_AGENTS_ACCEPTED_COMPLIANCE_LINK + "\n\n" +
    "If you have already completed these steps, please ignore this reminder.\n\n" +
    "Warm regards,\n" +
    "Ayoade Adegbite\n" +
    "Behind the Data Academy";
}

function getAcceptedReminderEmailSubject_() {
  return REGISTRATION_CONFIG.acceptedReminderEmailSubjectPrefix + " by " + getAiAgentsAcceptanceDeadlineLabel_();
}

function getAiAgentsAcceptanceDeadlineLabel_() {
  const timezone = getAiAgentsScriptTimeZone_();
  const today = new Date();
  const isoWeekday = Number(Utilities.formatDate(today, timezone, "u"));
  const daysUntilFriday = (5 - isoWeekday + 7) % 7;
  const deadlineDate = new Date(today.getTime() + daysUntilFriday * 24 * 60 * 60 * 1000);
  return Utilities.formatDate(deadlineDate, timezone, "EEEE, MMMM d, yyyy");
}

function getAiAgentsScriptTimeZone_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (spreadsheet) {
    return spreadsheet.getSpreadsheetTimeZone();
  }
  return Session.getScriptTimeZone();
}
