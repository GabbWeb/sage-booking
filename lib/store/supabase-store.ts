import { createAdminClient } from "@/lib/supabase/admin";
import type {
  BookingInput,
  CustomerInput,
  DataStore,
  LeadInput,
  StoredBooking,
} from "./types";

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
      .select(
        "id, customer_id, service_type, frequency, bedrooms, bathrooms, requested_extras, estimate_low, estimate_high, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as StoredBooking[];
  }
}
