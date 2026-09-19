import { redirect } from "next/navigation";
import { isCertificateId, normaliseCertificateId } from "@/lib/certificate-id";

/** Receives the home page form and sends the visitor to that certificate's own page. */
export default async function VerifySearch({ searchParams }: PageProps<"/verify">) {
  const params = await searchParams;
  const typed = typeof params.id === "string" ? params.id : "";
  const id = normaliseCertificateId(typed);

  if (!id) redirect("/?error=empty");
  if (!isCertificateId(id)) redirect(`/?error=format&id=${encodeURIComponent(typed.slice(0, 40))}`);
  redirect(`/verify/${encodeURIComponent(id)}`);
}
