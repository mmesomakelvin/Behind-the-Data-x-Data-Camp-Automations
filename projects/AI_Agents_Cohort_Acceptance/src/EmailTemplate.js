const PAYMENT_CONFIRMATION_LOGO_URL = "https://drive.google.com/uc?export=view&id=1_evR_u0vLNwFUdDE4xkAeLKDE0DCmwA3";

function getPaymentConfirmationEmailHtml(fullName) {
  const firstName = escapePaymentConfirmationHtml_(getPaymentConfirmationFirstName_(fullName));

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
            <td style="background:#111827;padding:24px 20px;text-align:center;">
              <img src="${PAYMENT_CONFIRMATION_LOGO_URL}" alt="Behind the Data Academy" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px 16px 28px;">
              <p style="margin:0 0 14px 0;font-size:18px;line-height:1.6;color:#111827;">Hello ${firstName},</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">This is to confirm that we have reviewed and confirmed your commitment-fee payment for the <strong>Applied AI Development Bootcamp</strong>.</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">Your payment has been recorded successfully, and your place in the cohort remains secured.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;background:#ecfdf5;border-left:4px solid #059669;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0;font-size:14px;line-height:1.75;color:#065f46;"><strong>Status:</strong> Payment confirmed</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">Please keep an eye on your email and community channels for the next onboarding and program updates from our team.</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">If you have any questions or need support, reply to this email or contact <a href="mailto:hello@behindthedata.tech" style="color:#2563eb;">hello@behindthedata.tech</a>.</p>
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

function getPaymentConfirmationEmailPlainText(fullName) {
  const firstName = getPaymentConfirmationFirstName_(fullName);

  return "Hello " + firstName + ",\n\n" +
    "This is to confirm that we have reviewed and confirmed your commitment-fee payment for the Applied AI Development Bootcamp.\n\n" +
    "Your payment has been recorded successfully, and your place in the cohort remains secured.\n\n" +
    "Please keep an eye on your email and community channels for the next onboarding and program updates from our team.\n\n" +
    "If you have any questions or need support, reply to this email or contact hello@behindthedata.tech.\n\n" +
    "We look forward to having you in the cohort.\n\n" +
    "Warm regards,\n" +
    "Ayoade Adegbite\n" +
    "Behind the Data Academy";
}

function getPaymentConfirmationFirstName_(fullName) {
  const clean = String(fullName || "").trim();
  if (!clean) {
    return "there";
  }
  return clean.split(/\s+/)[0];
}

function escapePaymentConfirmationHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
