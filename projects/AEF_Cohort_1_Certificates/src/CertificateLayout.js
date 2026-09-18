/**
 * Where the per-fellow text sits on the certificate, in points (1pt = 1/72 inch).
 *
 * The page is A4 landscape. Everything else (logo, wording, signature, seal)
 * is part of the background image rendered by scripts/render-certificate-background.ps1.
 * Positions were measured from artifacts/certificates/aef-cohort-1-certificate-sample.html
 * (CSS pixels x 0.75 = points).
 *
 * This file is also loaded by artifacts/certificates/aef-cohort-1-certificate-preview.html,
 * so the local preview and the real PDFs use the same numbers.
 */

var CERT_LAYOUT = {
  page: { width: 841.89, height: 595.28 },

  // Google Slides text boxes keep a fixed inner margin; boxes are widened to allow for it.
  textBoxInset: { x: 7.2, y: 3.6 },

  name: {
    left: 71.25,
    top: 275.06,
    width: 699,
    height: 60,
    fontFamily: 'Poppins',
    fontWeight: 600,
    italic: true,
    color: '#142b49',
    maxFontSize: 34.5,
    minFontSize: 18,
    // Average Poppins SemiBold Italic letter width as a share of the font size.
    averageCharWidth: 0.7
  },

  certificateId: {
    left: 105.1,
    top: 558.4,
    width: 150,
    height: 16,
    fontFamily: 'Poppins',
    fontWeight: 700,
    italic: false,
    color: '#142b49',
    fontSize: 5.625
  }
};

/** Shrinks long names so they always stay on one line. */
function nameFontSize_(name) {
  var layout = CERT_LAYOUT.name;
  var usableWidth = layout.width - CERT_LAYOUT.textBoxInset.x * 2;
  var length = Math.max(String(name || '').trim().length, 1);
  var fitted = usableWidth / (length * layout.averageCharWidth);
  var size = Math.min(layout.maxFontSize, Math.max(layout.minFontSize, fitted));
  return Math.floor(size * 2) / 2;
}
