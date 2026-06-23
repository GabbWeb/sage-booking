import Stripe from "stripe";

// Integracion de Stripe (Fase 2). Usa Stripe Checkout (pagina hosteada) para el
// pago inicial: maneja PCI y guarda la tarjeta para cobros posteriores
// off-session (el "cargo extra despues" que pidio Katerina).
//
// Todo el dinero va a la cuenta de Sage. Probar SIEMPRE con llaves de TEST
// (sk_test_/pk_test_) hasta confirmar el flujo; recien ahi pasar a live.

export function stripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );
}

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Falta STRIPE_SECRET_KEY en .env.local (Fase 2). Ver docs/PHASE2-STRIPE.md.",
    );
  }
  client = new Stripe(key);
  return client;
}

/** Crea (o reutiliza) el Stripe Customer de un cliente, por email. */
export async function ensureStripeCustomer(params: {
  existingId: string | null;
  email: string;
  name: string;
}): Promise<string> {
  const stripe = getStripe();
  if (params.existingId) return params.existingId;
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
  });
  return customer.id;
}

/**
 * Crea una Checkout Session para el pago inicial de una reserva. Guarda la
 * tarjeta en el Customer para cobros off-session futuros.
 */
export async function createCheckoutSession(params: {
  bookingId: string;
  stripeCustomerId: string;
  amountCents: number;
  description: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; url: string | null }> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: params.stripeCustomerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: params.amountCents,
          product_data: { name: params.description },
        },
      },
    ],
    // Guarda la tarjeta para cobros posteriores sin el cliente presente.
    payment_intent_data: { setup_future_usage: "off_session" },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.bookingId,
    metadata: { bookingId: params.bookingId },
  });
  return { id: session.id, url: session.url };
}

/**
 * Crea una Checkout Session para un cargo extra que el cliente aprueba y paga el
 * mismo (menos invasivo que cobrarle la tarjeta guardada). Devuelve la URL del
 * link de pago para enviarselo. El cargo se registra recien cuando paga, via el
 * webhook (metadata.kind = "extra").
 */
export async function createExtraChargeCheckout(params: {
  bookingId: string;
  stripeCustomerId: string;
  amountCents: number;
  description: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; url: string | null }> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: params.stripeCustomerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: params.amountCents,
          product_data: { name: params.description },
        },
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.bookingId,
    metadata: {
      bookingId: params.bookingId,
      kind: "extra",
      extraDescription: params.description,
      extraAmount: String(params.amountCents / 100),
    },
  });
  return { id: session.id, url: session.url };
}

/**
 * Cobra un monto sobre la tarjeta guardada del cliente, sin que este presente
 * (el "cargo extra despues"). Devuelve el id del PaymentIntent/charge.
 */
export async function chargeSavedCard(params: {
  stripeCustomerId: string;
  amountCents: number;
  description: string;
}): Promise<string> {
  const stripe = getStripe();

  // Tomar la primera tarjeta guardada del cliente.
  const methods = await stripe.paymentMethods.list({
    customer: params.stripeCustomerId,
    type: "card",
    limit: 1,
  });
  const pm = methods.data[0];
  if (!pm) {
    throw new Error(
      "El cliente no tiene una tarjeta guardada para cobrar el extra.",
    );
  }

  const intent = await stripe.paymentIntents.create({
    customer: params.stripeCustomerId,
    payment_method: pm.id,
    amount: params.amountCents,
    currency: "usd",
    description: params.description,
    off_session: true,
    confirm: true,
  });
  return intent.id;
}

/** Verifica la firma del webhook y devuelve el evento tipado. */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
): Stripe.Event {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Falta STRIPE_WEBHOOK_SECRET en .env.local.");
  }
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
