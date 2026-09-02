var AEF_PAYMENT_ONBOARDING_LOGO_URL =
  "https://drive.google.com/uc?export=view&id=1_evR_u0vLNwFUdDE4xkAeLKDE0DCmwA3";
var AEF_PAYMENT_ONBOARDING_WHATSAPP_URL =
  "https://chat.whatsapp.com/BEZrwguJ3qdEnPNzX3hlfV";
var AEF_PAYMENT_ONBOARDING_MEET_URL =
  "https://meet.google.com/xgv-wmoa-bja";

function getAefPaymentOnboardingEmailHtml(fullName) {
  const firstName = escapeAefPaymentHtml_(getAefPaymentFirstName_(fullName));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AEF Cohort 2 Onboarding</title>
</head>
<body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background:#0f2747;padding:24px 20px;text-align:center;">
              <img src="${AEF_PAYMENT_ONBOARDING_LOGO_URL}" alt="Behind the Data Academy" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px 20px 28px;">
              <p style="margin:0 0 14px;font-size:18px;line-height:1.6;color:#111827;">Hello ${firstName},</p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.75;color:#374151;">Welcome to the <strong>Analytics Engineering Fellowship Cohort 2</strong>. Your payment has been confirmed and your place is secured.</p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.75;color:#374151;">Please join the official WhatsApp group now. Important fellowship announcements and updates will be shared there.</p>

              <p style="margin:0 0 22px;text-align:center;">
                <a href="${AEF_PAYMENT_ONBOARDING_WHATSAPP_URL}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 22px;border-radius:6px;">Join the WhatsApp Group</a>
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;background:#eff6ff;border-left:4px solid #2563eb;">
                <tr>
                  <td style="padding:16px 18px;color:#1e3a8a;font-size:14px;line-height:1.8;">
                    <p style="margin:0 0 6px;font-weight:700;">Webinar Day — AEF Cohort 2</p>
                    <p style="margin:0;"><strong>Date:</strong> Saturday, 5 September 2026</p>
                    <p style="margin:0;"><strong>Time:</strong> 4:00 PM – 5:00 PM</p>
                    <p style="margin:0;"><strong>Time zone:</strong> Africa/Lagos</p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 18px;text-align:center;">
                <a href="${AEF_PAYMENT_ONBOARDING_MEET_URL}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 22px;border-radius:6px;">Join the Onboarding Webinar</a>
              </p>

              <p style="margin:0 0 12px;font-size:15px;line-height:1.75;color:#374151;"><strong>Programme access will be provided after the onboarding session.</strong></p>
              <p style="margin:0 0 12px;font-size:15px;line-height:1.75;color:#374151;">Please do not share the WhatsApp group or Google Meet links outside the fellowship.</p>
              <p style="margin:0;font-size:15px;line-height:1.75;color:#374151;">We look forward to welcoming you on Saturday.</p>
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

function getAefPaymentOnboardingEmailPlainText(fullName) {
  const firstName = getAefPaymentFirstName_(fullName);

  return "Hello " + firstName + ",\n\n" +
    "Welcome to the Analytics Engineering Fellowship Cohort 2. Your payment has been confirmed and your place is secured.\n\n" +
    "Please join the official WhatsApp group now:\n" +
    AEF_PAYMENT_ONBOARDING_WHATSAPP_URL + "\n\n" +
    "Webinar Day - AEF Cohort 2\n" +
    "Date: Saturday, 5 September 2026\n" +
    "Time: 4:00 PM - 5:00 PM\n" +
    "Time zone: Africa/Lagos\n" +
    "Google Meet: " + AEF_PAYMENT_ONBOARDING_MEET_URL + "\n\n" +
    "Programme access will be provided after the onboarding session.\n\n" +
    "Please do not share the WhatsApp group or Google Meet links outside the fellowship.\n\n" +
    "We look forward to welcoming you on Saturday.\n\n" +
    "Warm regards,\n" +
    "Ayoade Adegbite\n" +
    "Behind the Data Academy";
}
