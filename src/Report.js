/**
 * =============================================
 * BEHIND THE DATA ACADEMY - REPORT
 * Builds and emails a report using Location Master data.
 * =============================================
 */

const REPORT_CONFIG = {
  recipients: ["mmesomakelvin@gmail.com"],
  locationSheet: "Location Master",
  countryHeader: "Country",
  subject: "Behind The Data - Registration Report",
  includeGeminiSummary: true,
  geminiApiKeyProp: "GEMINI_API_KEY",
  geminiModel: "gemini-1.5-flash"
};

function sendReport() {
  const reportData = buildReportData_();
  const geminiSummary = REPORT_CONFIG.includeGeminiSummary ? generateGeminiSummary_(reportData) : "";
  const html = buildReportHtml_(reportData, geminiSummary);
  const text = buildReportText_(reportData, geminiSummary);

  GmailApp.sendEmail(
    REPORT_CONFIG.recipients.join(","),
    REPORT_CONFIG.subject,
    text,
    { htmlBody: html }
  );

  SpreadsheetApp.getUi().alert("✅ Report sent to: " + REPORT_CONFIG.recipients.join(", "));
}

function buildReportData_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(REPORT_CONFIG.locationSheet);
  if (!sheet) {
    SpreadsheetApp.getUi().alert("Sheet not found: " + REPORT_CONFIG.locationSheet);
    return { totalCountries: 0, totalRegistrations: 0, rows: [] };
  }

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) {
    return { totalCountries: 0, totalRegistrations: 0, rows: [] };
  }

  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  const countryCol = findHeaderIndex_(headers, [REPORT_CONFIG.countryHeader, "country/region", "country or region"]);
  if (!countryCol) {
    SpreadsheetApp.getUi().alert("Country column not found in: " + REPORT_CONFIG.locationSheet);
    return { totalCountries: 0, totalRegistrations: 0, rows: [] };
  }

  const data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  const counts = new Map();
  let total = 0;

  for (let i = 0; i < data.length; i++) {
    const raw = data[i][countryCol - 1];
    const country = String(raw || "").trim();
    if (!country) continue;
    counts.set(country, (counts.get(country) || 0) + 1);
    total++;
  }

  const rows = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([country, count]) => ({ country, count }));

  return {
    totalCountries: counts.size,
    totalRegistrations: total,
    rows
  };
}

function buildReportHtml_(reportData, geminiSummary) {
  const rowsHtml = reportData.rows.map(r => (
    "<tr><td style=\"padding:6px 8px;border:1px solid #d0d7de;\">" +
    escapeHtml_(r.country) +
    "</td><td style=\"padding:6px 8px;border:1px solid #d0d7de;text-align:right;\">" +
    r.count +
    "</td></tr>"
  )).join("");

  const summaryHtml = geminiSummary
    ? "<h3 style=\"margin:16px 0 8px 0;\">Narrative Summary</h3><p style=\"margin:0 0 12px 0;\">" +
      escapeHtml_(geminiSummary) +
      "</p>"
    : "";

  return [
    "<div style=\"font-family:Arial, sans-serif; color:#0b1a2b;\">",
    "<h2 style=\"margin:0 0 8px 0;\">Registration Report</h2>",
    "<p style=\"margin:0 0 12px 0;\">Total registrations: <strong>" + reportData.totalRegistrations + "</strong></p>",
    "<p style=\"margin:0 0 12px 0;\">Total countries: <strong>" + reportData.totalCountries + "</strong></p>",
    summaryHtml,
    "<h3 style=\"margin:16px 0 8px 0;\">Registrations by Country</h3>",
    "<table style=\"border-collapse:collapse; width:100%; max-width:640px;\">",
    "<thead><tr><th style=\"text-align:left;padding:6px 8px;border:1px solid #d0d7de;background:#1e2a38;color:#ffffff;\">Country</th>",
    "<th style=\"text-align:right;padding:6px 8px;border:1px solid #d0d7de;background:#1e2a38;color:#ffffff;\">Count</th></tr></thead>",
    "<tbody>",
    rowsHtml || "<tr><td colspan=\"2\" style=\"padding:6px 8px;border:1px solid #d0d7de;\">No data</td></tr>",
    "</tbody></table>",
    "</div>"
  ].join("");
}

function buildReportText_(reportData, geminiSummary) {
  const lines = [];
  lines.push("Registration Report");
  lines.push("Total registrations: " + reportData.totalRegistrations);
  lines.push("Total countries: " + reportData.totalCountries);
  if (geminiSummary) {
    lines.push("");
    lines.push("Narrative Summary:");
    lines.push(geminiSummary);
  }
  lines.push("");
  lines.push("Registrations by Country:");
  reportData.rows.forEach(r => {
    lines.push("- " + r.country + ": " + r.count);
  });
  return lines.join("\n");
}

function generateGeminiSummary_(reportData) {
  const apiKey = PropertiesService.getScriptProperties().getProperty(REPORT_CONFIG.geminiApiKeyProp);
  if (!apiKey) return "";

  const prompt = [
    "Write a concise executive summary (3-5 sentences) for a registration report.",
    "Totals: " + reportData.totalRegistrations + " registrations across " + reportData.totalCountries + " countries.",
    "Country counts: " + reportData.rows.map(r => r.country + " (" + r.count + ")").join(", ") + ".",
    "Avoid bullet points; use a professional tone."
  ].join(" ");

  const result = callGemini_(prompt, apiKey);
  if (!result.ok) return "";
  return result.text;
}

function testGeminiKey() {
  const apiKey = PropertiesService.getScriptProperties().getProperty(REPORT_CONFIG.geminiApiKeyProp);
  if (!apiKey) {
    SpreadsheetApp.getUi().alert("Gemini API key not found. Add GEMINI_API_KEY in Script Properties.");
    return;
  }

  const result = callGemini_("Reply with the single word OK.", apiKey);
  if (result.ok) {
    SpreadsheetApp.getUi().alert("✅ Gemini key works.\n\nResponse: " + result.text);
  } else {
    const message = result.error ? String(result.error).slice(0, 500) : "Unknown error";
    SpreadsheetApp.getUi().alert("❌ Gemini test failed.\n\nStatus: " + result.status + "\n\n" + message);
  }
}

function callGemini_(prompt, apiKey) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" +
    encodeURIComponent(REPORT_CONFIG.geminiModel) +
    ":generateContent?key=" + encodeURIComponent(apiKey);

  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  try {
    const response = UrlFetchApp.fetch(url, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });

    const status = response.getResponseCode();
    const body = response.getContentText();
    if (status < 200 || status >= 300) {
      return { ok: false, status, error: body };
    }

    const data = JSON.parse(body);
    const text = data && data.candidates && data.candidates[0] &&
      data.candidates[0].content && data.candidates[0].content.parts &&
      data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;

    if (!text) {
      return { ok: false, status, error: "Empty response from Gemini." };
    }
    return { ok: true, status, text: String(text).trim() };
  } catch (e) {
    return { ok: false, status: 0, error: String(e) };
  }
}

function escapeHtml_(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
