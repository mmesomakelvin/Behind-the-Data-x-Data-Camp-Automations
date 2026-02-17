/**
 * Onboarding email template.
 * Reuses the company logo URL from Reg_Automations.
 */
const ONBOARDING_LOGO_URL = "https://drive.google.com/uc?export=view&id=1_evR_u0vLNwFUdDE4xkAeLKDE0DCmwA3";
const ONBOARDING_MEETING_URL = "https://meet.google.com/gwz-rqzf-dko";
const ONBOARDING_CAMPAIGN_URL = "https://getdp.co/v1G";
const ONBOARDING_DISCORD_URL = "https://discord.gg/PnYUGxyd";
const ONBOARDING_RESOURCES_URL = "https://drive.google.com/drive/folders/1NZ6ade-UgNxtl8xqj5MYB7P8S-d8i-C1?usp=sharing";
const ONBOARDING_REPORTING_FORM_URL = "https://forms.gle/fyK3pA6uWsiE8uZ2A";
const ONBOARDING_SCHEDULE_URL = "https://docs.google.com/spreadsheets/d/1VKVKdF8PS5gM4TkrJvGG6AyMdBQFfZRYtvuyY2ZSMWI/edit?usp=sharing";

function getOnboardingEmailHtml(firstName) {
  var safeFirstName = escapeOnboardingHtml_(firstName || "Fellow");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alpha Cohort Onboarding</title>
</head>
<body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f9;padding:24px 12px;">
    <tr>
      <td align="center">
        <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">
          <tr>
            <td style="background:#111827;padding:24px 20px;text-align:center;">
              <img src="${ONBOARDING_LOGO_URL}" alt="Behind the Data Academy" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding:30px 28px 10px 28px;">
              <p style="margin:0 0 14px 0;font-size:18px;line-height:1.6;color:#111827;">Hello ${safeFirstName} &#128075;,</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">We are officially in countdown mode.</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">You are part of the <strong>Alpha Cohort</strong> of the Analytics Engineering Fellowship at Behind the Data Academy, our founding group.</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">The Beta cohort will be onboarded later, but you are going first. And that matters.</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">Choosing to join the Alpha cohort is a strategic decision. By the time you enter Month 3, you will already be building real-world projects and completing your mini capstone.</p>
              <p style="margin:0 0 18px 0;font-size:15px;line-height:1.75;color:#374151;">Many organizations finalize budgets early in the year and begin executing new initiatives in Q2. While others are still learning, you will already be shipping projects.</p>

              <h3 style="margin:0 0 10px 0;font-size:17px;color:#111827;">Onboarding Session Details</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;border:1px solid #e5e7eb;border-collapse:collapse;">
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;width:34%;">Date</td>
                  <td style="padding:10px 12px;font-size:14px;color:#111827;font-weight:600;">Saturday, February 21, 2026</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;">Time</td>
                  <td style="padding:10px 12px;font-size:14px;color:#111827;font-weight:600;">4:00 PM - 7:00 PM (Africa/Lagos)</td>
                </tr>
                <tr>
                  <td style="padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;">Meeting Link</td>
                  <td style="padding:10px 12px;font-size:14px;"><a href="${ONBOARDING_MEETING_URL}" style="color:#2563eb;text-decoration:underline;">${ONBOARDING_MEETING_URL}</a></td>
                </tr>
              </table>

              <p style="margin:0 0 8px 0;font-size:15px;line-height:1.7;color:#374151;">This session is important. We will walk through:</p>
              <ul style="margin:0 0 18px 20px;padding:0;color:#374151;font-size:14px;line-height:1.8;">
                <li>Program structure and expectations</li>
                <li>How the fellowship will run month-to-month</li>
                <li>Tools and platforms you will be using</li>
                <li>Community standards and reporting structure</li>
                <li>What success looks like in this cohort</li>
              </ul>

              <h3 style="margin:0 0 10px 0;font-size:17px;color:#111827;">Announce It, You are In</h3>
              <p style="margin:0 0 10px 0;font-size:15px;line-height:1.7;color:#374151;">Use the campaign page to generate a branded acceptance post:</p>
              <p style="margin:0 0 12px 0;font-size:14px;"><a href="${ONBOARDING_CAMPAIGN_URL}" style="color:#2563eb;text-decoration:underline;">${ONBOARDING_CAMPAIGN_URL}</a></p>
              <p style="margin:0 0 10px 0;font-size:14px;line-height:1.7;color:#374151;">Tag:</p>
              <ul style="margin:0 0 18px 20px;padding:0;color:#374151;font-size:14px;line-height:1.8;">
                <li>Instagram: @behindthedata_school</li>
                <li>LinkedIn: Behind The Data Academy</li>
                <li>Twitter (X): btd_academy</li>
              </ul>

              <h3 style="margin:0 0 10px 0;font-size:17px;color:#111827;">6-Month Program Snapshot</h3>
              <ul style="margin:0 0 18px 20px;padding:0;color:#374151;font-size:14px;line-height:1.8;">
                <li><strong>Months 1-2: Foundations</strong> - SQL, Python, and Cloud Data Warehousing</li>
                <li><strong>Month 3: The Core</strong> - dbt and Data Modeling + Mini Capstone</li>
                <li><strong>Months 4-5: Advanced Ops</strong> - Orchestration, Data Quality, and Semantic Layers</li>
                <li><strong>Month 6: The Finish Line</strong> - Final Capstone Project + Interview Preparation</li>
              </ul>

              <h3 style="margin:0 0 10px 0;font-size:17px;color:#111827;">Important Links (Bookmark These)</h3>
              <ul style="margin:0 0 18px 20px;padding:0;color:#374151;font-size:14px;line-height:1.9;word-break:break-word;">
                <li>Private Discord Cohort: <a href="${ONBOARDING_DISCORD_URL}" style="color:#2563eb;text-decoration:underline;">${ONBOARDING_DISCORD_URL}</a></li>
                <li>Cohort Resources Folder: <a href="${ONBOARDING_RESOURCES_URL}" style="color:#2563eb;text-decoration:underline;">Resources Folder</a></li>
                <li>Monthly Reporting Form: <a href="${ONBOARDING_REPORTING_FORM_URL}" style="color:#2563eb;text-decoration:underline;">${ONBOARDING_REPORTING_FORM_URL}</a></li>
                <li>Full Program Schedule: <a href="${ONBOARDING_SCHEDULE_URL}" style="color:#2563eb;text-decoration:underline;">Program Schedule</a></li>
              </ul>

              <h3 style="margin:0 0 10px 0;font-size:17px;color:#111827;">Communication Going Forward</h3>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">From today onward, you will hear more frequently from our Program Associates for logistics, reminders, and coordination.</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">Discord will be our primary communication channel for structured updates and faster responses, so ensure you have joined.</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">You can also reach us via email at <a href="mailto:hello@behindthedata.tech" style="color:#2563eb;">hello@behindthedata.tech</a> and copy <a href="mailto:behindthedata8@gmail.com" style="color:#2563eb;">behindthedata8@gmail.com</a>.</p>
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">We cannot wait to welcome you live on Saturday and officially kick off this cohort.</p>
              <p style="margin:0;font-size:15px;line-height:1.75;color:#374151;">See you at onboarding.</p>
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

function getOnboardingEmailPlainText(firstName) {
  var safeFirstName = firstName || "Fellow";

  return "Hello " + safeFirstName + ",\n\n" +
    "We are officially in countdown mode.\n\n" +
    "You are part of the Alpha Cohort of the Analytics Engineering Fellowship at Behind the Data Academy, our founding group.\n\n" +
    "The Beta cohort will be onboarded later, but you are going first. And that matters.\n\n" +
    "Choosing to join the Alpha cohort is a strategic decision. By Month 3, you will already be building real-world projects and completing your mini capstone.\n\n" +
    "Many organizations finalize budgets early in the year and begin executing new initiatives in Q2. While others are still learning, you will already be shipping projects.\n\n" +
    "Onboarding Session Details\n" +
    "Date: Saturday, February 21, 2026\n" +
    "Time: 4:00 PM - 7:00 PM (Africa/Lagos)\n" +
    "Meeting Link: " + ONBOARDING_MEETING_URL + "\n\n" +
    "This session is important. We will walk through:\n" +
    "- Program structure and expectations\n" +
    "- How the fellowship will run month-to-month\n" +
    "- Tools and platforms you will be using\n" +
    "- Community standards and reporting structure\n" +
    "- What success looks like in this cohort\n\n" +
    "Announce It, You are In\n" +
    "Generate your branded post here: " + ONBOARDING_CAMPAIGN_URL + "\n" +
    "Tag us:\n" +
    "- Instagram: @behindthedata_school\n" +
    "- LinkedIn: Behind The Data Academy\n" +
    "- Twitter (X): btd_academy\n\n" +
    "6-Month Program Snapshot\n" +
    "- Months 1-2: Foundations (SQL, Python, Cloud Data Warehousing)\n" +
    "- Month 3: The Core (dbt and Data Modeling + Mini Capstone)\n" +
    "- Months 4-5: Advanced Ops (Orchestration, Data Quality, Semantic Layers)\n" +
    "- Month 6: The Finish Line (Final Capstone Project + Interview Preparation)\n\n" +
    "Important Links\n" +
    "- Private Discord Cohort: " + ONBOARDING_DISCORD_URL + "\n" +
    "- Cohort Resources Folder: " + ONBOARDING_RESOURCES_URL + "\n" +
    "- Monthly Reporting Form: " + ONBOARDING_REPORTING_FORM_URL + "\n" +
    "- Full Program Schedule: " + ONBOARDING_SCHEDULE_URL + "\n\n" +
    "Communication Going Forward\n" +
    "From today onward, you will hear more frequently from our Program Associates for logistics, reminders, and coordination.\n" +
    "Discord will be our primary communication channel for structured updates and faster responses, so ensure you have joined.\n" +
    "You can also reach us via email at hello@behindthedata.tech and copy behindthedata8@gmail.com.\n\n" +
    "We cannot wait to welcome you live on Saturday and officially kick off this cohort.\n\n" +
    "See you at onboarding.\n\n" +
    "Warm regards,\n" +
    "Ayoade Adegbite\n" +
    "Behind the Data Academy";
}

function getEmailFirstName_(fullName) {
  var raw = String(fullName || "").trim();
  if (!raw) {
    return "Fellow";
  }
  return raw.split(/\s+/)[0];
}

function escapeOnboardingHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}