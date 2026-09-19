// Certificate IDs look like AEF-2026-C1-0001-K7QX:
// programme - year - cohort - running number - random code.
const ID_PATTERN = /^[A-Z]{2,10}-\d{4}-[A-Z0-9]{1,6}-\d{4}-[A-Z0-9]{4}$/;
const MAX_LENGTH = 40;

/** Upper case with spaces removed, so "aef-2026-c1-0001-k7qx " still matches. */
export function normaliseCertificateId(value: unknown): string {
  const id = String(value ?? "").replace(/\s+/g, "").toUpperCase();
  return id.length > MAX_LENGTH ? "" : id;
}

export function isCertificateId(value: string): boolean {
  return ID_PATTERN.test(value);
}
