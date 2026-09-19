import { describe, expect, it, vi } from "vitest";
import { isCertificateId, normaliseCertificateId } from "./certificate-id";
import { findSource, lookupCertificate, parseLookupSources, type LookupSource } from "./lookup";
import { linkedInAddUrl, parseIssued } from "./links";

const SOURCES: LookupSource[] = [
  { prefix: "AEF-2026-C1-", url: "https://script.google.com/macros/s/abc/exec", key: "secret" },
];

const CERTIFICATE = {
  id: "AEF-2026-C1-0001-K7QX",
  name: "Ada Lovelace",
  programme: "Analytics Engineering Fellowship",
  cohort: "2026 · Cohort 1",
  award: "Certificate of Participation",
  issued: "September 2026",
  pdfUrl: "https://drive.google.com/uc?export=download&id=abc",
};

function reply(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({ ok, json: async () => body }) as unknown as typeof fetch;
}

describe("certificate IDs", () => {
  it("tidies case and spaces", () => {
    expect(normaliseCertificateId(" aef-2026-c1-0001-k7qx ")).toBe("AEF-2026-C1-0001-K7QX");
    expect(normaliseCertificateId("X".repeat(41))).toBe("");
  });

  it("accepts only the five-part format", () => {
    expect(isCertificateId("AEF-2026-C1-0001-K7QX")).toBe(true);
    expect(isCertificateId("AEF-2026-C1-0001")).toBe(false);
    expect(isCertificateId("AEF-2026-C1-0001-K7Q")).toBe(false);
    expect(isCertificateId("<script>")).toBe(false);
  });
});

describe("lookup sources", () => {
  it("reads the environment list and ignores bad entries", () => {
    expect(parseLookupSources(JSON.stringify([...SOURCES, { prefix: 1 }]))).toEqual(SOURCES);
    expect(parseLookupSources("not json")).toEqual([]);
    expect(parseLookupSources(undefined)).toEqual([]);
  });

  it("picks the most specific prefix", () => {
    const sources = [...SOURCES, { prefix: "AEF-", url: "x", key: "y" }];
    expect(findSource("AEF-2026-C1-0001-K7QX", sources)?.url).toBe(SOURCES[0].url);
    expect(findSource("AIA-2026-C1-0001-K7QX", sources)).toBeUndefined();
  });
});

describe("lookupCertificate", () => {
  it("returns a found certificate and sends the key", async () => {
    const fetcher = reply({ ok: true, found: true, certificate: CERTIFICATE });
    const result = await lookupCertificate("aef-2026-c1-0001-k7qx", SOURCES, fetcher);
    expect(result).toEqual({ status: "found", certificate: CERTIFICATE });
    const url = String((fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]);
    expect(url).toContain("id=AEF-2026-C1-0001-K7QX");
    expect(url).toContain("key=secret");
  });

  it("reports not found without calling out for malformed or unknown-programme IDs", async () => {
    const fetcher = reply({});
    expect(await lookupCertificate("hello", SOURCES, fetcher)).toEqual({ status: "not-found" });
    expect(await lookupCertificate("ZZZ-2026-C1-0001-K7QX", SOURCES, fetcher)).toEqual({ status: "not-found" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("reports not found when the records have no match", async () => {
    const result = await lookupCertificate(CERTIFICATE.id, SOURCES, reply({ ok: true, found: false }));
    expect(result).toEqual({ status: "not-found" });
  });

  it("never says 'not found' when the records could not be checked", async () => {
    const failing = vi.fn().mockRejectedValue(new Error("timeout")) as unknown as typeof fetch;
    expect(await lookupCertificate(CERTIFICATE.id, SOURCES, failing)).toEqual({ status: "unavailable" });
    expect(await lookupCertificate(CERTIFICATE.id, SOURCES, reply({}, false))).toEqual({ status: "unavailable" });
    expect(await lookupCertificate(CERTIFICATE.id, SOURCES, reply({ ok: false, error: "unauthorized" })))
      .toEqual({ status: "unavailable" });
  });
});

describe("links", () => {
  it("reads the issue month and year", () => {
    expect(parseIssued("September 2026")).toEqual({ month: 9, year: 2026 });
    expect(parseIssued("sometime")).toEqual({ month: undefined, year: undefined });
  });

  it("pre-fills LinkedIn's add-certification form", () => {
    const url = new URL(linkedInAddUrl(CERTIFICATE));
    expect(url.origin + url.pathname).toBe("https://www.linkedin.com/profile/add");
    expect(url.searchParams.get("startTask")).toBe("CERTIFICATION_NAME");
    expect(url.searchParams.get("certId")).toBe(CERTIFICATE.id);
    expect(url.searchParams.get("issueMonth")).toBe("9");
    expect(url.searchParams.get("certUrl")).toMatch(/\/verify\/AEF-2026-C1-0001-K7QX$/);
  });
});
