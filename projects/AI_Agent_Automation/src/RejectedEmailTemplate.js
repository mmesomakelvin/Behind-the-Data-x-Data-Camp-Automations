function getAiAgentsRejectedEmailHtml(fullName) {
  const firstName = escapeAiAgentsHtml_(getAiAgentsFirstName_(fullName));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f5f9;font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td align="center" style="background-color:#111827;padding:24px 20px;">
              <img src="${AI_AGENTS_LOGO_URL}" alt="Behind the Data Academy" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;">
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px 24px 28px;">
              <p style="margin:0 0 16px 0;font-size:18px;line-height:1.5;color:#111827;">Hello ${firstName},</p>

              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#374151;">
                Thank you for taking the time to apply to the <strong>Applied AI Development Bootcamp</strong> by <strong>Behind the Data Academy</strong>.
              </p>

              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#374151;">
                After carefully reviewing your application, we regret to inform you that you were not selected for this cohort. Due to limited slots, we are unable to admit all qualified applicants at this time.
              </p>

              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#374151;">
                This decision is not a reflection of your potential. We received many strong applications, and the final selection was highly competitive.
              </p>

              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#374151;">
                We appreciate your interest in the program and encourage you to keep building your skills and watch out for future opportunities from Behind the Data Academy.
              </p>

              <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;">
                We wish you the very best in your learning journey.
              </p>
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

function getAiAgentsRejectedPlainText(fullName) {
  const firstName = getAiAgentsFirstName_(fullName);

  return `Hello ${firstName},

Thank you for taking the time to apply to the Applied AI Development Bootcamp by Behind the Data Academy.

After carefully reviewing your application, we regret to inform you that you were not selected for this cohort. Due to limited slots, we are unable to admit all qualified applicants at this time.

This decision is not a reflection of your potential. We received many strong applications, and the final selection was highly competitive.

We appreciate your interest in the program and encourage you to keep building your skills and watch out for future opportunities from Behind the Data Academy.

We wish you the very best in your learning journey.

Warm regards,
Ayoade Adegbite
Behind the Data Academy`;
}
