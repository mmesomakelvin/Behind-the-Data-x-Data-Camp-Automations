var AEF_PAYMENT_ACCESS_LOGO_URL =
  "https://drive.google.com/uc?export=view&id=1_evR_u0vLNwFUdDE4xkAeLKDE0DCmwA3";

function getAefPaymentAccessGrantedEmailHtml(fullName) {
  const firstName = escapeAefPaymentHtml_(getAefPaymentFirstName_(fullName));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AEF Cohort 2 Access Granted</title>
</head>
<body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background:#0f2747;padding:24px 20px;text-align:center;">
              <img src="${AEF_PAYMENT_ACCESS_LOGO_URL}" alt="Behind the Data Academy" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px 22px 28px;">
              <p style="margin:0 0 14px;font-size:18px;line-height:1.6;color:#111827;">Hello ${firstName},</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.75;color:#374151;">The <strong>Analytics Engineering Fellowship Cohort 2 has officially begun</strong>, and your programme access has now been granted.</p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.75;color:#374151;">Please check your email inbox for the access invitation. If you cannot see it, check your spam or promotions folder.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:#eff6ff;border-left:4px solid #2563eb;">
                <tr>
                  <td style="padding:16px 18px;color:#1e3a8a;font-size:15px;line-height:1.75;">
                    <strong>Please accept the invitation within 72 hours.</strong>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:15px;line-height:1.75;color:#374151;">We are excited to have you begin the fellowship with us.</p>
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

function getAefPaymentAccessGrantedEmailPlainText(fullName) {
  const firstName = getAefPaymentFirstName_(fullName);

  return "Hello " + firstName + ",\n\n" +
    "The Analytics Engineering Fellowship Cohort 2 has officially begun, and your programme access has now been granted.\n\n" +
    "Please check your email inbox for the access invitation. If you cannot see it, check your spam or promotions folder.\n\n" +
    "Please accept the invitation within 72 hours.\n\n" +
    "We are excited to have you begin the fellowship with us.\n\n" +
    "Warm regards,\n" +
    "Ayoade Adegbite\n" +
    "Behind the Data Academy";
}
