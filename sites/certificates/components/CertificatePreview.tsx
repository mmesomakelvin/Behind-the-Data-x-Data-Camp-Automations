import Image from "next/image";
import type { Certificate } from "@/lib/lookup";
import { SHORT_VERIFY_LINK } from "@/lib/links";
import styles from "./CertificatePreview.module.css";

// The printed name shrinks for long names, the same rule the PDF uses.
const NAME_WIDTH_PX = 912;
const NAME_MAX_PX = 46;
const NAME_MIN_PX = 24;
const AVERAGE_CHAR_WIDTH = 0.7;

export function nameSizePx(name: string): number {
  const fitted = NAME_WIDTH_PX / (Math.max(name.trim().length, 1) * AVERAGE_CHAR_WIDTH);
  return Math.max(NAME_MIN_PX, Math.min(NAME_MAX_PX, fitted));
}

/**
 * The certificate drawn in HTML from the same design as the PDF. The handwritten
 * signature stays on the PDF only; here the signatory is printed.
 */
export default function CertificatePreview({ certificate }: { certificate: Certificate }) {
  const year = (certificate.cohort.match(/\d{4}/) || certificate.issued.match(/\d{4}/) || [""])[0];
  const awardWord = certificate.award.replace(/^Certificate of\s+/i, "");

  return (
    <figure className={styles.frame} aria-label={`Certificate awarded to ${certificate.name}`}>
      <div className={styles.page}>
        <i className={`${styles.corner} ${styles.tl}`} />
        <i className={`${styles.corner} ${styles.tr}`} />
        <i className={`${styles.corner} ${styles.bl}`} />
        <i className={`${styles.corner} ${styles.br}`} />

        <div className={styles.inner}>
          <header className={styles.masthead}>
            <Image src="/btd-logo.jpeg" alt="" width={88} height={88} className={styles.logo} />
            <div>
              <small className={styles.academy}>Behind The Data Academy</small>
              <strong className={styles.programme}>{certificate.programme}</strong>
            </div>
            <div className={styles.cohort}>
              <span>Programme year</span>
              <strong>{certificate.cohort}</strong>
            </div>
          </header>

          <section className={styles.award}>
            <p className={styles.overline}>Certificate of</p>
            <p className={styles.awardWord}>{awardWord}</p>
            <div className={styles.rule} />
            <p className={styles.presented}>This certificate is proudly presented to</p>
            <p className={styles.recipient} style={{ ["--name-size" as string]: nameSizePx(certificate.name) }}>
              {certificate.name}
            </p>
            <p className={styles.copy}>
              in recognition of participation in the <strong>{certificate.programme} {certificate.cohort.replace(/\s*·\s*/, ", ")}</strong>,
              and commitment to practical learning, project work and the development of analytics engineering skills.
            </p>
          </section>

          <section className={styles.signing}>
            <div className={styles.signature}>
              <div className={styles.signed}>Signed on the original</div>
              <div className={styles.line} />
              <strong>Ayoade Adegbite</strong>
              <span>Founder, Behind The Data Academy</span>
            </div>
            <div className={styles.verifyGroup}>
              <div className={styles.qr}>
                {/* eslint-disable-next-line @next/next/no-img-element -- small generated PNG from our own route */}
                <img src={`/api/qr/${encodeURIComponent(certificate.id)}`} alt="" className={styles.qrCode} />
                <span>Scan to verify</span>
              </div>
              <div className={styles.seal}>
                <div><strong>AEF</strong>Verified<br />{year}</div>
              </div>
            </div>
          </section>

          <footer className={styles.metadata}>
            <span>Certificate ID: <b>{certificate.id}</b></span>
            <span className={styles.verifyLink}>Verify at <b>{SHORT_VERIFY_LINK}</b></span>
            <span className={styles.issued}>Issued {certificate.issued}</span>
          </footer>
        </div>
      </div>
    </figure>
  );
}
