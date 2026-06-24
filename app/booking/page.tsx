import type { Metadata } from "next";
import BookingForm, { type BookingPrefill } from "@/components/BookingForm";
import { getStore } from "@/lib/store";

export const metadata: Metadata = {
  title: "Book a Clean | Sage Essence",
  description:
    "Get an instant estimate and book non-toxic home cleaning in Austin, TX. Pick a date and reserve in minutes.",
  alternates: { canonical: "/booking" },
};

// Lee un valor de la query como string (la primera ocurrencia si llega repetido).
function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function toNum(v: string | string[] | undefined): number | undefined {
  const s = one(v);
  if (s == null || s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default async function Booking({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;

  // Horarios ya ocupados por reservas confirmadas (pagadas), para no ofrecerlos
  // y evitar superposicion. Formato "YYYY-MM-DDTHH:mm".
  let takenSlots: string[] = [];
  try {
    const bookings = await getStore().listBookings(500);
    takenSlots = bookings
      .filter((b) => b.status === "confirmed" && b.scheduled_date)
      .map((b) => (b.scheduled_date as string).slice(0, 16));
  } catch {
    takenSlots = [];
  }

  // Handoff desde el landing: viene con ?prefill=1 y los datos ya elegidos.
  const prefill: BookingPrefill | null =
    one(sp.prefill) === "1"
      ? {
          serviceType: one(sp.serviceType),
          frequency: one(sp.frequency),
          bedrooms: toNum(sp.bedrooms),
          bathrooms: toNum(sp.bathrooms),
          squareFeet: toNum(sp.squareFeet),
          addOns: (one(sp.addOns) ?? "")
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean),
          requestedExtras: one(sp.requestedExtras),
          fullName: one(sp.fullName),
          email: one(sp.email),
          phone: one(sp.phone),
          zipCode: one(sp.zipCode),
          allergies: one(sp.allergies),
        }
      : null;

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col px-5 py-14 sm:py-20">
      <header className="mb-10 text-center">
        <p className="font-display text-sm uppercase tracking-[0.25em] text-amber">
          Sage Essence
        </p>
        <h1 className="mt-3 text-5xl leading-tight text-ink sm:text-6xl">
          Book your clean
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-sage-deep">
          Non toxic, considered cleaning for Austin homes. Tell us about your
          space and we will send a tailored estimate.
        </p>
      </header>

      <section className="rounded-2xl border border-sage/20 bg-paper p-6 shadow-sm sm:p-9">
        <BookingForm prefill={prefill} takenSlots={takenSlots} />
      </section>

      <footer className="mt-10 text-center text-xs uppercase tracking-widest text-sage">
        Sage Essence LLC, Austin TX
      </footer>
    </main>
  );
}
