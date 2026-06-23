import type Stripe from "stripe";
import { constructWebhookEvent } from "@/lib/stripe";
import { getStore } from "@/lib/store";
import { googleCalendarConfigured } from "@/lib/google/calendar";
import { syncBookingToCalendar } from "@/app/actions";
import { sendBookingEmail } from "@/lib/emails/dispatch";

// Webhook de Stripe. Cuando un pago se completa, confirma la reserva. Verifica
// la firma con STRIPE_WEBHOOK_SECRET usando el cuerpo crudo del request.
// Configurar el endpoint en Stripe: Developers > Webhooks > /api/stripe/webhook
// y suscribir el evento checkout.session.completed.

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(rawBody, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid signature";
    return new Response(`Webhook error: ${message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId =
        session.metadata?.bookingId ?? session.client_reference_id ?? null;

      if (bookingId) {
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? undefined);

        const store = getStore();

        if (session.metadata?.kind === "extra") {
          // Cargo extra pagado por el cliente (link de pago): lo registramos en
          // la reserva, sin tocar su estado ni el pago principal.
          await store.addExtraCharge(bookingId, {
            description: session.metadata.extraDescription ?? "Extra charge",
            amount:
              session.amount_total != null
                ? session.amount_total / 100
                : Number(session.metadata.extraAmount ?? 0),
            stripeChargeId: paymentIntentId ?? null,
          });
        } else {
          await store.updateBookingPayment(bookingId, {
            status: "confirmed",
            stripePaymentIntentId: paymentIntentId,
            finalAmount:
              session.amount_total != null
                ? session.amount_total / 100
                : undefined,
          });

          // Reserva pagada: ahora si la agendamos en el calendario.
          if (googleCalendarConfigured()) {
            const booking = await store.getBooking(bookingId);
            if (booking?.scheduled_date) {
              await syncBookingToCalendar({
                bookingId,
                startISO: booking.scheduled_date,
              });
            }
          }

          // Email de preparacion (Fase 4). Best effort, no duplica.
          await sendBookingEmail(store, bookingId, "prep");
        }
      }
    }
  } catch (err) {
    console.error("[stripe webhook] error procesando evento:", err);
    return new Response("Handler error", { status: 500 });
  }

  return Response.json({ received: true });
}
