import { createAdminClient } from "@/lib/supabase/admin";
import type {
  BookingInput,
  BookingPaymentFields,
  BookingWithCustomer,
  CustomerInput,
  DataStore,
  ExtraChargeInput,
  LeadInput,
  StoredBooking,
} from "./types";

const BOOKING_COLUMNS =
  "id, customer_id, service_type, frequency, bedrooms, bathrooms, requested_extras, estimate_low, estimate_high, final_amount, status, stripe_payment_intent_id, google_calendar_event_id, created_at";

const CUSTOMER_COLUMNS =
  "id, email, full_name, phone, zip_code, allergies_sensitivities, stripe_customer_id";

// Store de PRODUCCION: escribe en Postgres via la service_role key. Misma
// interfaz que FileStore, asi la Server Action no sabe ni le importa cual usa.

export class SupabaseStore implements DataStore {
  readonly mode = "supabase" as const;

  async findOrCreateCustomer(input: CustomerInput): Promise<string> {
    const supabase = createAdminClient();
    const email = input.email.toLowerCase();

    const { data: existing, error: findErr } = await supabase
      .from("customers")
      .select("id")
      .eq("email", email)
      .limit(1)
      .maybeSingle();
    if (findErr) throw findErr;

    const fields = {
      full_name: input.fullName,
      phone: input.phone ?? null,
      zip_code: input.zipCode ?? null,
      allergies_sensitivities: input.allergies ?? null,
      marketing_opt_in: input.marketingOptIn,
    };

    if (existing?.id) {
      const { error: updErr } = await supabase
        .from("customers")
        .update(fields)
        .eq("id", existing.id);
      if (updErr) throw updErr;
      return existing.id as string;
    }

    const { data: created, error: insErr } = await supabase
      .from("customers")
      .insert({ email, ...fields })
      .select("id")
      .single();
    if (insErr) throw insErr;
    return created.id as string;
  }

  async createBooking(
    customerId: string,
    input: BookingInput,
  ): Promise<string> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        customer_id: customerId,
        service_type: input.serviceType,
        frequency: input.frequency,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        requested_extras: input.requestedExtras ?? null,
        estimate_low: input.estimateLow,
        estimate_high: input.estimateHigh,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  }

  async saveAbandonedLead(input: LeadInput): Promise<string> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("abandoned_leads")
      .insert({
        full_name: input.fullName ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        zip_code: input.zipCode ?? null,
        last_step_reached: input.lastStepReached ?? null,
        partial_data: input.partialData ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  }

  async listBookings(limit = 50): Promise<StoredBooking[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("bookings")
      .select(BOOKING_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as StoredBooking[];
  }

  async getBooking(id: string): Promise<BookingWithCustomer | null> {
    const supabase = createAdminClient();
    const { data: booking, error } = await supabase
      .from("bookings")
      .select(BOOKING_COLUMNS)
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!booking) return null;

    let customer: BookingWithCustomer["customer"] = null;
    if (booking.customer_id) {
      const { data: c, error: cErr } = await supabase
        .from("customers")
        .select(CUSTOMER_COLUMNS)
        .eq("id", booking.customer_id)
        .maybeSingle();
      if (cErr) throw cErr;
      customer = (c as BookingWithCustomer["customer"]) ?? null;
    }
    return { ...(booking as StoredBooking), customer };
  }

  async setCustomerStripeId(
    customerId: string,
    stripeCustomerId: string,
  ): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("customers")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", customerId);
    if (error) throw error;
  }

  async updateBookingPayment(
    bookingId: string,
    fields: BookingPaymentFields,
  ): Promise<void> {
    const supabase = createAdminClient();
    const patch: Record<string, unknown> = {};
    if (fields.status !== undefined) patch.status = fields.status;
    if (fields.finalAmount !== undefined) patch.final_amount = fields.finalAmount;
    if (fields.stripePaymentIntentId !== undefined) {
      patch.stripe_payment_intent_id = fields.stripePaymentIntentId;
    }
    if (Object.keys(patch).length === 0) return;
    const { error } = await supabase
      .from("bookings")
      .update(patch)
      .eq("id", bookingId);
    if (error) throw error;
  }

  async addExtraCharge(
    bookingId: string,
    input: ExtraChargeInput,
  ): Promise<string> {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("extra_charges")
      .insert({
        booking_id: bookingId,
        description: input.description,
        amount: input.amount,
        stripe_charge_id: input.stripeChargeId ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  }

  async setBookingCalendarEvent(
    bookingId: string,
    eventId: string,
  ): Promise<void> {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("bookings")
      .update({ google_calendar_event_id: eventId })
      .eq("id", bookingId);
    if (error) throw error;
  }
}
