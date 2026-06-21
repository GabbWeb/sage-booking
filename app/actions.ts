"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { estimatePrice } from "@/lib/pricing";
import {
  SERVICE_VALUES,
  FREQUENCY_VALUES,
  type ServiceType,
  type Frequency,
} from "@/lib/constants";

export type BookingState =
  | { ok: true; bookingId: string; low: number; high: number }
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
    const supabase = createAdminClient();

    // ---- Buscar cliente existente por email, o crearlo ----
    const { data: existing, error: findErr } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();
    if (findErr) throw findErr;

    let customerId = existing?.id as string | undefined;

    const customerFields = {
      full_name: fullName,
      phone: phone || null,
      zip_code: zipCode || null,
      allergies_sensitivities: allergies || null,
      marketing_opt_in: marketingOptIn,
    };

    if (!customerId) {
      const { data: created, error: insErr } = await supabase
        .from("customers")
        .insert({ email, ...customerFields })
        .select("id")
        .single();
      if (insErr) throw insErr;
      customerId = created.id;
    } else {
      // Mantenemos en ficha los datos de contacto mas recientes.
      const { error: updErr } = await supabase
        .from("customers")
        .update(customerFields)
        .eq("id", customerId);
      if (updErr) throw updErr;
    }

    // ---- Crear la reserva en estado pending ----
    const { data: booking, error: bookErr } = await supabase
      .from("bookings")
      .insert({
        customer_id: customerId,
        service_type: serviceType,
        frequency,
        bedrooms,
        bathrooms,
        requested_extras: requestedExtras || null,
        estimate_low: estimate.low,
        estimate_high: estimate.high,
        status: "pending",
      })
      .select("id")
      .single();
    if (bookErr) throw bookErr;

    return {
      ok: true,
      bookingId: booking.id,
      low: estimate.low,
      high: estimate.high,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "We could not save your booking.";
    return { ok: false, error: message };
  }
}
