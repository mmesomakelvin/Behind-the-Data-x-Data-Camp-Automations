import styles from "./SearchForm.module.css";

type Props = {
  defaultValue?: string;
  error?: string;
  compact?: boolean;
};

/** A plain form, so checking a certificate works even without JavaScript. */
export default function SearchForm({ defaultValue = "", error, compact = false }: Props) {
  const hintId = "certificate-id-hint";
  const errorId = "certificate-id-error";
  return (
    <form action="/verify" method="get" className={compact ? `${styles.form} ${styles.compact}` : styles.form}>
      <label htmlFor="certificate-id" className={styles.label}>Certificate ID</label>
      <div className={styles.row}>
        <input
          id="certificate-id"
          name="id"
          type="text"
          required
          maxLength={40}
          defaultValue={defaultValue}
          placeholder="AEF-2026-C1-0001-K7QX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-describedby={error ? `${errorId} ${hintId}` : hintId}
          aria-invalid={error ? true : undefined}
          className={styles.input}
        />
        <button type="submit" className={`button ${styles.submit}`}>Check certificate</button>
      </div>
      {error ? <p id={errorId} className={styles.error}>{error}</p> : null}
      <p id={hintId} className={styles.hint}>
        Printed at the bottom left of the certificate, and in the email it came with.
      </p>
    </form>
  );
}
