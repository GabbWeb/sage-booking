import { buildEmail, EMAIL_TYPES } from "@/lib/emails/templates";
import type { EmailData, EmailType } from "@/lib/emails/types";

// Preview de las plantillas de email con datos de ejemplo. Solo renderiza HTML,
// no envia nada. Util para revisar el diseno en el navegador.

const SAMPLE: EmailData = {
  firstName: "Jane",
  serviceLabel: "Deep clean",
  scheduledDateText: "Tuesday, June 24 at 10:00 AM",
  estimateLow: 200,
  estimateHigh: 260,
  reviewUrl: "https://g.page/r/sage-essence/review",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  if (!EMAIL_TYPES.includes(type as EmailType)) {
    return new Response("Unknown email type", { status: 404 });
  }
  const email = buildEmail(type as EmailType, SAMPLE);
  return new Response(email.html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
