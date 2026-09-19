import QRCode from "qrcode";
import { isCertificateId, normaliseCertificateId } from "@/lib/certificate-id";
import { verifyUrl } from "@/lib/links";

/**
 * A QR code (PNG) that opens a certificate's check page. The certificate automation
 * fetches this when it builds each PDF.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/qr/[id]">) {
  const { id: rawId } = await params;
  const id = normaliseCertificateId(decodeURIComponent(rawId));
  if (!isCertificateId(id)) {
    return new Response("Not a certificate ID", { status: 400 });
  }

  const png = await QRCode.toBuffer(verifyUrl(id), {
    type: "png",
    width: 600,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#142b49", light: "#fbf9f3" },
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
