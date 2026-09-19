"use client";

import { usePathname } from "next/navigation";
import SearchForm from "@/components/SearchForm";
import styles from "./not-found.module.css";

export default function NotFound() {
  const pathname = usePathname() || "";
  const match = pathname.match(/^\/verify\/([^/]+)/);
  const id = match ? decodeURIComponent(match[1]) : "";

  if (!id) {
    return (
      <div className={`wrap ${styles.page}`}>
        <h1 className={styles.title}>This page doesn&apos;t exist</h1>
        <p className={styles.text}>To check a certificate, enter its ID below.</p>
        <SearchForm />
      </div>
    );
  }

  return (
    <div className={`wrap ${styles.page}`}>
      <h1 className={styles.title}>No certificate matches this ID</h1>
      <p className={styles.searched}>{id}</p>
      <ul className={styles.tips}>
        <li>Compare it with the certificate character by character. It has five parts, like AEF-2026-C1-0001-K7QX, and the last part is a four-character code.</li>
        <li>Certificates only appear here once they have been issued and emailed to the fellow.</li>
        <li>If it still doesn&apos;t match, ask the person who shared it to send the link from their certificate email, or contact Behind the Data Academy.</li>
      </ul>
      <SearchForm defaultValue={id} compact />
    </div>
  );
}
