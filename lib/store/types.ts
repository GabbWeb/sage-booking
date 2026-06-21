// Contrato comun de la capa de datos. Dos implementaciones lo cumplen:
//  - SupabaseStore: produccion, escribe en Postgres (Supabase).
//  - FileStore: desarrollo, escribe en .data/db.json (sin cuenta ni costo).
// La eleccion la hace getStore() segun haya o no variables de Supabase.

export type StoreMode = "supabase" | "local";

export type CustomerInput = {
  fullName: string;
  email: string;
  phone?: string | null;
  zipCode?: string | null;
  allergies?: string | null;
  marketingOptIn: boolean;
};

export type BookingInput = {
  serviceType: string;
  frequency: string;
  bedrooms: number;
  bathrooms: number;
  requestedExtras?: string | null;
  estimateLow: number;
  estimateHigh: number;
};

export type LeadInput = {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  zipCode?: string | null;
  lastStepReached?: string | null;
  partialData?: Record<string, unknown> | null;
};

export type StoredBooking = {
  id: string;
  customer_id: string | null;
  service_type: string;
  frequency: string;
  bedrooms: number;
  bathrooms: number;
  requested_extras: string | null;
  estimate_low: number;
  estimate_high: number;
  status: string;
  created_at: string;
};

export interface DataStore {
  readonly mode: StoreMode;
  /** Devuelve el id del cliente, creandolo si no existe (match por email). */
  findOrCreateCustomer(input: CustomerInput): Promise<string>;
  /** Crea una reserva en estado pending y devuelve su id. */
  createBooking(customerId: string, input: BookingInput): Promise<string>;
  /** Registra un lead abandonado y devuelve su id. */
  saveAbandonedLead(input: LeadInput): Promise<string>;
  /** Solo para panel/diagnostico: ultimas reservas. */
  listBookings(limit?: number): Promise<StoredBooking[]>;
}
