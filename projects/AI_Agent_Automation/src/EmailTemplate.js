const AI_AGENTS_LOGO_URL = "https://drive.google.com/uc?export=view&id=1_evR_u0vLNwFUdDE4xkAeLKDE0DCmwA3";
const AI_AGENTS_ACCEPTANCE_FORM_LINK = "https://docs.google.com/document/d/1u_e0feYXyilR5StvcN1POF_vgfGaGiBvT1CP0DZRxok/edit?usp=sharing";
const AI_AGENTS_COMPLIANCE_LINK = "https://docs.google.com/document/d/1u_e0feYXyilR5StvcN1POF_vgfGaGiBvT1CP0DZRxok/edit?usp=sharing";

function getAiAgentsAcceptanceEmailHtml(fullName) {
  const firstName = escapeAiAgentsHtml_(getAiAgentsFirstName_(fullName));
  const safeAcceptanceLink = escapeAiAgentsHtml_(AI_AGENTS_ACCEPTANCE_FORM_LINK);
  const safeComplianceLink = escapeAiAgentsHtml_(AI_AGENTS_COMPLIANCE_LINK);

  return "<!DOCTYPE html>" +
    "<html><head>" +
    "<meta charset=\"UTF-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
    "<title>Applied AI Development Bootcamp Scholarship</title>" +
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
                "<p style=\"margin:0 0 16px 0;font-size:18px;line-height:1.5;color:#111827;\">Hello " + firstName + ",</p>" +
                "<p style=\"margin:0 0 14px 0;font-size:15px;line-height:1.75;color:#374151;\">" +
                  "We are excited to let you know that you have been accepted into the <strong>Applied AI Development Bootcamp Scholarship</strong> by <strong>Behind the Data Academy</strong>, powered by <strong>DataCamp Donates</strong>." +
                "</p>" +
                "<p style=\"margin:0 0 18px 0;font-size:15px;line-height:1.75;color:#374151;\">" +
                  "Your application stood out for its clarity, intent, and alignment with what this cohort is designed to achieve: helping you go <strong>from API basics to deploying real-world AI agents</strong>." +
                "</p>" +

                "<h3 style=\"margin:0 0 10px 0;font-size:16px;color:#111827;\">What you will learn</h3>" +
                "<ul style=\"margin:0 0 20px 20px;padding:0;color:#374151;font-size:14px;line-height:1.8;\">" +
                  "<li>APIs and LLMs</li>" +
                  "<li>Agent Development</li>" +
                  "<li>Development and Monitoring</li>" +
                "</ul>" +

                "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 0 20px 0;background:#f8fafc;border:1px solid #e5e7eb;border-left:4px solid #1d4ed8;\">" +
                  "<tr><td style=\"padding:14px 14px;\">" +
                    "<p style=\"margin:0;font-size:14px;line-height:1.7;color:#1f2937;\"><strong>Next steps:</strong> complete the items below within <strong>72 hours</strong> to secure your spot.</p>" +
                  "</td></tr>" +
                "</table>" +

                "<h3 style=\"margin:0 0 10px 0;font-size:16px;color:#111827;\">1) Pay the NGN 30,100 refundable commitment deposit</h3>" +
                "<ul style=\"margin:0 0 14px 20px;padding:0;color:#374151;font-size:14px;line-height:1.7;\">" +
                  "<li>NGN 30,000 will be refunded upon successful completion.</li>" +
                  "<li>NGN 100 covers processing fees.</li>" +
                "</ul>" +

                "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-collapse:collapse;margin:0 0 20px 0;border:1px solid #e5e7eb;\">" +
                  "<tr>" +
                    "<td style=\"padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;width:40%;\">Account Name</td>" +
                    "<td style=\"padding:10px 12px;font-size:14px;color:#111827;font-weight:600;\">BEHIND THE DATA LTD</td>" +
                  "</tr>" +
                  "<tr>" +
                    "<td style=\"padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;\">Account Number</td>" +
                    "<td style=\"padding:10px 12px;font-size:14px;color:#111827;font-weight:600;\">1308690832</td>" +
                  "</tr>" +
                  "<tr>" +
                    "<td style=\"padding:10px 12px;background:#f9fafb;font-size:13px;color:#6b7280;\">Bank</td>" +
                    "<td style=\"padding:10px 12px;font-size:14px;color:#111827;font-weight:600;\">Providus Bank</td>" +
                  "</tr>" +
                "</table>" +

                "<h3 style=\"margin:0 0 10px 0;font-size:16px;color:#111827;\">2) Sign the Compliance Document</h3>" +
                "<p style=\"margin:0 0 12px 0;font-size:14px;line-height:1.7;color:#374151;\">" +
                  "Please make a copy, sign, and download it. Read through carefully so you understand what is expected." +
                "</p>" +
                "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 0 16px 0;\"><tr><td align=\"center\">" +
                  "<a href=\"" + AI_AGENTS_COMPLIANCE_LINK + "\" style=\"display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-size:14px;font-weight:600;\">Open Compliance Document</a>" +
                "</td></tr></table>" +

                "<h3 style=\"margin:0 0 10px 0;font-size:16px;color:#111827;\">3) Complete the Cohort Acceptance Form and upload your signed compliance document</h3>" +
                "<table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin:0 0 16px 0;\"><tr><td align=\"center\">" +
                  "<a href=\"" + AI_AGENTS_ACCEPTANCE_FORM_LINK + "\" style=\"display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:6px;font-size:14px;font-weight:600;\">Open Acceptance Form</a>" +
                "</td></tr></table>" +

                "<p style=\"margin:0 0 8px 0;font-size:12px;line-height:1.6;color:#6b7280;\">If any button does not open, use these direct links:</p>" +
                "<p style=\"margin:0 0 16px 0;font-size:12px;line-height:1.6;word-break:break-all;\"><a href=\"" + AI_AGENTS_COMPLIANCE_LINK + "\" style=\"color:#7c3aed;\">" + safeComplianceLink + "</a></p>" +
                "<p style=\"margin:0 0 16px 0;font-size:12px;line-height:1.6;word-break:break-all;\"><a href=\"" + AI_AGENTS_ACCEPTANCE_FORM_LINK + "\" style=\"color:#0f766e;\">" + safeAcceptanceLink + "</a></p>" +

                "<p style=\"margin:0;font-size:14px;line-height:1.75;color:#374151;\">" +
                  "We are excited to have you join this cohort and look forward to working with you over the next few months. If you have any questions, simply reply to this email." +
                "</p>" +
              "</td>" +
            "</tr>" +
            "<tr>" +
              "<td style=\"background:#111827;padding:22px 28px;color:#d1d5db;\">" +
                "<p style=\"margin:0 0 5px 0;font-size:13px;\">Welcome aboard,</p>" +
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

  return "Hello " + firstName + ",\n\n" +
    "We are excited to let you know that you have been accepted into the Applied AI Development Bootcamp Scholarship by Behind the Data Academy, powered by DataCamp Donates.\n\n" +
    "Your application stood out for its clarity, intent, and alignment with what this cohort is designed to achieve: helping you go from API basics to deploying real-world AI agents.\n\n" +
    "What you will learn:\n" +
    "- APIs and LLMs\n" +
    "- Agent Development\n" +
    "- Development and Monitoring\n\n" +
    "Next steps (complete within 72 hours to secure your spot):\n" +
    "1) Pay the NGN 30,100 refundable commitment deposit\n" +
    "- NGN 30,000 will be refunded upon successful completion\n" +
    "- NGN 100 covers processing fees\n\n" +
    "Payment details:\n" +
    "Account Name: BEHIND THE DATA LTD\n" +
    "Account Number: 1308690832\n" +
    "Bank: Providus Bank\n\n" +
    "2) Sign the Compliance Document:\n" +
    AI_AGENTS_COMPLIANCE_LINK + "\n\n" +
    "Please make a copy, sign, and download it.\n\n" +
    "3) Complete the Cohort Acceptance Form and upload your signed compliance document:\n" +
    AI_AGENTS_ACCEPTANCE_FORM_LINK + "\n\n" +
    "We are excited to have you join this cohort and look forward to working with you over the next few months. If you have any questions, simply reply to this email.\n\n" +
    "Welcome aboard,\n" +
    "Ayoade Adegbite\n" +
    "Behind the Data Academy";
}

function getAiAgentsPhoneMessage(fullName) {
  const firstName = getAiAgentsFirstName_(fullName);
  return "Hello " + firstName + ", congratulations. You have been accepted into the Applied AI Development Bootcamp Scholarship by Behind the Data Academy. Check your email now for next steps and payment details.";
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
