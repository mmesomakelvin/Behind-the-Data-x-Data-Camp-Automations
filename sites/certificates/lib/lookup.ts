import { cache } from "react";
import { isCertificateId, normaliseCertificateId } from "./certificate-id";

export type Certificate = {
  id: string;
  name: string;
  programme: string;
  cohort: string;
  award: string;
  issued: string;
  pdfUrl: string;
};

export type LookupResult =
  | { status: "found"; certificate: Certificate }
  | { status: "not-found" }
  | { status: "unavailable" };

/** One Apps Script lookup per programme/cohort, chosen by the start of the certificate ID. */
export type LookupSource = { prefix: string; url: string; key: string };

const TIMEOUT_MS = 8000;

/** Reads CERT_LOOKUP_SOURCES: a JSON list of { prefix, url, key }. */
export function parseLookupSources(raw: string | undefined): LookupSource[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is LookupSource =>
        s && typeof s.prefix === "string" && typeof s.url === "string" && typeof s.key === "string",
    );
  } catch {
    return [];
  }
}

export function findSource(id: string, sources: LookupSource[]): LookupSource | undefined {
  return sources
    .filter((source) => id.startsWith(source.prefix.toUpperCase()))
    .sort((a, b) => b.prefix.length - a.prefix.length)[0];
}

type Fetcher = typeof fetch;

export async function lookupCertificate(
  rawId: string,
  sources: LookupSource[],
  fetcher: Fetcher = fetch,
): Promise<LookupResult> {
  const id = normaliseCertificateId(rawId);
  if (!isCertificateId(id)) return { status: "not-found" };

  const source = findSource(id, sources);
  if (!source) return { status: "not-found" };

  try {
    const url = `${source.url}?id=${encodeURIComponent(id)}&key=${encodeURIComponent(source.key)}`;
    const response = await fetcher(url, {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return { status: "unavailable" };

    const reply = await response.json();
    if (!reply || reply.ok !== true) return { status: "unavailable" };
    if (!reply.found || !reply.certificate) return { status: "not-found" };
    return { status: "found", certificate: reply.certificate as Certificate };
  } catch {
    // Timeouts, network errors and bad replies all mean "we could not check",
    // never "this certificate is fake".
    return { status: "unavailable" };
  }
}

// Used on a developer's computer when no real lookup is configured, so every
// screen can be seen. Never used on the live site.
const DEMO_CERTIFICATE: Certificate = {
  id: "AEF-2026-C1-0001-K7QX",
  name: "Ada Lovelace",
  programme: "Analytics Engineering Fellowship",
  cohort: "2026 · Cohort 1",
  award: "Certificate of Participation",
  issued: "September 2026",
  pdfUrl: "#demo-pdf",
};
export const DEMO_UNAVAILABLE_ID = "AEF-2026-C1-0000-DOWN";

function demoLookup(rawId: string): LookupResult {
  const id = normaliseCertificateId(rawId);
  if (id === DEMO_CERTIFICATE.id) return { status: "found", certificate: DEMO_CERTIFICATE };
  if (id === DEMO_UNAVAILABLE_ID) return { status: "unavailable" };
  return { status: "not-found" };
}

export function isDemoMode(): boolean {
  return !process.env.CERT_LOOKUP_SOURCES && process.env.NODE_ENV !== "production";
}

/** The page and its metadata share one lookup per request. */
export const getCertificate = cache(async (rawId: string): Promise<LookupResult> => {
  if (isDemoMode()) return demoLookup(rawId);
  return lookupCertificate(rawId, parseLookupSources(process.env.CERT_LOOKUP_SOURCES));
});
