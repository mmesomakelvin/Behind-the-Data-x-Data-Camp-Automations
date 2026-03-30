const AI_AGENTS_ACCEPTED_DISCORD_LINK = "https://discord.gg/4mhSUaeTM";
const AI_AGENTS_ACCEPTED_COMPLIANCE_LINK = "https://docs.google.com/document/d/1_Nw_-GE94NsH2VoIaWcJ32NMcgtbXg17jX9I9FdrtWE/edit?usp=sharing";
const AI_AGENTS_ACCEPTED_FORM_LINK = "https://docs.google.com/forms/d/e/1FAIpQLSeFfwQhzVgzRAA4NPNJhpn7Rk9a-2yzaJaBMP0klqIh-_vigQ/viewform?usp=publish-editor";

function getAiAgentsAcceptedEmailHtml(fullName) {
  const firstName = escapeAiAgentsHtml_(getAiAgentsFirstName_(fullName));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accepted into the Applied AI Development Bootcamp</title>
</head>
<body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background:#111827;padding:24px 20px;text-align:center;">
              <img src="${AI_AGENTS_LOGO_URL}" alt="Behind the Data Academy" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px 10px 28px;">
              <p style="margin:0 0 14px 0;font-size:18px;line-height:1.6;color:#111827;">Hello ${firstName},</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;"><strong>Congratulations.</strong> You have been accepted into the Applied AI Development Bootcamp.</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">We received strong applications, and your profile stood out during the review process. We are pleased to welcome you into this cohort.</p>
              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.75;color:#374151;">To secure your place and stay aligned with the program expectations, complete the next steps below as soon as possible.</p>

              <h3 style="margin:0 0 10px 0;font-size:17px;color:#111827;">Next Steps</h3>
              <ul style="margin:0 0 18px 20px;padding:0;color:#374151;font-size:14px;line-height:1.8;">
                <li>Join the official Discord community for announcements and onboarding updates.</li>
                <li>Read the compliance document carefully so you understand the program standards and expectations.</li>
                <li>Complete the cohort acceptance form to confirm your place.</li>
              </ul>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;border:1px solid #e5e7eb;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;width:34%;">Discord Community</td>
                  <td style="padding:10px 12px;font-size:14px;"><a href="${AI_AGENTS_ACCEPTED_DISCORD_LINK}" style="color:#2563eb;text-decoration:underline;">Join Discord</a></td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;">Compliance Document</td>
                  <td style="padding:10px 12px;font-size:14px;"><a href="${AI_AGENTS_ACCEPTED_COMPLIANCE_LINK}" style="color:#2563eb;text-decoration:underline;">Review compliance document</a></td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;">Acceptance Form</td>
                  <td style="padding:10px 12px;font-size:14px;"><a href="${AI_AGENTS_ACCEPTED_FORM_LINK}" style="color:#2563eb;text-decoration:underline;">Complete acceptance form</a></td>
                </tr>
              </table>

              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">Please complete these steps promptly so you do not miss important instructions for onboarding and program kickoff.</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">We are excited to have you in the cohort and look forward to what you will build.</p>
              <p style="margin:0;font-size:15px;line-height:1.75;color:#374151;">Welcome to the program.</p>
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

function getAiAgentsAcceptedEmailPlainText(fullName) {
  const firstName = getAiAgentsFirstName_(fullName);

  return "Hello " + firstName + ",\n\n" +
    "Congratulations. You have been accepted into the Applied AI Development Bootcamp.\n\n" +
    "We received strong applications, and your profile stood out during the review process. We are pleased to welcome you into this cohort.\n\n" +
    "Please complete these next steps as soon as possible:\n" +
    "- Join the official Discord community: " + AI_AGENTS_ACCEPTED_DISCORD_LINK + "\n" +
    "- Read the compliance document: " + AI_AGENTS_ACCEPTED_COMPLIANCE_LINK + "\n" +
    "- Complete the cohort acceptance form: " + AI_AGENTS_ACCEPTED_FORM_LINK + "\n\n" +
    "Please complete these steps promptly so you do not miss important instructions for onboarding and program kickoff.\n\n" +
    "We are excited to have you in the cohort and look forward to what you will build.\n\n" +
    "Welcome to the program.\n\n" +
    "Warm regards,\n" +
    "Ayoade Adegbite\n" +
    "Behind the Data Academy";
}
