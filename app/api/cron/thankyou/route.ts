import { getStore } from "@/lib/store";
import { sendBookingEmail } from "@/lib/emails/dispatch";
import { cronAuthorized, dateOffsetStr } from "@/lib/cron";

// Agradecimiento + pedido de resena (Fase 4). Corre a diario (ver vercel.json).
// Busca reservas cuya fecha fue ayer y manda el email de agradecimiento, sin
// duplicar (email_log).
export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const target = dateOffsetStr(-1);
  const store = getStore();
  const bookings = await store.listBookings(1000);
  const due = bookings.filter(
    (b) =>
      (b.scheduled_date ?? "").slice(0, 10) === target &&
      b.status !== "cancelled",
  );

  let sent = 0;
  for (const b of due) {
    const r = await sendBookingEmail(store, b.id, "thankyou");
    if (r.ok && !r.skipped) sent++;
  }
  return Response.json({ ok: true, target, candidates: due.length, sent });
}
