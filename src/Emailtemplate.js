/**
 * =============================================
 * BEHIND THE DATA ACADEMY - EMAIL TEMPLATE
 * File 2 of 2: EmailTemplate.gs
 * =============================================
 */

const LOGO_URL = "https://drive.google.com/uc?export=view&id=1_evR_u0vLNwFUdDE4xkAeLKDE0DCmwA3";

function getEmailHTML(fullName) {
  const firstName = fullName.split(" ")[0];
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background-color: #1e2a38; padding: 30px; text-align: center;">
              <img src="${LOGO_URL}" alt="Behind The Data Academy" width="180" style="display: block; margin: 0 auto;" />
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1e2a38; font-size: 20px;">Hi ${firstName},</h2>
              
              <p style="margin: 0 0 15px 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                Thanks for registering for the program!
              </p>
              
              <p style="margin: 0 0 15px 0; color: #4a5568; font-size: 15px; line-height: 1.6;">
                Please join our official Discord community—it's an essential part of the program. This is where we'll share important updates, resources, announcements, and support throughout the cohort.
              </p>
              
              <!-- Discord Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
                <tr>
                  <td align="center">
                    <a href="https://discord.gg/yKcVn5m4yt" style="display: inline-block; background-color: #5865F2; color: #ffffff; text-decoration: none; padding: 14px 30px; border-radius: 6px; font-weight: bold; font-size: 15px;">
                      Join Discord Community
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Instructions Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7fafc; border-left: 4px solid #1e2a38; margin: 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #1e2a38; font-size: 14px; font-weight: bold;">Once you join:</p>
                    <p style="margin: 0 0 8px 0; color: #4a5568; font-size: 14px; line-height: 1.5;">&#10003; Check the <strong>welcome/announcements</strong> channel first</p>
                    <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.5;">&#10003; Introduce yourself in the <strong>introductions</strong> channel (your full name, where you're joining from, and what you hope to learn)</p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0 0; color: #e53e3e; font-size: 14px; font-weight: 500;">
                Kindly join today so you don't miss any important information.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1e2a38; padding: 25px 30px; text-align: center;">
              <p style="margin: 0 0 5px 0; color: #ffffff; font-size: 14px;">Best regards,</p>
              <p style="margin: 0 0 15px 0; color: #ffffff; font-size: 15px; font-weight: bold;">Ayoade Adegbite</p>
              <p style="margin: 0; color: #a0aec0; font-size: 13px;">Behind The Data Team</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function getPlainText(fullName) {
  const firstName = fullName.split(" ")[0];
  
  return `Hi ${firstName},

Thanks for registering for the program!

Please join our official Discord community here: https://discord.gg/yKcVn5m4yt

Discord is an essential part of the program—this is where we'll share important updates, resources, announcements, and support throughout the cohort.

Once you join:
- Check the welcome/announcements channel first
- Introduce yourself in the introductions channel (your full name, where you're joining from, and what you hope to learn)

Kindly join today so you don't miss any important information.

Best regards,
Ayoade Adegbite
Behind The Data Team`;
}

const ACCEPTANCE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfqr5JO36Vo1R-HPTih64GFVGdoMBeXYPb2wcaq6yHZfmRCyg/viewform";
const ACCEPTANCE_COMPLIANCE_DOC_URL = "https://docs.google.com/document/d/1r5aKeScDitYzioKv7fuBS3XWIEL9nXRzQKgSipVSzKM/edit?tab=t.0";
const ACCEPTANCE_PAYMENT_DEADLINE = "Thursday, 12 February 2026";

function getAcceptanceEmailHTML(fullName) {
  const firstName = getEmailFirstName_(fullName);
  const safeFirstName = escapeEmailTemplateHtml_(firstName);
  const safeFormUrl = escapeEmailTemplateHtml_(ACCEPTANCE_FORM_URL);
  const safeComplianceDocUrl = escapeEmailTemplateHtml_(ACCEPTANCE_COMPLIANCE_DOC_URL);
  const safeDeadline = escapeEmailTemplateHtml_(ACCEPTANCE_PAYMENT_DEADLINE);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acceptance Email</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f5f9;font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background-color:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td align="center" style="background-color:#111827;padding:24px 20px;">
              <img src="${LOGO_URL}" alt="Behind the Data Academy" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;">
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px 24px 28px;">
              <p style="margin:0 0 16px 0;font-size:18px;line-height:1.5;color:#111827;">Hello ${safeFirstName},</p>
              <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#374151;">
                We are happy to let you know that you have been accepted into the <strong>Analytics Engineering Fellowship</strong> by <strong>Behind the Data Academy</strong>, powered by <strong>DataCamp Donate</strong>.
              </p>
              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.7;color:#374151;">
                Your application stood out for its clarity, intent, and alignment with what this fellowship is designed to achieve: building strong analytics engineers who can transform data into reliable, decision-ready assets.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 20px 0;background:#f9fafb;border:1px solid #e5e7eb;border-left:4px solid #4338ca;">
                <tr>
                  <td style="padding:16px 16px;">
                    <p style="margin:0;font-size:14px;line-height:1.6;color:#1f2937;">
                      To secure your spot, please complete the next steps <strong>on or before ${safeDeadline}</strong>.
                    </p>
                  </td>
                </tr>
              </table>

              <h3 style="margin:0 0 10px 0;font-size:16px;color:#111827;">What happens next</h3>
              <ol style="margin:0 0 18px 18px;padding:0;color:#374151;font-size:14px;line-height:1.8;">
                <li>Confirm your participation via the cohort acceptance form.</li>
                <li>Pay the NGN 30,100 refundable commitment deposit:
                  <ul style="margin:8px 0 0 16px;padding:0;line-height:1.7;">
                    <li>NGN 30,000 will be refunded upon successful completion.</li>
                    <li>NGN 100 covers processing fees.</li>
                  </ul>
                </li>
              </ol>

              <h3 style="margin:0 0 10px 0;font-size:16px;color:#111827;">Payment details</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px 0;border:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;width:38%;">Account Name</td>
                  <td style="padding:10px 12px;font-size:14px;color:#111827;font-weight:600;">BEHIND THE DATA LTD</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;">Account Number</td>
                  <td style="padding:10px 12px;font-size:14px;color:#111827;font-weight:600;">1308690832</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;">Bank</td>
                  <td style="padding:10px 12px;font-size:14px;color:#111827;font-weight:600;">Providus Bank</td>
                </tr>
              </table>

              <h3 style="margin:0 0 10px 0;font-size:16px;color:#111827;">After payment</h3>
              <p style="margin:0 0 18px 0;font-size:14px;line-height:1.7;color:#374151;">
                After payment, open the compliance document, make a copy, fill and sign it, then download it. Use the cohort acceptance form to submit your details and upload the signed compliance document. Please read all instructions carefully before submitting.
              </p>
              <p style="margin:0 0 18px 0;font-size:13px;line-height:1.7;color:#6b7280;">
                If you have already received this email before and have made payment, please ignore this message.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;">
                <tr>
                  <td align="center">
                    <a href="${ACCEPTANCE_FORM_URL}" style="display:inline-block;background:#4338ca;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-size:14px;font-weight:600;">
                      Complete Cohort Acceptance Form
                    </a>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px 0;">
                <tr>
                  <td align="center">
                    <a href="${ACCEPTANCE_COMPLIANCE_DOC_URL}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-size:14px;font-weight:600;">
                      Open Compliance Document
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 10px 0;font-size:12px;line-height:1.6;color:#6b7280;">
                If the button does not open, copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 18px 0;font-size:12px;line-height:1.6;word-break:break-all;">
                <a href="${ACCEPTANCE_FORM_URL}" style="color:#4338ca;text-decoration:underline;">${safeFormUrl}</a>
              </p>
              <p style="margin:0 0 10px 0;font-size:12px;line-height:1.6;color:#6b7280;">
                Compliance document link:
              </p>
              <p style="margin:0 0 18px 0;font-size:12px;line-height:1.6;word-break:break-all;">
                <a href="${ACCEPTANCE_COMPLIANCE_DOC_URL}" style="color:#0f766e;text-decoration:underline;">${safeComplianceDocUrl}</a>
              </p>

              <p style="margin:0;font-size:14px;line-height:1.7;color:#374151;">
                We are excited to have you join this cohort and look forward to working with you. If you have any questions, simply reply to this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#111827;padding:22px 28px;color:#d1d5db;">
              <p style="margin:0 0 4px 0;font-size:13px;">Welcome aboard,</p>
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

function getAcceptancePlainText(fullName) {
  const firstName = getEmailFirstName_(fullName);

  return `Hello ${firstName},

We are happy to let you know that you have been accepted into the Analytics Engineering Fellowship by Behind the Data Academy, powered by DataCamp Donate.

Your application stood out for its clarity, intent, and alignment with what this fellowship is designed to achieve.

To secure your spot, please complete the following on or before ${ACCEPTANCE_PAYMENT_DEADLINE}:
1) Confirm your participation via the cohort acceptance form.
2) Pay the NGN 30,100 refundable commitment deposit.
   - NGN 30,000 will be refunded upon successful completion.
   - NGN 100 covers processing fees.

Payment details:
Account Name: BEHIND THE DATA LTD
Account Number: 1308690832
Bank: Providus Bank

After payment, open the compliance document, make a copy, fill and sign it, then download it. Use the cohort acceptance form to submit your details and upload the signed compliance document.
If you have already received this email before and have made payment, please ignore this message.

Cohort Acceptance Form:
${ACCEPTANCE_FORM_URL}

Compliance Document (make a copy, fill, sign, and download):
${ACCEPTANCE_COMPLIANCE_DOC_URL}

We are excited to have you join this cohort. If you have any questions, simply reply to this email.

Welcome aboard,
Ayoade Adegbite
Behind the Data Academy`;
}

function getEmailFirstName_(fullName) {
  const text = String(fullName || "").trim();
  if (!text) return "there";
  return text.split(/\s+/)[0];
}

function escapeEmailTemplateHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
