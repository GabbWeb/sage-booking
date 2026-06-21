import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente de Supabase SOLO para el servidor, usando la service_role key.
// Omite RLS, asi que NUNCA debe importarse en un Client Component ni exponerse
// al navegador. Se usa unicamente dentro de Server Actions / Route Handlers.
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan variables de Supabase. Completa NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
