var AEF_PAYMENT_RECEIVED_LOGO_URL =
  "https://drive.google.com/uc?export=view&id=1_evR_u0vLNwFUdDE4xkAeLKDE0DCmwA3";

function getAefPaymentReceivedEmailHtml(fullName) {
  const firstName = escapeAefPaymentHtml_(getAefPaymentFirstName_(fullName));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Evidence Received</title>
</head>
<body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background:#0f2747;padding:24px 20px;text-align:center;">
              <img src="${AEF_PAYMENT_RECEIVED_LOGO_URL}" alt="Behind the Data Academy" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px 20px 28px;">
              <p style="margin:0 0 14px;font-size:18px;line-height:1.6;color:#111827;">Hello ${firstName},</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.75;color:#374151;">Your acceptance form and payment evidence have been received for the <strong>Analytics Engineering Fellowship Cohort 2</strong>.</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.75;color:#374151;">Your payment evidence is currently under review. We will send you another email after the verification is complete.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;background:#eff6ff;border-left:4px solid #2563eb;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0;font-size:14px;line-height:1.75;color:#1e3a8a;"><strong>Important:</strong> This message confirms receipt only. It is not a payment confirmation.</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.75;color:#374151;">You do not need to submit the form again unless our team contacts you.</p>
              <p style="margin:0;font-size:15px;line-height:1.75;color:#374151;">If you need support, reply to this email or contact <a href="mailto:hello@behindthedata.tech" style="color:#2563eb;">hello@behindthedata.tech</a>.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#0f2747;padding:22px 28px;color:#d1d5db;">
              <p style="margin:0 0 4px;font-size:13px;">Warm regards,</p>
              <p style="margin:0 0 2px;font-size:14px;color:#ffffff;font-weight:600;">Ayoade Adegbite</p>
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

function getAefPaymentReceivedEmailPlainText(fullName) {
  const firstName = getAefPaymentFirstName_(fullName);

  return "Hello " + firstName + ",\n\n" +
    "Your acceptance form and payment evidence have been received for the Analytics Engineering Fellowship Cohort 2.\n\n" +
    "Your payment evidence is currently under review. We will send you another email after the verification is complete.\n\n" +
    "Important: This message confirms receipt only. It is not a payment confirmation.\n\n" +
    "You do not need to submit the form again unless our team contacts you.\n\n" +
    "If you need support, reply to this email or contact hello@behindthedata.tech.\n\n" +
    "Warm regards,\n" +
    "Ayoade Adegbite\n" +
    "Behind the Data Academy";
}
