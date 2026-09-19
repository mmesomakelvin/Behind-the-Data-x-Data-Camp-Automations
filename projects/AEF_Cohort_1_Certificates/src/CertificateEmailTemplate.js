var AEF_CERT_LOGO_URL =
  "https://drive.google.com/uc?export=view&id=1_evR_u0vLNwFUdDE4xkAeLKDE0DCmwA3";

var AEF_CERT_EMAIL_SUBJECT =
  "Your Analytics Engineering Fellowship Certificate - Cohort 1";

var AEF_CERT_VERIFY_BASE_URL = "https://btd-certificates.vercel.app/verify/";

function getAefCertificateVerifyUrl(certificateId) {
  return AEF_CERT_VERIFY_BASE_URL + encodeURIComponent(String(certificateId || "").trim());
}

function getAefCertificateEmailHtml(fullName, certificateId) {
  const firstName = escapeAefCertHtml_(getAefCertFirstName_(fullName));
  const safeId = escapeAefCertHtml_(certificateId);
  const verifyUrl = escapeAefCertHtml_(getAefCertificateVerifyUrl(certificateId));

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
              <p style="margin:0 0 14px;font-size:18px;line-height:1.6;color:#111827;">Hello ${firstName},</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.75;color:#374151;">Thank you for being part of the <strong>Analytics Engineering Fellowship 2026, Cohort 1</strong>. Your <strong>Certificate of Participation</strong> is attached to this email as a PDF.</p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.75;color:#374151;">It recognises your commitment to practical learning, the project work you submitted, and the analytics engineering skills you built during the fellowship.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:#ecfdf5;border-left:4px solid #159a86;">
                <tr>
                  <td style="padding:16px 18px;color:#134e4a;font-size:15px;line-height:1.75;">
                    <strong>Certificate ID:</strong> ${safeId}<br>
                    Please keep this ID for your records.
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 18px;"><a href="${verifyUrl}" style="display:inline-block;padding:12px 20px;background:#0f2747;color:#ffffff;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;">View or verify your certificate online</a></p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.75;color:#374151;">Anyone can confirm your certificate is genuine using that page, or by scanning the QR code on the certificate. We would love to see you share it. If you post it on LinkedIn, please tag <strong>Behind the Data Academy</strong>. The verification page has an <strong>Add to LinkedIn</strong> button that fills in the details for you.</p>
              <p style="margin:0;font-size:15px;line-height:1.75;color:#374151;">Congratulations, and thank you for learning with us.</p>
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

function getAefCertificateEmailPlainText(fullName, certificateId) {
  return "Hello " + getAefCertFirstName_(fullName) + ",\n\n" +
    "Thank you for being part of the Analytics Engineering Fellowship 2026, Cohort 1. " +
    "Your Certificate of Participation is attached to this email as a PDF.\n\n" +
    "It recognises your commitment to practical learning, the project work you submitted, " +
    "and the analytics engineering skills you built during the fellowship.\n\n" +
    "Certificate ID: " + certificateId + "\n" +
    "Please keep this ID for your records.\n\n" +
    "View or verify your certificate online: " + getAefCertificateVerifyUrl(certificateId) + "\n\n" +
    "Anyone can confirm your certificate is genuine using that page, or by scanning the QR code on the certificate. " +
    "We would love to see you share it. If you post it on LinkedIn, please tag Behind the Data Academy. " +
    "The verification page has an Add to LinkedIn button that fills in the details for you.\n\n" +
    "Congratulations, and thank you for learning with us.\n\n" +
    "Warm regards,\n" +
    "Ayoade Adegbite\n" +
    "Founder, Behind the Data Academy";
}

function getAefCertFirstName_(fullName) {
  const first = String(fullName || "").trim().split(/\s+/)[0];
  return first || "there";
}

function escapeAefCertHtml_(text) {
  return String(text == null ? "" : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
