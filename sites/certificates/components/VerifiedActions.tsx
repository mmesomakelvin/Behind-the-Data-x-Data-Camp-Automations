"use client";

import { useRef, useState } from "react";
import styles from "./VerifiedActions.module.css";

type Props = { pdfUrl: string; linkedInUrl: string; pageUrl: string };

export default function VerifiedActions({ pdfUrl, linkedInUrl, pageUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const linkField = useRef<HTMLInputElement>(null);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked: select the link so it can be copied by hand.
      linkField.current?.select();
    }
  }

  return (
    <div className={styles.actions}>
      {pdfUrl ? (
        <a className="button" href={pdfUrl} rel="noopener">
          <DownloadIcon />
          Download PDF
        </a>
      ) : (
        <p className={styles.note}>The PDF isn&apos;t available to download right now.</p>
      )}

      <a className="button secondary" href={linkedInUrl} target="_blank" rel="noopener noreferrer">
        <LinkedInIcon />
        Add to LinkedIn
      </a>

      <div className={styles.share}>
        <label htmlFor="verification-link" className={styles.shareLabel}>Link to this check</label>
        <div className={styles.shareRow}>
          <input
            ref={linkField}
            id="verification-link"
            className={styles.shareInput}
            value={pageUrl}
            readOnly
            onFocus={(event) => event.currentTarget.select()}
          />
          <button type="button" className={`button secondary ${styles.copy}`} onClick={copyLink}>
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
        <p className={styles.note} aria-live="polite">
          {copied ? "Link copied. Paste it into a CV, email or message." : "Anyone with this link can check the certificate."}
        </p>
      </div>
    </div>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11" /><path d="M7 10l5 5 5-5" /><path d="M5 20h14" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10v7" /><path d="M8 7v.01" /><path d="M12 17v-4a2 2 0 0 1 4 0v4" /><path d="M12 10v7" />
    </svg>
  );
}
