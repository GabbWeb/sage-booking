import Link from "next/link";
import { getStore } from "@/lib/store";
import { serviceLabel, frequencyLabel } from "@/lib/constants";
import { formatUsd } from "@/lib/pricing";
import ExtraChargeForm from "@/components/admin/ExtraChargeForm";

export const dynamic = "force-dynamic";

const STATUSES = ["all", "pending", "confirmed", "completed", "cancelled"];

function whenText(scheduled: string | null): string {
  if (!scheduled) return "Date to confirm";
  const m = scheduled.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return m ? `${m[1]} ${m[2]}` : scheduled;
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = status && STATUSES.includes(status) ? status : "all";

  const store = getStore();
  const [allBookings, leads, customers] = await Promise.all([
    store.listBookings(300),
    store.listAbandonedLeads(100),
    store.listCustomers(2000),
  ]);

  const bookings =
    active === "all"
      ? allBookings
      : allBookings.filter((b) => b.status === active);

  return (
    <div className="flex flex-col gap-12">
      {/* Reservas */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl text-ink">Bookings</h2>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map((s) => (
              <Link
                key={s}
                href={s === "all" ? "/admin" : `/admin?status=${s}`}
                className={`rounded-full px-3 py-1 text-xs uppercase tracking-widest transition ${
                  active === s
                    ? "bg-sage-deep text-paper"
                    : "bg-cream text-sage-deep hover:bg-sage/20"
                }`}
              >
                {s}
              </Link>
            ))}
          </div>
        </div>

        {bookings.length === 0 && (
          <p className="text-sage-deep">No bookings here yet.</p>
        )}

        <div className="flex flex-col gap-3">
          {bookings.map((b) => (
            <article
              key={b.id}
              className="rounded-xl border border-sage/25 bg-paper p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg text-ink">
                    {serviceLabel(b.service_type)}
                    <span className="ml-2 text-sm text-sage">
                      {frequencyLabel(b.frequency)}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-sage-deep">
                    {whenText(b.scheduled_date)} · {b.bedrooms} bd, {b.bathrooms}{" "}
                    ba
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-sage/15 px-3 py-1 text-xs uppercase tracking-widest text-sage-deep">
                    {b.status}
                  </span>
                  <p className="mt-2 text-sm text-ink">
                    {b.final_amount != null
                      ? `${formatUsd(b.final_amount)} paid`
                      : `${formatUsd(b.estimate_low)} to ${formatUsd(b.estimate_high)}`}
                  </p>
                </div>
              </div>
              {b.requested_extras && (
                <p className="mt-2 text-sm text-sage-deep">
                  Extras: {b.requested_extras}
                </p>
              )}
              <ExtraChargeForm bookingId={b.id} />
            </article>
          ))}
        </div>
      </section>

      {/* Leads abandonados */}
      <section>
        <h2 className="mb-4 text-2xl text-ink">Abandoned leads</h2>
        {leads.length === 0 ? (
          <p className="text-sage-deep">No abandoned leads.</p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-sage/25">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream text-xs uppercase tracking-widest text-sage">
                <tr>
                  <th className="px-4 py-3 font-normal">Name</th>
                  <th className="px-4 py-3 font-normal">Email</th>
                  <th className="px-4 py-3 font-normal">Phone</th>
                  <th className="px-4 py-3 font-normal">Left at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage/15">
                {leads.map((l) => (
                  <tr key={l.id} className="text-ink">
                    <td className="px-4 py-3">{l.full_name || "-"}</td>
                    <td className="px-4 py-3">{l.email || "-"}</td>
                    <td className="px-4 py-3">{l.phone || "-"}</td>
                    <td className="px-4 py-3 text-sage-deep">
                      {l.last_step_reached || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Clientes / export */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl text-ink">Customers</h2>
          <a
            href="/admin/export/customers"
            className="rounded-full bg-cream px-4 py-2 text-xs uppercase tracking-widest text-sage-deep hover:bg-sage/20"
          >
            Export CSV ({customers.length})
          </a>
        </div>
        <p className="mt-2 text-sm text-sage-deep">
          {customers.filter((c) => c.marketing_opt_in).length} opted in to
          marketing.
        </p>
      </section>
    </div>
  );
}
