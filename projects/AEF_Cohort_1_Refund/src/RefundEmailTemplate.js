var AEF_REFUND_LOGO_URL =
  "https://drive.google.com/uc?export=view&id=1_evR_u0vLNwFUdDE4xkAeLKDE0DCmwA3";

function getAefRefundEmailHtml(fullName, hasSubmittedPortfolio) {
  const firstName = escapeAefRefundHtml_(getAefRefundFirstName_(fullName));
  const certificateSection = hasSubmittedPortfolio
    ? '<div style="margin:20px 0 0;padding:16px 18px;background:#ecfdf5;border-left:4px solid #16a34a;color:#14532d;">' +
        '<strong>Certificate update</strong><br>Your certificate will be sent by the weekend.</div>'
    : "";

  return '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<title>AEF Cohort 1 Refund</title></head>' +
    '<body style="margin:0;padding:0;background:#f3f5f9;font-family:Segoe UI,Arial,sans-serif;color:#1f2937;">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f9;padding:24px 12px;"><tr><td align="center">' +
    '<table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;">' +
    '<tr><td style="background:#0f2747;padding:24px 20px;text-align:center;">' +
    '<img src="' + AEF_REFUND_LOGO_URL + '" alt="Behind the Data Academy" width="200" style="display:block;margin:0 auto;max-width:200px;height:auto;"></td></tr>' +
    '<tr><td style="padding:30px 28px;">' +
    '<p style="margin:0 0 16px;font-size:18px;line-height:1.6;color:#111827;">Hello ' + firstName + ',</p>' +
    '<p style="margin:0 0 14px;font-size:15px;line-height:1.75;color:#374151;">' +
    'Your fellowship commitment deposit has been refunded using the account details you submitted.</p>' +
    '<p style="margin:0;font-size:15px;line-height:1.75;color:#374151;">Thank you for being part of the Analytics Engineering Fellowship Cohort 1.</p>' +
    certificateSection +
    '</td></tr><tr><td style="background:#0f2747;padding:22px 28px;color:#d1d5db;">' +
    '<p style="margin:0 0 4px;font-size:13px;">Warm regards,</p>' +
    '<p style="margin:0;font-size:14px;color:#ffffff;font-weight:600;">Behind the Data Academy</p>' +
    '</td></tr></table></td></tr></table></body></html>';
}

function getAefRefundEmailPlainText(fullName, hasSubmittedPortfolio) {
  const firstName = getAefRefundFirstName_(fullName);
  const certificateText = hasSubmittedPortfolio
    ? "\n\nCertificate update: Your certificate will be sent by the weekend."
    : "";

  return "Hello " + firstName + ",\n\n" +
    "Your fellowship commitment deposit has been refunded using the account details you submitted.\n\n" +
    "Thank you for being part of the Analytics Engineering Fellowship Cohort 1." +
    certificateText +
    "\n\nWarm regards,\nBehind the Data Academy";
}

function getAefRefundFirstName_(fullName) {
  const cleaned = String(fullName || "").trim();
  return cleaned ? cleaned.split(/\s+/)[0] : "Participant";
}

function escapeAefRefundHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
