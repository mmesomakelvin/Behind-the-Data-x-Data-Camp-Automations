import type { Certificate } from "./lookup";

export const ACADEMY_NAME = "Behind the Data Academy";

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://btd-certificates.vercel.app").replace(/\/+$/, "");
}

export function verifyUrl(id: string): string {
  return `${siteUrl()}/verify/${encodeURIComponent(id)}`;
}

const MONTHS = ["january", "february", "march", "april", "may", "june", "july",
  "august", "september", "october", "november", "december"];

/** "September 2026" -> { year: 2026, month: 9 } */
export function parseIssued(issued: string): { year?: number; month?: number } {
  const [monthName, yearText] = issued.trim().toLowerCase().split(/\s+/);
  const month = MONTHS.indexOf(monthName) + 1;
  const year = Number(yearText);
  return {
    month: month > 0 ? month : undefined,
    year: Number.isInteger(year) && year > 2000 ? year : undefined,
  };
}

/** Opens LinkedIn's "Add licence or certification" form, filled in. */
export function linkedInAddUrl(certificate: Certificate): string {
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: `${certificate.programme} - ${certificate.award}`,
    organizationName: ACADEMY_NAME,
    certUrl: verifyUrl(certificate.id),
    certId: certificate.id,
  });
  const { year, month } = parseIssued(certificate.issued);
  if (year) params.set("issueYear", String(year));
  if (month) params.set("issueMonth", String(month));
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}
