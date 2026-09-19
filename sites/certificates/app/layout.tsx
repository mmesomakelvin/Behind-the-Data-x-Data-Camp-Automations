import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { siteUrl } from "@/lib/links";
import "./globals.css";
import styles from "./layout.module.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Check a certificate | Behind the Data Academy",
    template: "%s | Behind the Data Academy",
  },
  description:
    "Check that a Behind the Data Academy certificate is genuine by entering its certificate ID.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <header className={styles.header}>
          <div className={`wrap ${styles.headerInner}`}>
            <Link href="/" className={styles.brand}>
              <Image src="/btd-logo.jpeg" alt="" width={44} height={44} className={styles.logo} priority />
              <span className={styles.brandText}>
                <span className={styles.academy}>Behind the Data Academy</span>
                <span className={styles.product}>Certificate check</span>
              </span>
            </Link>
          </div>
        </header>
        <main>{children}</main>
        <footer className={styles.footer}>
          <div className={`wrap ${styles.footerInner}`}>
            <span>© {new Date().getFullYear()} Behind the Data Academy</span>
            <span>Results come straight from the academy&apos;s certificate records.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
