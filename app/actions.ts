"use server";

import { headers } from "next/headers";
import { getStore, type StoreMode } from "@/lib/store";
import { estimatePrice } from "@/lib/pricing";
import {
  SERVICE_VALUES,
  FREQUENCY_VALUES,
  serviceLabel,
  type ServiceType,
  type Frequency,
} from "@/lib/constants";
import {
  stripeConfigured,
  ensureStripeCustomer,
  createCheckoutSession,
} from "@/lib/stripe";
import {
  googleCalendarConfigured,
  createCalendarEvent,
  defaultEndISO,
} from "@/lib/google/calendar";
import { sendBookingEmail, sendLeadNotification } from "@/lib/emails/dispatch";

export type BookingState =
  | {
      ok: true;
      bookingId: string;
      low: number;
      high: number;
      mode: StoreMode;
      // Si Stripe esta configurado, URL de pago a la que redirige el cliente.
      checkoutUrl?: string | null;
    }
  | { ok: false; error: string }
  | null;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// DECISION DE NEGOCIO (ajustable): cuanto se cobra al reservar. Por ahora se
// cobra el extremo BAJO del estimado como base; los ajustes y adicionales van
// como cargos extra despues de la limpieza. Cambiar aca si Sage prefiere
// cobrar un deposito fijo, un porcentaje, o solo guardar la tarjeta.
function bookingChargeCents(estimateLow: number): number {
  return Math.round(estimateLow * 100);
}

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function createBooking(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  // ---- Extraer ----
  const serviceType = String(formData.get("serviceType") ?? "");
  const frequency = String(formData.get("frequency") ?? "");
  const bedrooms = Number(formData.get("bedrooms") ?? 0);
  const bathrooms = Number(formData.get("bathrooms") ?? 0);
  const requestedExtras = String(formData.get("requestedExtras") ?? "").trim();
  const scheduledDate = String(formData.get("scheduledDate") ?? "").trim();
  const scheduledTime = String(formData.get("scheduledTime") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const zipCode = String(formData.get("zipCode") ?? "").trim();
  const allergies = String(formData.get("allergies") ?? "").trim();
  const marketingOptIn = formData.get("marketingOptIn") != null;

  // ---- Validar ----
  if (!SERVICE_VALUES.includes(serviceType as ServiceType)) {
    return { ok: false, error: "Please choose a type of clean." };
  }
  if (!FREQUENCY_VALUES.includes(frequency as Frequency)) {
    return { ok: false, error: "Please choose a frequency." };
  }
  if (!fullName) {
    return { ok: false, error: "Please enter your name." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (!Number.isFinite(bedrooms) || bedrooms < 0 || bedrooms > 20) {
    return { ok: false, error: "Bedrooms must be between 0 and 20." };
  }
  if (!Number.isFinite(bathrooms) || bathrooms < 0 || bathrooms > 20) {
    return { ok: false, error: "Bathrooms must be between 0 and 20." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
    return { ok: false, error: "Please choose a date." };
  }
  if (!/^\d{2}:\d{2}$/.test(scheduledTime)) {
    return { ok: false, error: "Please choose a time." };
  }

  // Naive ISO en hora de Austin. La duracion por defecto es de 2 horas.
  const startISO = `${scheduledDate}T${scheduledTime}:00`;
  const endISO = defaultEndISO(startISO);

  const estimate = estimatePrice({
    serviceType: serviceType as ServiceType,
    frequency: frequency as Frequency,
    bedrooms,
    bathrooms,
  });

  try {
    const store = getStore();

    // Evitar superposicion: si ya hay una reserva confirmada (pagada) en ese
    // horario, no se puede tomar de nuevo. Las pendientes no bloquean.
    const slotKey = startISO.slice(0, 16); // YYYY-MM-DDTHH:mm
    const existing = await store.listBookings(500);
    const slotTaken = existing.some(
      (b) =>
        b.status === "confirmed" &&
        (b.scheduled_date ?? "").slice(0, 16) === slotKey,
    );
    if (slotTaken) {
      return {
        ok: false,
        error: "That time was just booked. Please choose another time.",
      };
    }

    const customerId = await store.findOrCreateCustomer({
      fullName,
      email,
      phone: phone || null,
      zipCode: zipCode || null,
      allergies: allergies || null,
      marketingOptIn,
    });

    const bookingId = await store.createBooking(customerId, {
      serviceType,
      frequency,
      bedrooms,
      bathrooms,
      requestedExtras: requestedExtras || null,
      estimateLow: estimate.low,
      estimateHigh: estimate.high,
      scheduledDate: startISO,
    });

    // Google Calendar (Fase 3). Si NO hay pago de por medio, creamos el evento
    // al reservar. Cuando Stripe este activo, el evento lo crea el webhook al
    // confirmarse el pago (asi no agendamos reservas no pagadas). Best effort.
    if (!stripeConfigured()) {
      if (googleCalendarConfigured()) {
        try {
          await syncBookingToCalendar({ bookingId, startISO, endISO });
        } catch (calErr) {
          console.error("[createBooking] calendario fallo:", calErr);
        }
      }
      // Email de preparacion (Fase 4). Best effort.
      await sendBookingEmail(store, bookingId, "prep");
    }

    // Pago con Stripe (Fase 2). Si no hay llaves, se omite y queda como hoy:
    // la reserva pending sin pago (modo demo / pre-pagos).
    let checkoutUrl: string | null = null;
    if (stripeConfigured()) {
      try {
        const stripeCustomerId = await ensureStripeCustomer({
          existingId: null,
          email,
          name: fullName,
        });
        await store.setCustomerStripeId(customerId, stripeCustomerId);
        const origin = await siteOrigin();
        const session = await createCheckoutSession({
          bookingId,
          stripeCustomerId,
          amountCents: bookingChargeCents(estimate.low),
          description: `${serviceLabel(serviceType)}, Sage Essence`,
          successUrl: `${origin}/booking/success?booking=${bookingId}`,
          cancelUrl: `${origin}/booking?canceled=1`,
        });
        checkoutUrl = session.url;
      } catch (stripeErr) {
        // La reserva ya quedo guardada (pending). No perdemos el lead por un
        // fallo de pago: registramos y seguimos a la confirmacion.
        console.error("[createBooking] Stripe checkout fallo:", stripeErr);
      }
    }

    return {
      ok: true,
      bookingId,
      low: estimate.low,
      high: estimate.high,
      mode: store.mode,
      checkoutUrl,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "We could not save your booking.";
    return { ok: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Captura de leads abandonados (requerimiento de Katerina).
// Se llama desde el cliente cuando alguien dejo datos de contacto y abandona
// la reserva sin terminarla. Es best-effort: nunca debe romper la UX.
// ---------------------------------------------------------------------------
export async function saveAbandonedLead(payload: {
  fullName?: string;
  email?: string;
  phone?: string;
  zipCode?: string;
  lastStepReached?: string;
  partialData?: Record<string, unknown>;
}): Promise<{ ok: boolean }> {
  // Sin al menos un dato de contacto no tiene sentido (y respeta privacidad).
  const hasContact = Boolean(payload.email?.trim() || payload.phone?.trim());
  if (!hasContact) return { ok: false };

  try {
    const store = getStore();
    const lead = {
      fullName: payload.fullName?.trim() || null,
      email: payload.email?.trim().toLowerCase() || null,
      phone: payload.phone?.trim() || null,
      zipCode: payload.zipCode?.trim() || null,
      lastStepReached: payload.lastStepReached || null,
    };
    await store.saveAbandonedLead({ ...lead, partialData: payload.partialData ?? null });
    // Aviso a Sage para seguimiento manual (Fase 5). Best effort.
    await sendLeadNotification(lead);
    return { ok: true };
  } catch (err) {
    console.error("[saveAbandonedLead] no se pudo guardar el lead:", err);
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------
// Cargo extra sobre una reserva (el "cargo despues" que pidio Katerina).
// Cobra off-session sobre la tarjeta guardada del cliente y lo registra en
// extra_charges. Pensado para el panel de administracion (Fase 6).
// NOTA: esta accion mueve dinero. Cuando se exponga en el panel, protegerla con
// autenticacion (solo Katerina/Felipe).
// ---------------------------------------------------------------------------
export type ExtraChargeResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

// Genera un link de pago para un cargo extra. El cliente lo aprueba y paga el
// mismo (menos invasivo que cobrarle la tarjeta guardada). El cargo se registra
// recien cuando paga, via el webhook de Stripe.
export async function addExtraChargeToBooking(input: {
  bookingId: string;
  description: string;
  amountUsd: number;
}): Promise<ExtraChargeResult> {
  const description = input.description.trim();
  if (!description) return { ok: false, error: "A description is required." };
  if (!Number.isFinite(input.amountUsd) || input.amountUsd <= 0) {
    return { ok: false, error: "Amount must be greater than zero." };
  }
  if (!stripeConfigured()) {
    return { ok: false, error: "Payments are not active yet." };
  }

  try {
    const { createExtraChargeCheckout } = await import("@/lib/stripe");
    const store = getStore();
    const booking = await store.getBooking(input.bookingId);
    if (!booking) return { ok: false, error: "Booking not found." };
    if (!booking.customer?.email) {
      return { ok: false, error: "This booking has no customer email." };
    }

    // Asocia el pago al cliente (crea el Stripe Customer si hace falta).
    const stripeCustomerId = await ensureStripeCustomer({
      existingId: booking.customer.stripe_customer_id ?? null,
      email: booking.customer.email,
      name: booking.customer.full_name,
    });
    if (stripeCustomerId !== booking.customer.stripe_customer_id) {
      await store.setCustomerStripeId(booking.customer.id, stripeCustomerId);
    }

    const origin = await siteOrigin();
    const { url } = await createExtraChargeCheckout({
      bookingId: input.bookingId,
      stripeCustomerId,
      amountCents: Math.round(input.amountUsd * 100),
      description,
      successUrl: `${origin}/booking/success?paid=extra`,
      cancelUrl: `${origin}/booking/success?paid=cancel`,
    });
    if (!url) return { ok: false, error: "Could not create the payment link." };
    return { ok: true, url };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not create the payment link.";
    return { ok: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Google Calendar (Fase 3). Sage confirma fecha y hora, y creamos el evento en
// el calendario con los datos de la reserva (servicio, cliente, notas). Pensado
// para el panel de administracion. Requiere service account configurada.
// ---------------------------------------------------------------------------
export type CalendarSyncResult =
  | { ok: true; eventId: string }
  | { ok: false; error: string };

export async function syncBookingToCalendar(input: {
  bookingId: string;
  startISO: string;
  endISO?: string;
  location?: string;
}): Promise<CalendarSyncResult> {
  if (!googleCalendarConfigured()) {
    return { ok: false, error: "Google Calendar is not configured yet." };
  }
  if (!input.startISO) {
    return { ok: false, error: "A start time is required." };
  }
  const endISO = input.endISO ?? defaultEndISO(input.startISO);

  try {
    const store = getStore();
    const booking = await store.getBooking(input.bookingId);
    if (!booking) return { ok: false, error: "Booking not found." };

    const c = booking.customer;
    const name = c?.full_name ?? "Customer";
    const notes = [
      `Service: ${serviceLabel(booking.service_type)} (${booking.frequency})`,
      `Home: ${booking.bedrooms} bed, ${booking.bathrooms} bath`,
      booking.requested_extras ? `Extras: ${booking.requested_extras}` : "",
      c?.allergies_sensitivities
        ? `Sensitivities: ${c.allergies_sensitivities}`
        : "",
      c?.phone ? `Phone: ${c.phone}` : "",
      c?.email ? `Email: ${c.email}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const eventId = await createCalendarEvent({
      summary: `${serviceLabel(booking.service_type)} for ${name}`,
      description: notes,
      location: input.location || c?.zip_code || undefined,
      startISO: input.startISO,
      endISO,
    });

    await store.setBookingCalendarEvent(input.bookingId, eventId);
    return { ok: true, eventId };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Could not create the event.";
    return { ok: false, error: message };
  }
}
