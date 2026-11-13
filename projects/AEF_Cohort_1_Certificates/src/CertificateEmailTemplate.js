var AEF_CERT_LOGO_URL =
  "https://drive.google.com/uc?export=view&id=1_evR_u0vLNwFUdDE4xkAeLKDE0DCmwA3";

var AEF_CERT_VERIFY_BASE_URL = "https://certificate.behindthedata.tech/verify/";

// The academy's public LinkedIn page (without the admin-only settings from the dashboard link).
var AEF_CERT_LINKEDIN_URL = "https://www.linkedin.com/company/behind-the-data-academy/";

var AEF_CERT_PROGRAMME = "Analytics Engineering Fellowship 2026, Cohort 1";

/**
 * Completion and Participation each have their own email. Only the wording in here differs;
 * the layout, certificate ID, verification link and LinkedIn link are shared.
 */
var AEF_CERT_EMAILS = {
  completion: {
    award: "Certificate of Completion",
    subject: "Congratulations! Your AEF Certificate of Completion - Cohort 1",
    paragraphs: [
      "Congratulations! You have successfully completed the courses of the <strong>" + AEF_CERT_PROGRAMME +
        "</strong> and its required project work. Your <strong>Certificate of Completion</strong> is attached to this email as a PDF.",
      "This certificate recognises the applied project work you delivered and the skills you built in data literacy, " +
        "SQL, Python, cloud data tools and version control. It is a real achievement, and we are proud of you."
    ],
    closing: "Congratulations once again, and thank you for learning with us."
  },
  participation: {
    award: "Certificate of Participation",
    subject: "Your AEF Certificate of Participation - Cohort 1",
    paragraphs: [
      "Thank you for taking part in the <strong>" + AEF_CERT_PROGRAMME +
        "</strong>. Your <strong>Certificate of Participation</strong> is attached to this email as a PDF.",
      "This certificate recognises your participation and your engagement with the learning programme across " +
        "data literacy, SQL, Python and cloud data tools. We hope the skills you have started building keep serving you well."
    ],
    closing: "Thank you for learning with us, and we hope to see you again soon."
  }
};

function getAefCertificateVerifyUrl(certificateId) {
  return AEF_CERT_VERIFY_BASE_URL + encodeURIComponent(String(certificateId || "").trim());
}

function getAefCertificateEmailSubject(award) {
  return aefCertEmailFor_(award).subject;
}

function getAefCertificateEmailHtml(fullName, certificateId, award) {
  const email = aefCertEmailFor_(award);
  const name = escapeAefCertHtml_(getAefCertFullName_(fullName));
  const safeId = escapeAefCertHtml_(certificateId);
  const verifyUrl = escapeAefCertHtml_(getAefCertificateVerifyUrl(certificateId));
  const linkedInUrl = escapeAefCertHtml_(AEF_CERT_LINKEDIN_URL);
  const paragraphs = email.paragraphs.map(function (text) {
    return '<p style="margin:0 0 14px;font-size:15px;line-height:1.75;color:#374151;">' + text + "</p>";
  }).join("\n              ");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AEF Cohort 1 Certificate</title>
</head>
<body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background:#0f2747;padding:24px 20px;text-align:center;">
              <img src="${AEF_CERT_LOGO_URL}" alt="Behind the Data Academy" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px 22px 28px;">
              <p style="margin:0 0 14px;font-size:18px;line-height:1.6;color:#111827;">Dear ${name},</p>
              ${paragraphs}

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 18px;background:#ecfdf5;border-left:4px solid #159a86;">
                <tr>
                  <td style="padding:16px 18px;color:#134e4a;font-size:15px;line-height:1.75;">
                    <strong>Certificate ID:</strong> ${safeId}<br>
                    Please keep this ID for your records.
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:15px;line-height:1.75;color:#374151;"><strong>Verify your certificate</strong></p>
              <p style="margin:0 0 10px;"><a href="${verifyUrl}" style="display:inline-block;padding:12px 20px;background:#0f2747;color:#ffffff;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;">View or verify your certificate online</a></p>
              <p style="margin:0 0 18px;font-size:13px;line-height:1.6;color:#6b7280;">Or open this link: <a href="${verifyUrl}" style="color:#0f2747;word-break:break-all;">${verifyUrl}</a><br>Anyone can confirm your certificate is genuine using that page, or by scanning the QR code on the certificate.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:#eef4fb;border-radius:8px;">
                <tr>
                  <td style="padding:16px 18px;font-size:15px;line-height:1.75;color:#1f2937;">
                    <strong>Follow us on LinkedIn</strong><br>
                    Please follow the Behind the Data Academy page to keep up with new programmes, opportunities and fellow updates.
                    If you share your certificate, tag <strong>Behind the Data Academy</strong>; the verification page has an
                    <strong>Add to LinkedIn</strong> button that fills in the details for you.
                    <p style="margin:12px 0 0;"><a href="${linkedInUrl}" style="display:inline-block;padding:10px 18px;background:#0a66c2;color:#ffffff;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;">Follow Behind the Data Academy</a></p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:15px;line-height:1.75;color:#374151;">${email.closing}</p>
            </td>
          </tr>
          <tr>
            <td style="background:#0f2747;padding:22px 28px;color:#d1d5db;">
              <p style="margin:0 0 4px;font-size:13px;">Warm regards,</p>
              <p style="margin:0 0 2px;font-size:14px;color:#ffffff;font-weight:600;">Ayoade Adegbite</p>
              <p style="margin:0;font-size:13px;">Founder, Behind the Data Academy</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getAefCertificateEmailPlainText(fullName, certificateId, award) {
  const email = aefCertEmailFor_(award);
  const paragraphs = email.paragraphs.map(function (text) {
    return text.replace(/<[^>]+>/g, "");
  });
  return "Dear " + getAefCertFullName_(fullName) + ",\n\n" +
    paragraphs.join("\n\n") + "\n\n" +
    "Certificate ID: " + certificateId + "\n" +
    "Please keep this ID for your records.\n\n" +
    "Verify your certificate: " + getAefCertificateVerifyUrl(certificateId) + "\n" +
    "Anyone can confirm your certificate is genuine using that page, or by scanning the QR code on the certificate.\n\n" +
    "Follow us on LinkedIn: " + AEF_CERT_LINKEDIN_URL + "\n" +
    "Please follow the Behind the Data Academy page to keep up with new programmes, opportunities and fellow updates. " +
    "If you share your certificate, tag Behind the Data Academy; the verification page has an Add to LinkedIn button " +
    "that fills in the details for you.\n\n" +
    email.closing + "\n\n" +
    "Warm regards,\n" +
    "Ayoade Adegbite\n" +
    "Founder, Behind the Data Academy";
}

function aefCertEmailFor_(award) {
  return award === AEF_CERT_EMAILS.completion.award ? AEF_CERT_EMAILS.completion : AEF_CERT_EMAILS.participation;
}

/** The name exactly as printed on the certificate, with stray spaces removed. */
function getAefCertFullName_(fullName) {
  const name = String(fullName || "").trim().replace(/\s+/g, " ");
  return name || "Fellow";
}

function escapeAefCertHtml_(text) {
  return String(text == null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
