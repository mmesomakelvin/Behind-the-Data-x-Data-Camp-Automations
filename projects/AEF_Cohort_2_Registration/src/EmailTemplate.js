const AEF_COHORT_2_LOGO_URL = "https://drive.google.com/uc?export=view&id=1_evR_u0vLNwFUdDE4xkAeLKDE0DCmwA3";

function getAefCohort2RegistrationEmailHtml(fullName) {
  const firstName = escapeAefCohort2Html_(getAefCohort2FirstName_(fullName));

  return `
    <div style="margin:0;padding:24px 12px;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#111827;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ef;border-radius:14px;overflow:hidden;">
        <tr>
          <td style="padding:24px 28px;background:#0f2747;text-align:center;">
            <img src="${AEF_COHORT_2_LOGO_URL}" alt="Behind the Data Academy" style="display:block;max-width:170px;height:auto;margin:0 auto 12px auto;">
            <p style="margin:0;color:#dbeafe;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;">Analytics Engineering Fellowship</p>
            <h1 style="margin:8px 0 0 0;color:#ffffff;font-size:24px;line-height:1.3;">Application Received</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:30px 28px;">
            <p style="margin:0 0 16px 0;font-size:18px;line-height:1.6;">Hello ${firstName},</p>
            <p style="margin:0 0 14px 0;font-size:15px;line-height:1.75;color:#374151;">We have received your application for the <strong>Analytics Engineering Fellowship Cohort 2</strong>. Your application is currently <strong>under review</strong>.</p>
            <p style="margin:0 0 20px 0;font-size:15px;line-height:1.75;color:#374151;">You will receive a separate email after the review process with our decision.</p>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;background:#eff6ff;border-left:4px solid #2563eb;">
              <tr>
                <td style="padding:16px 18px;">
                  <p style="margin:0 0 8px 0;font-size:15px;line-height:1.7;color:#1e3a8a;"><strong>Commitment deposit if selected</strong></p>
                  <p style="margin:0;font-size:14px;line-height:1.75;color:#1e3a8a;">Selected applicants will be required to pay a <strong>₦30,100</strong> commitment deposit within 72 hours of receiving the acceptance email. <strong>₦30,000</strong> is refundable after successful completion of the fellowship, while <strong>₦100</strong> is retained as a processing fee.</p>
                </td>
              </tr>
            </table>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px 0;background:#fff7ed;border-left:4px solid #ea580c;">
              <tr>
                <td style="padding:15px 18px;">
                  <p style="margin:0;font-size:14px;line-height:1.7;color:#9a3412;"><strong>Do not make payment until you receive an acceptance email from us.</strong></p>
                </td>
              </tr>
            </table>

            <p style="margin:0;font-size:15px;line-height:1.75;color:#374151;">Warm regards,<br><strong>Behind the Data Academy</strong></p>
          </td>
        </tr>
      </table>
    </div>`;
}

function getAefCohort2RegistrationEmailPlainText(fullName) {
  const firstName = getAefCohort2FirstName_(fullName);

  return "Hello " + firstName + ",\n\n" +
    "We have received your application for the Analytics Engineering Fellowship Cohort 2. Your application is currently under review.\n\n" +
    "You will receive a separate email after the review process with our decision.\n\n" +
    "If selected, you will be required to pay a ₦30,100 commitment deposit within 72 hours of receiving your acceptance email. ₦30,000 is refundable after successful completion of the fellowship, while ₦100 is retained as a processing fee.\n\n" +
    "Do not make payment until you receive an acceptance email from us.\n\n" +
    "Warm regards,\n" +
    "Behind the Data Academy";
}

function getAefCohort2FirstName_(fullName) {
  const cleanName = String(fullName || "").trim();
  return cleanName ? cleanName.split(/\s+/)[0] : "Applicant";
}

function escapeAefCohort2Html_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
