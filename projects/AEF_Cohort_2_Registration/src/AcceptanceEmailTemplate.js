function getAefCohort2AcceptanceEmailHtml(fullName) {
  const firstName = escapeAefCohort2Html_(getAefCohort2FirstName_(fullName));
  const formUrl = getAefCohort2AcceptanceFormUrl_();
  const agreementUrl = AEF_COHORT_2_CONFIG.complianceDocumentUrl;

  return `
    <div style="margin:0;padding:24px 12px;background:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ef;border-radius:14px;overflow:hidden;">
        <tr>
          <td style="padding:28px;background:#0f2747;text-align:center;color:#ffffff;">
            <p style="margin:0 0 8px;font-size:13px;letter-spacing:1px;">ANALYTICS ENGINEERING FELLOWSHIP COHORT 2</p>
            <h1 style="margin:0;font-size:28px;">Application Accepted</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:30px;line-height:1.65;">
            <p style="font-size:18px;margin-top:0;">Hello ${firstName},</p>
            <p>Congratulations. You have been accepted into the <strong>Analytics Engineering Fellowship Cohort 2</strong>.</p>
            <p>The fellowship starts on <strong>September 1, 2026</strong>. It includes a two-month Beginner Phase followed by a two-month Advanced Phase.</p>
            <div style="margin:22px 0;padding:18px;border-left:4px solid #2563eb;background:#eff6ff;">
              <p style="margin:0 0 8px;"><strong>Secure your place within 24 hours of receiving this email</strong></p>
              <p style="margin:0;">Pay the <strong>NGN 30,100 refundable commitment deposit</strong>. NGN 30,000 is refunded after successful completion; NGN 100 is kept as a processing fee.</p>
            </div>
            <p><strong>Payment details</strong><br>
              Account Name: BEHIND THE DATA LTD<br>
              Account Number: 1308690832<br>
              Bank: Providus Bank
            </p>
            <p>After payment, complete the Cohort 2 acceptance form and attach your payment proof.</p>
            <p style="text-align:center;margin:28px 0;">
              <a href="${formUrl}" style="display:inline-block;padding:13px 22px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;">Complete Cohort 2 Acceptance Form</a>
            </p>
            <p>Please also read the <a href="${agreementUrl}">Cohort 2 Compliance and Participation Agreement</a>. You will confirm that you understand it in the acceptance form.</p>
            <p>Your place is only confirmed after we receive and verify your payment and acceptance form.</p>
            <p style="margin-bottom:0;">Warm regards,<br><strong>Behind the Data Academy</strong></p>
          </td>
        </tr>
      </table>
    </div>`;
}

function getAefCohort2AcceptanceEmailPlainText(fullName) {
  const firstName = getAefCohort2FirstName_(fullName);
  return [
    "Hello " + firstName + ",",
    "",
    "Congratulations. You have been accepted into the Analytics Engineering Fellowship Cohort 2.",
    "The fellowship starts on September 1, 2026. It includes a two-month Beginner Phase followed by a two-month Advanced Phase.",
    "",
    "Secure your place within 24 hours of receiving this email by paying the NGN 30,100 refundable commitment deposit.",
    "NGN 30,000 is refunded after successful completion; NGN 100 is kept as a processing fee.",
    "",
    "Payment details:",
    "Account Name: BEHIND THE DATA LTD",
    "Account Number: 1308690832",
    "Bank: Providus Bank",
    "",
    "Cohort 2 acceptance form: " + getAefCohort2AcceptanceFormUrl_(),
    "Cohort 2 Compliance and Participation Agreement: " + AEF_COHORT_2_CONFIG.complianceDocumentUrl,
    "",
    "Your place is only confirmed after we receive and verify your payment and acceptance form.",
    "",
    "Warm regards,",
    "Behind the Data Academy"
  ].join("\n");
}
