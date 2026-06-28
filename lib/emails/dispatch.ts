import type { DataStore } from "@/lib/store";
import { serviceLabel } from "@/lib/constants";
import { formatUsd } from "@/lib/pricing";
import { buildEmail } from "./templates";
import { sendEmail } from "./send";
import type { EmailData, EmailType } from "./types";

// Dominio del sitio para los links de los emails (reprogramar, etc.).
const SITE_URL = process.env.SITE_URL || "https://thesageessence.com";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Formatea el naive ISO "YYYY-MM-DDTHH:mm" a texto legible en ingles.
function scheduledText(iso: string | null): string | undefined {
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return undefined;
  const [, y, mo, d, hh, mm] = m;
  const hour = Number(hh);
  const ampm = hour < 12 ? "AM" : "PM";
  const h12 = ((hour + 11) % 12) + 1;
  return `${MONTHS[Number(mo) - 1]} ${Number(d)}, ${y} at ${h12}:${mm} ${ampm}`;
}

/**
 * Envia un email de un tipo para una reserva, evitando duplicados via email_log.
 * Best effort: nunca lanza. Devuelve si se envio (o si se salteo por duplicado).
 */
export async function sendBookingEmail(
  store: DataStore,
  bookingId: string,
  type: EmailType,
): Promise<{ ok: boolean; skipped?: boolean }> {
  try {
    if (await store.hasEmail(bookingId, type)) {
      return { ok: true, skipped: true };
    }
    const booking = await store.getBooking(bookingId);
    if (!booking?.customer?.email) return { ok: false };

    const priceAmount = booking.final_amount ?? booking.estimate_low;
    const data: EmailData = {
      firstName: booking.customer.full_name.split(" ")[0] || "there",
      serviceLabel: serviceLabel(booking.service_type),
      scheduledDateText: scheduledText(booking.scheduled_date),
      priceText: priceAmount != null ? formatUsd(priceAmount) : undefined,
      manageUrl: `${SITE_URL}/booking/manage?id=${bookingId}`,
      signUrl: process.env.DOCUSIGN_POWERFORM_URL || undefined,
      reviewUrl: process.env.SAGE_REVIEW_URL || undefined,
    };

    const email = buildEmail(type, data);
    const res = await sendEmail({ to: booking.customer.email, email });
    if (res.ok) await store.logEmail(bookingId, type);
    return { ok: res.ok };
  } catch (err) {
    console.error(`[sendBookingEmail:${type}] error:`, err);
    return { ok: false };
  }
}

/**
 * Email "en camino", disparado a mano desde el panel cuando la limpiadora sale.
 * No usa dedupe: se puede reenviar (ej. si se reprograma). Best effort.
 */
export async function sendOnTheWayEmail(
  store: DataStore,
  bookingId: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const booking = await store.getBooking(bookingId);
    if (!booking?.customer?.email) {
      return { ok: false, error: "This booking has no customer email." };
    }
    const data: EmailData = {
      firstName: booking.customer.full_name.split(" ")[0] || "there",
      serviceLabel: serviceLabel(booking.service_type),
    };
    const email = buildEmail("on_the_way", data);
    const res = await sendEmail({ to: booking.customer.email, email });
    return { ok: res.ok, error: res.ok ? undefined : "Could not send the email." };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not send.",
    };
  }
}

// Aviso interno a Sage de un lead abandonado (Fase 5). Best effort.
export async function sendLeadNotification(lead: {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  zipCode?: string | null;
  lastStepReached?: string | null;
}): Promise<void> {
  const to = process.env.SAGE_NOTIFY_EMAIL || process.env.SAGE_FROM_EMAIL;
  if (!to) return;
  try {
    const lines = [
      "A visitor started a booking and did not finish.",
      "",
      `Name: ${lead.fullName || "(not given)"}`,
      `Email: ${lead.email || "(not given)"}`,
      `Phone: ${lead.phone || "(not given)"}`,
      `Zip: ${lead.zipCode || "(not given)"}`,
      `Last step: ${lead.lastStepReached || "(unknown)"}`,
    ];
    const text = lines.join("\n");
    const html = `<div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#1f1810">${lines
      .map((l) => (l ? l.replace(/</g, "&lt;") : ""))
      .join("<br>")}</div>`;
    await sendEmail({
      to,
      email: { subject: "New abandoned booking lead", html, text },
    });
  } catch (err) {
    console.error("[sendLeadNotification] error:", err);
  }
}
