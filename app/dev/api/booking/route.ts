import { createBooking } from "@/app/actions";
import { getStore, supabaseConfigured } from "@/lib/store";

// Endpoint de DESARROLLO para testear la Server Action createBooking de punta a
// punta (validacion + store) sin pasar por el navegador. Deshabilitado en
// produccion. GET devuelve estado; POST crea una reserva desde JSON.

function devOnly(): Response | null {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }
  return null;
}

export async function GET() {
  const blocked = devOnly();
  if (blocked) return blocked;

  const store = getStore();
  const bookings = await store.listBookings(20);
  return Response.json({
    mode: store.mode,
    supabaseConfigured: supabaseConfigured(),
    count: bookings.length,
    bookings,
  });
}

export async function POST(req: Request) {
  const blocked = devOnly();
  if (blocked) return blocked;

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const fd = new FormData();
  for (const [k, v] of Object.entries(body)) {
    if (v == null) continue;
    fd.set(k, String(v));
  }
  const result = await createBooking(null, fd);
  const status = result && result.ok ? 200 : 400;
  return Response.json(result, { status });
}
