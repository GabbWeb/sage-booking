"use server";

import { getStore, type StoreMode } from "@/lib/store";
import { estimatePrice } from "@/lib/pricing";
import {
  SERVICE_VALUES,
  FREQUENCY_VALUES,
  type ServiceType,
  type Frequency,
} from "@/lib/constants";

export type BookingState =
  | { ok: true; bookingId: string; low: number; high: number; mode: StoreMode }
  | { ok: false; error: string }
  | null;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

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

  const estimate = estimatePrice({
    serviceType: serviceType as ServiceType,
    frequency: frequency as Frequency,
    bedrooms,
    bathrooms,
  });

  try {
    const store = getStore();

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
    });

    return {
      ok: true,
      bookingId,
      low: estimate.low,
      high: estimate.high,
      mode: store.mode,
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
    await store.saveAbandonedLead({
      fullName: payload.fullName?.trim() || null,
      email: payload.email?.trim().toLowerCase() || null,
      phone: payload.phone?.trim() || null,
      zipCode: payload.zipCode?.trim() || null,
      lastStepReached: payload.lastStepReached || null,
      partialData: payload.partialData ?? null,
    });
    return { ok: true };
  } catch (err) {
    console.error("[saveAbandonedLead] no se pudo guardar el lead:", err);
    return { ok: false };
  }
}
