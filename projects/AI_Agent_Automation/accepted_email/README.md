# AI Agents Accepted Email

Reference folder for the accepted-email workflow inside `AI_Agent_Automation`.

## Source Links

- Discord: `https://discord.gg/4mhSUaeTM`
- Compliance document: `https://docs.google.com/document/d/1_Nw_-GE94NsH2VoIaWcJ32NMcgtbXg17jX9I9FdrtWE/edit?usp=sharing`
- Cohort acceptance form: `https://docs.google.com/forms/d/e/1FAIpQLSeFfwQhzVgzRAA4NPNJhpn7Rk9a-2yzaJaBMP0klqIh-_vigQ/viewform?usp=publish-editor`

## Implementation Notes

- HTML layout is adapted from the onboarding email in `Payment_Receipt_Onboarding`
- Sending logic lives in `src/AcceptedEmailSender.js`
- Template logic lives in `src/AcceptedEmailTemplate.js`
- Accepted recipients are controlled by `Status = Accepted` in the source sheet
- The accepted reminder email also lives in `src/AcceptedEmailSender.js` and `src/AcceptedEmailTemplate.js`
- Reminder emails tell admitted candidates to accept their admission and pay the commitment fee by the upcoming Friday date at send time
- Reminder emails repeat the account details, compliance-document link, and acceptance-form link
