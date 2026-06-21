import Link from "next/link";
import { getStore } from "@/lib/store";
import { serviceLabel } from "@/lib/constants";
import { formatUsd } from "@/lib/pricing";

export const dynamic = "force-dynamic";

// Pagina a la que Stripe redirige tras un pago exitoso. La confirmacion real de
// la reserva la hace el webhook; aca solo agradecemos y mostramos el estado.
export default async function BookingSuccess({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>;
}) {
  const { booking: bookingId } = await searchParams;
  let booking = null;
  if (bookingId) {
    try {
      booking = await getStore().getBooking(bookingId);
    } catch {
      booking = null;
    }
  }

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col items-center px-5 py-20">
      <div className="w-full rounded-2xl border border-sage/30 bg-cream p-10 text-center shadow-sm">
        <p className="font-display text-sm uppercase tracking-[0.2em] text-amber">
          Payment received
        </p>
        <h1 className="mt-3 text-4xl text-ink">Thank you</h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-sage-deep">
          Your booking is confirmed. We will reach out shortly to settle the date
          and any details.
          {booking && (
            <>
              {" "}
              You booked a {serviceLabel(booking.service_type).toLowerCase()} for{" "}
              {booking.bedrooms} bed, {booking.bathrooms} bath.
            </>
          )}
        </p>
        {booking?.final_amount != null && (
          <p className="mt-4 font-display text-2xl text-ink">
            {formatUsd(booking.final_amount)} paid
          </p>
        )}
        {bookingId && (
          <p className="mt-6 text-xs uppercase tracking-widest text-sage">
            Reference {bookingId.slice(0, 8)}
          </p>
        )}
        <div className="mt-8">
          <Link
            href="/"
            className="text-sm uppercase tracking-widest text-sage-deep hover:text-ink"
          >
            Back to start
          </Link>
        </div>
      </div>
    </main>
  );
}
