import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
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

// Store de DESARROLLO: persiste en .data/db.json (gitignored). Permite probar
// todo el flujo sin Supabase ni costo. No usar en produccion: sin concurrencia
// real, sin backups, sin seguridad. La capa Supabase lo reemplaza 1 a 1.

const DATA_DIR = process.env.SAGE_DATA_DIR || path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

type Db = {
  customers: Array<
    {
      id: string;
      email: string;
      full_name: string;
      phone: string | null;
      zip_code: string | null;
      allergies_sensitivities: string | null;
      marketing_opt_in: boolean;
      stripe_customer_id: string | null;
      created_at: string;
    }
  >;
  bookings: StoredBooking[];
  extra_charges: Array<Record<string, unknown>>;
  abandoned_leads: Array<Record<string, unknown>>;
  email_log: Array<Record<string, unknown>>;
};

const EMPTY_DB: Db = {
  customers: [],
  bookings: [],
  extra_charges: [],
  abandoned_leads: [],
  email_log: [],
};

// Lock en proceso: serializa los read-modify-write para evitar pisar el archivo
// cuando llegan dos requests casi a la vez.
let chain: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => {});
  return run;
}

async function readDb(): Promise<Db> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<Db>;
    return { ...EMPTY_DB, ...parsed };
  } catch {
    return structuredClone(EMPTY_DB);
  }
}

async function writeDb(db: Db): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

export class FileStore implements DataStore {
  readonly mode = "local" as const;

  findOrCreateCustomer(input: CustomerInput): Promise<string> {
    return withLock(async () => {
      const db = await readDb();
      const email = input.email.toLowerCase();
      const existing = db.customers.find((c) => c.email === email);

      const fields = {
        full_name: input.fullName,
        phone: input.phone ?? null,
        zip_code: input.zipCode ?? null,
        allergies_sensitivities: input.allergies ?? null,
        marketing_opt_in: input.marketingOptIn,
      };

      if (existing) {
        Object.assign(existing, fields);
        await writeDb(db);
        return existing.id;
      }

      const id = randomUUID();
      db.customers.push({
        id,
        email,
        stripe_customer_id: null,
        created_at: new Date().toISOString(),
        ...fields,
      });
      await writeDb(db);
      return id;
    });
  }

  createBooking(customerId: string, input: BookingInput): Promise<string> {
    return withLock(async () => {
      const db = await readDb();
      const id = randomUUID();
      db.bookings.push({
        id,
        customer_id: customerId,
        service_type: input.serviceType,
        frequency: input.frequency,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        requested_extras: input.requestedExtras ?? null,
        estimate_low: input.estimateLow,
        estimate_high: input.estimateHigh,
        final_amount: null,
        status: "pending",
        stripe_payment_intent_id: null,
        google_calendar_event_id: null,
        created_at: new Date().toISOString(),
      });
      await writeDb(db);
      return id;
    });
  }

  saveAbandonedLead(input: LeadInput): Promise<string> {
    return withLock(async () => {
      const db = await readDb();
      const id = randomUUID();
      db.abandoned_leads.push({
        id,
        full_name: input.fullName ?? null,
        email: input.email ?? null,
        phone: input.phone ?? null,
        zip_code: input.zipCode ?? null,
        last_step_reached: input.lastStepReached ?? null,
        partial_data: input.partialData ?? null,
        notified_to_sage: false,
        created_at: new Date().toISOString(),
      });
      await writeDb(db);
      return id;
    });
  }

  listBookings(limit = 50): Promise<StoredBooking[]> {
    return withLock(async () => {
      const db = await readDb();
      return [...db.bookings]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, limit);
    });
  }

  getBooking(id: string): Promise<BookingWithCustomer | null> {
    return withLock(async () => {
      const db = await readDb();
      const booking = db.bookings.find((b) => b.id === id);
      if (!booking) return null;
      const c = db.customers.find((x) => x.id === booking.customer_id);
      return {
        ...booking,
        customer: c
          ? {
              id: c.id,
              email: c.email,
              full_name: c.full_name,
              phone: c.phone,
              zip_code: c.zip_code,
              allergies_sensitivities: c.allergies_sensitivities,
              stripe_customer_id: c.stripe_customer_id,
            }
          : null,
      };
    });
  }

  setCustomerStripeId(
    customerId: string,
    stripeCustomerId: string,
  ): Promise<void> {
    return withLock(async () => {
      const db = await readDb();
      const c = db.customers.find((x) => x.id === customerId);
      if (c) {
        c.stripe_customer_id = stripeCustomerId;
        await writeDb(db);
      }
    });
  }

  updateBookingPayment(
    bookingId: string,
    fields: BookingPaymentFields,
  ): Promise<void> {
    return withLock(async () => {
      const db = await readDb();
      const b = db.bookings.find((x) => x.id === bookingId);
      if (!b) return;
      if (fields.status !== undefined) b.status = fields.status;
      if (fields.finalAmount !== undefined) b.final_amount = fields.finalAmount;
      if (fields.stripePaymentIntentId !== undefined) {
        b.stripe_payment_intent_id = fields.stripePaymentIntentId;
      }
      await writeDb(db);
    });
  }

  addExtraCharge(bookingId: string, input: ExtraChargeInput): Promise<string> {
    return withLock(async () => {
      const db = await readDb();
      const id = randomUUID();
      db.extra_charges.push({
        id,
        booking_id: bookingId,
        description: input.description,
        amount: input.amount,
        stripe_charge_id: input.stripeChargeId ?? null,
        charged_at: new Date().toISOString(),
      });
      await writeDb(db);
      return id;
    });
  }

  setBookingCalendarEvent(bookingId: string, eventId: string): Promise<void> {
    return withLock(async () => {
      const db = await readDb();
      const b = db.bookings.find((x) => x.id === bookingId);
      if (b) {
        b.google_calendar_event_id = eventId;
        await writeDb(db);
      }
    });
  }
}
