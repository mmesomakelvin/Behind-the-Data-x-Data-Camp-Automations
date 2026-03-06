const AI_AGENTS_LOGO_URL = "https://drive.google.com/uc?export=view&id=1_evR_u0vLNwFUdDE4xkAeLKDE0DCmwA3";
const AI_AGENTS_DISCORD_LINK = "https://discord.com/invite/yKcVn5m4yt";

function getAiAgentsAcceptanceEmailHtml(fullName) {
  const firstName = escapeAiAgentsHtml_(getAiAgentsFirstName_(fullName));
  const safeDiscordLink = escapeAiAgentsHtml_(AI_AGENTS_DISCORD_LINK);

  return "<!DOCTYPE html>" +
    "<html><head>" +
    "<meta charset=\"UTF-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
    "<title>Welcome to the Program</title>" +
    "</head>" +
    "<body style=\"margin:0;padding:0;background:#f3f6fb;font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#1f2937;\">" +
      "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background:#f3f6fb;padding:24px 10px;\">" +
        "<tr><td align=\"center\">" +
          "<table width=\"640\" cellpadding=\"0\" cellspacing=\"0\" style=\"max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;\">" +
            "<tr>" +
              "<td style=\"background:#111827;padding:26px 20px;text-align:center;\">" +
                "<img src=\"" + AI_AGENTS_LOGO_URL + "\" alt=\"Behind the Data Academy\" width=\"210\" style=\"display:block;margin:0 auto;max-width:210px;height:auto;\">" +
              "</td>" +
            "</tr>" +
            "<tr>" +
              "<td style=\"padding:30px 28px 20px 28px;\">" +
                "<p style=\"margin:0 0 14px 0;font-size:18px;line-height:1.5;color:#111827;\">Hi " + firstName + ",</p>" +
                "<p style=\"margin:0 0 14px 0;font-size:15px;line-height:1.75;color:#374151;\"><strong>Thanks for registering for the program!</strong></p>" +
                "<p style=\"margin:0 0 18px 0;font-size:15px;line-height:1.75;color:#374151;\">" +
                  "Please join our official Discord community - it is an essential part of the program. This is where we will share important updates, resources, announcements, and support throughout the cohort." +
                "</p>" +

                "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 0 18px 0;\"><tr><td align=\"center\">" +
                  "<a href=\"" + AI_AGENTS_DISCORD_LINK + "\" style=\"display:inline-block;background:#5865f2;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-size:14px;font-weight:700;\">Join Discord Community</a>" +
                "</td></tr></table>" +

                "<p style=\"margin:0 0 10px 0;font-size:15px;line-height:1.75;color:#374151;\"><strong>Once you join:</strong></p>" +
                "<ul style=\"margin:0 0 18px 20px;padding:0;color:#374151;font-size:14px;line-height:1.8;\">" +
                  "<li>Check the <strong>welcome/announcements</strong> channel first.</li>" +
                  "<li>Introduce yourself in the <strong>introductions</strong> channel (your full name, where you are joining from, and what you hope to learn).</li>" +
                "</ul>" +

                "<p style=\"margin:0 0 10px 0;font-size:15px;line-height:1.75;color:#374151;\">" +
                  "Kindly join today so you do not miss any important information." +
                "</p>" +
                "<p style=\"margin:0;font-size:13px;line-height:1.7;word-break:break-all;\">Discord invite: <a href=\"" + AI_AGENTS_DISCORD_LINK + "\" style=\"color:#1d4ed8;\">" + safeDiscordLink + "</a></p>" +
              "</td>" +
            "</tr>" +
            "<tr>" +
              "<td style=\"background:#111827;padding:22px 28px;color:#d1d5db;\">" +
                "<p style=\"margin:0 0 5px 0;font-size:13px;\">Best regards,</p>" +
                "<p style=\"margin:0 0 2px 0;font-size:14px;color:#ffffff;font-weight:600;\">Ayoade Adegbite</p>" +
                "<p style=\"margin:0;font-size:13px;\">Behind the Data Academy</p>" +
              "</td>" +
            "</tr>" +
          "</table>" +
        "</td></tr>" +
      "</table>" +
    "</body></html>";
}

function getAiAgentsAcceptancePlainText(fullName) {
  const firstName = getAiAgentsFirstName_(fullName);

  return "Hi " + firstName + ",\n\n" +
    "Thanks for registering for the program!\n\n" +
    "Please join our official Discord community - it is an essential part of the program. This is where we will share important updates, resources, announcements, and support throughout the cohort.\n\n" +
    "Join Discord Community:\n" +
    AI_AGENTS_DISCORD_LINK + "\n\n" +
    "Once you join:\n" +
    "- Check the welcome/announcements channel first\n" +
    "- Introduce yourself in the introductions channel (your full name, where you are joining from, and what you hope to learn)\n\n" +
    "Kindly join today so you do not miss any important information.\n\n" +
    AI_AGENTS_DISCORD_LINK + "\n\n" +
    "Best regards,\n" +
    "Ayoade Adegbite\n" +
    "Behind the Data Academy";
}

function getAiAgentsPhoneMessage(fullName) {
  const firstName = getAiAgentsFirstName_(fullName);
  return "Hello " + firstName + ", thanks for registering. Check your email and join the official Discord community today: " + AI_AGENTS_DISCORD_LINK;
}

function getAiAgentsFirstName_(fullName) {
  const clean = String(fullName || "").trim();
  if (!clean) {
    return "there";
  }
  return clean.split(/\s+/)[0];
}

function escapeAiAgentsHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
