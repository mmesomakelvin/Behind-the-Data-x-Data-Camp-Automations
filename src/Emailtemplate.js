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