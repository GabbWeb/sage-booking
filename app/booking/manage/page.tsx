import type { Metadata } from "next";
import Link from "next/link";
import { getStore } from "@/lib/store";
import { serviceLabel } from "@/lib/constants";
import RescheduleForm from "@/components/RescheduleForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Manage your booking | Sage Essence",
  robots: { index: false, follow: false },
};

function whenText(scheduled: string | null): string {
  if (!scheduled) return "to be confirmed";
  const m = scheduled.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return m ? `${m[1]} at ${m[2]}` : scheduled;
}

export default async function ManageBooking({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  let booking = null;
  let takenSlots: string[] = [];
  if (id) {
    try {
      const store = getStore();
      booking = await store.getBooking(id);
      const bookings = await store.listBookings(500);
      takenSlots = bookings
        .filter(
          (b) => b.status === "confirmed" && b.scheduled_date && b.id !== id,
        )
        .map((b) => (b.scheduled_date as string).slice(0, 16));
    } catch {
      booking = null;
    }
  }

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col px-5 py-14 sm:py-20">
      <header className="mb-8 text-center">
        <p className="font-display text-sm uppercase tracking-[0.25em] text-amber">
          Sage Essence
        </p>
        <h1 className="mt-3 text-4xl leading-tight text-ink sm:text-5xl">
          Manage your booking
        </h1>
      </header>

      {!booking ? (
        <div className="rounded-2xl border border-sage/25 bg-paper p-8 text-center">
          <p className="text-sage-deep">
            We could not find that booking. Please use the link from your
            confirmation, or contact us and we will help you reschedule.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="text-sm uppercase tracking-widest text-sage-deep hover:text-ink"
            >
              Back to start
            </Link>
          </div>
        </div>
      ) : (
        <section className="rounded-2xl border border-sage/20 bg-paper p-6 shadow-sm sm:p-9">
          <div className="mb-6 rounded-xl border border-sage/25 bg-cream px-5 py-4">
            <p className="text-sm text-sage-deep">
              {serviceLabel(booking.service_type)} · currently{" "}
              {whenText(booking.scheduled_date)}
            </p>
          </div>
          <p className="mb-6 text-sm leading-relaxed text-sage-deep">
            Pick a new day and time below. We will confirm the change and update
            your visit.
          </p>
          <RescheduleForm bookingId={booking.id} takenSlots={takenSlots} />
        </section>
      )}

      <footer className="mt-10 text-center text-xs uppercase tracking-widest text-sage">
        Sage Essence LLC, Austin TX
      </footer>
    </main>
  );
}
