import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  BookingInput,
  CustomerInput,
  DataStore,
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
      created_at: string;
    }
  >;
  bookings: StoredBooking[];
  abandoned_leads: Array<Record<string, unknown>>;
  email_log: Array<Record<string, unknown>>;
};

const EMPTY_DB: Db = {
  customers: [],
  bookings: [],
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
        status: "pending",
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
}
