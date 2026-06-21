import type { DataStore } from "./types";
import { FileStore } from "./file-store";
import { SupabaseStore } from "./supabase-store";

export * from "./types";

let cached: DataStore | null = null;

export function supabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

// Elige el store segun el entorno. Si hay credenciales de Supabase usa Postgres;
// si no, cae al store local en archivo para que el flujo funcione igual (demo).
export function getStore(): DataStore {
  if (cached) return cached;
  cached = supabaseConfigured() ? new SupabaseStore() : new FileStore();
  if (cached.mode === "local") {
    console.warn(
      "[store] Supabase no configurado: usando store local en .data/db.json (modo demo).",
    );
  }
  return cached;
}
