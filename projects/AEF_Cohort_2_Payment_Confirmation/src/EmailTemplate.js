var AEF_PAYMENT_CONFIRMATION_LOGO_URL =
  "https://drive.google.com/uc?export=view&id=1_evR_u0vLNwFUdDE4xkAeLKDE0DCmwA3";

function getAefPaymentConfirmationEmailHtml(fullName) {
  const firstName = escapeAefPaymentHtml_(getAefPaymentFirstName_(fullName));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background:#0f2747;padding:24px 20px;text-align:center;">
              <img src="${AEF_PAYMENT_CONFIRMATION_LOGO_URL}" alt="Behind the Data Academy" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px 16px 28px;">
              <p style="margin:0 0 14px 0;font-size:18px;line-height:1.6;color:#111827;">Hello ${firstName},</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">This is to confirm that your refundable commitment deposit for the <strong>Analytics Engineering Fellowship Cohort 2</strong> has been reviewed and confirmed.</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">Your payment has been recorded successfully, and your place in the fellowship is secured.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;background:#ecfdf5;border-left:4px solid #059669;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0;font-size:14px;line-height:1.75;color:#065f46;"><strong>Status:</strong> Payment has been confirmed</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">As stated during your application, NGN 30,000 will be refunded after you successfully complete the fellowship. NGN 100 is retained as a processing fee.</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">Please keep an eye on your email and community channels for onboarding and programme updates.</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">If you need support, reply to this email or contact <a href="mailto:hello@behindthedata.tech" style="color:#2563eb;">hello@behindthedata.tech</a>.</p>
              <p style="margin:0;font-size:15px;line-height:1.75;color:#374151;">We look forward to having you in the fellowship.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#0f2747;padding:22px 28px;color:#d1d5db;">
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

function getAefPaymentConfirmationEmailPlainText(fullName) {
  const firstName = getAefPaymentFirstName_(fullName);

  return "Hello " + firstName + ",\n\n" +
    "This is to confirm that your refundable commitment deposit for the Analytics Engineering Fellowship Cohort 2 has been reviewed and confirmed.\n\n" +
    "Your payment has been recorded successfully, and your place in the fellowship is secured.\n\n" +
    "Status: Payment has been confirmed.\n\n" +
    "As stated during your application, NGN 30,000 will be refunded after you successfully complete the fellowship. NGN 100 is retained as a processing fee.\n\n" +
    "Please keep an eye on your email and community channels for onboarding and programme updates.\n\n" +
    "If you need support, reply to this email or contact hello@behindthedata.tech.\n\n" +
    "We look forward to having you in the fellowship.\n\n" +
    "Warm regards,\n" +
    "Ayoade Adegbite\n" +
    "Behind the Data Academy";
}

function getAefPaymentFirstName_(fullName) {
  const clean = String(fullName || "").trim();
  return clean ? clean.split(/\s+/)[0] : "Fellow";
}

function escapeAefPaymentHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
