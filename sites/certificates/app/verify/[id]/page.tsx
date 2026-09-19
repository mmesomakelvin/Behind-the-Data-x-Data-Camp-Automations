import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import CertificatePreview from "@/components/CertificatePreview";
import VerifiedActions from "@/components/VerifiedActions";
import SearchForm from "@/components/SearchForm";
import { normaliseCertificateId } from "@/lib/certificate-id";
import { getCertificate } from "@/lib/lookup";
import { linkedInAddUrl, verifyUrl } from "@/lib/links";
import styles from "./page.module.css";

// Fellows' names should not turn up in search engines.
const robots = { index: false, follow: false };

export async function generateMetadata({ params }: PageProps<"/verify/[id]">): Promise<Metadata> {
  const { id } = await params;
  const result = await getCertificate(decodeURIComponent(id));
  if (result.status !== "found") return { title: "Certificate check", robots };
  const { certificate } = result;
  return {
    title: `${certificate.name} - verified certificate`,
    description: `${certificate.name} was awarded the ${certificate.programme} ${certificate.award} (${certificate.cohort}).`,
    robots,
  };
}

export default async function VerifyPage({ params }: PageProps<"/verify/[id]">) {
  const { id: rawId } = await params;
  const typed = decodeURIComponent(rawId);
  const id = normaliseCertificateId(typed);
  if (id && id !== typed) redirect(`/verify/${encodeURIComponent(id)}`);

  const result = await getCertificate(id);

  if (result.status === "not-found") notFound();

  if (result.status === "unavailable") {
    return (
      <div className={`wrap ${styles.message}`}>
        <h1 className={styles.messageTitle}>We couldn&apos;t check this certificate right now</h1>
        <p className={styles.messageText}>
          The certificate records didn&apos;t respond. This says nothing about whether the certificate is
          genuine. Wait a minute, then try again.
        </p>
        <div className={styles.messageActions}>
          <Link href={`/verify/${encodeURIComponent(id)}`} className="button">Try again</Link>
          <Link href="/" className="button secondary">Check a different certificate</Link>
        </div>
      </div>
    );
  }

  const { certificate } = result;
  return (
    <div className={`wrap ${styles.verified}`}>
      <section className={styles.banner} aria-labelledby="verified-title">
        <div className={styles.seal} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.2 4.2L19 7" />
          </svg>
        </div>
        <div>
          <h1 id="verified-title" className={styles.bannerTitle}>This certificate is genuine</h1>
          <p className={styles.bannerText}>
            It matches Behind the Data Academy&apos;s records and was awarded to {certificate.name}.
          </p>
        </div>
      </section>

      <div className={styles.layout}>
        <div className={styles.previewColumn}>
          <CertificatePreview certificate={certificate} />
        </div>

        <aside className={styles.details}>
          <dl className={styles.facts}>
            <div><dt>Awarded to</dt><dd className={styles.name}>{certificate.name}</dd></div>
            <div><dt>Award</dt><dd>{certificate.award}</dd></div>
            <div><dt>Programme</dt><dd>{certificate.programme}</dd></div>
            <div><dt>Cohort</dt><dd>{certificate.cohort}</dd></div>
            <div><dt>Issued</dt><dd>{certificate.issued}</dd></div>
            <div><dt>Issued by</dt><dd>Behind the Data Academy, signed by Ayoade Adegbite, Founder</dd></div>
            <div><dt>Certificate ID</dt><dd className={styles.id}>{certificate.id}</dd></div>
          </dl>

          <VerifiedActions
            pdfUrl={certificate.pdfUrl}
            linkedInUrl={linkedInAddUrl(certificate)}
            pageUrl={verifyUrl(certificate.id)}
          />
        </aside>
      </div>

      <section className={styles.again}>
        <h2 className={styles.againTitle}>Check another certificate</h2>
        <SearchForm compact />
      </section>
    </div>
  );
}
