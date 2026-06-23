import { getStore } from "@/lib/store";
import { sendBookingEmail } from "@/lib/emails/dispatch";
import { cronAuthorized, dateOffsetStr } from "@/lib/cron";

// Recordatorio 2 dias antes (Fase 4). Lo corre Vercel Cron a diario (ver
// vercel.json). Busca reservas cuya fecha sea dentro de 2 dias y manda el
// recordatorio, sin duplicar (email_log).
export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const target = dateOffsetStr(2);
  const store = getStore();
  const bookings = await store.listBookings(1000);
  const due = bookings.filter(
    (b) =>
      (b.scheduled_date ?? "").slice(0, 10) === target &&
      b.status !== "cancelled",
  );

  let sent = 0;
  for (const b of due) {
    const r = await sendBookingEmail(store, b.id, "reminder_2days");
    if (r.ok && !r.skipped) sent++;
  }
  return Response.json({ ok: true, target, candidates: due.length, sent });
}
