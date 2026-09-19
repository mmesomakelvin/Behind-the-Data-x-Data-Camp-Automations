import SearchForm from "@/components/SearchForm";
import styles from "./page.module.css";

const ERRORS: Record<string, string> = {
  format: "That doesn't look like a certificate ID. It has five parts, like AEF-2026-C1-0001-K7QX.",
  empty: "Enter the certificate ID printed on the certificate.",
};

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? ERRORS[params.error] : undefined;
  const typed = typeof params.id === "string" ? params.id : "";

  return (
    <div className={`wrap ${styles.home}`}>
      <section className={styles.intro}>
        <h1 className={styles.title}>Check a Behind the Data Academy certificate</h1>
        <p className={styles.lede}>
          Enter the certificate ID to confirm the certificate is genuine and see who it was awarded to.
        </p>
        <SearchForm defaultValue={typed} error={error} />
      </section>

      <figure className={styles.where} aria-label="Where to find the certificate ID">
        <div className={styles.snippet} aria-hidden="true">
          <div className={styles.snippetSeal}>
            <span className={styles.sealMark}>AEF</span>
            <span className={styles.sealText}>Verified</span>
          </div>
          <div className={styles.snippetRule} />
          <div className={styles.snippetFooter}>
            <span className={styles.snippetId}>
              Certificate ID: <b>AEF-2026-C1-0001-K7QX</b>
            </span>
          </div>
        </div>
        <figcaption className={styles.caption}>
          The ID sits in the footer of every certificate. Scanning the QR code on a certificate opens its check page directly.
        </figcaption>
      </figure>
    </div>
  );
}
