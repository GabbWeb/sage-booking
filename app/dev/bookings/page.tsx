import { getStore, supabaseConfigured } from "@/lib/store";
import { serviceLabel, frequencyLabel } from "@/lib/constants";
import { formatUsd } from "@/lib/pricing";

// Visor de reservas de solo lectura. Base del panel de administracion (Fase 6).
// Lee del store activo (Supabase o local). Siempre dinamico: datos mutables.
export const dynamic = "force-dynamic";

export default async function BookingsView() {
  const store = getStore();
  let bookings: Awaited<ReturnType<typeof store.listBookings>> = [];
  let error: string | null = null;
  try {
    bookings = await store.listBookings(100);
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load bookings.";
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <header className="mb-8">
        <p className="font-display text-sm uppercase tracking-[0.25em] text-amber">
          Sage Essence, dev
        </p>
        <h1 className="mt-2 text-4xl text-ink">Bookings</h1>
        <p className="mt-3 text-sm text-sage-deep">
          Source:{" "}
          <span className="text-ink">
            {store.mode === "supabase"
              ? "Supabase (live)"
              : "local .data file (demo)"}
          </span>
          {!supabaseConfigured() && (
            <span className="text-amber">
              {"  "}Connect Supabase to store bookings for real.
            </span>
          )}
        </p>
      </header>

      {error && (
        <p className="rounded-xl border border-amber/40 bg-amber-light/20 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      {!error && bookings.length === 0 && (
        <p className="text-sage-deep">
          No bookings yet. Make one on the home page to see it here.
        </p>
      )}

      {bookings.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-sage/30">
          <table className="w-full text-left text-sm">
            <thead className="bg-cream text-xs uppercase tracking-widest text-sage">
              <tr>
                <th className="px-4 py-3 font-normal">When</th>
                <th className="px-4 py-3 font-normal">Service</th>
                <th className="px-4 py-3 font-normal">Home</th>
                <th className="px-4 py-3 font-normal">Estimate</th>
                <th className="px-4 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage/15">
              {bookings.map((b) => (
                <tr key={b.id} className="text-ink">
                  <td className="px-4 py-3 text-sage-deep">
                    {new Date(b.created_at).toLocaleString("en-US")}
                  </td>
                  <td className="px-4 py-3">
                    {serviceLabel(b.service_type)}
                    <span className="block text-xs text-sage">
                      {frequencyLabel(b.frequency)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sage-deep">
                    {b.bedrooms} bd, {b.bathrooms} ba
                  </td>
                  <td className="px-4 py-3">
                    {formatUsd(b.estimate_low)} to {formatUsd(b.estimate_high)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-sage/15 px-3 py-1 text-xs uppercase tracking-widest text-sage-deep">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
