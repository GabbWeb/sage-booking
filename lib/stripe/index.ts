// Andamiaje de Stripe (Fase 2). Por ahora SOLO detecta configuracion: no
// procesa pagos ni instala el SDK todavia. El flujo completo se implementa
// cuando Sage tenga su cuenta Stripe propia y llaves de TEST (ver
// docs/PHASE2-STRIPE.md). Mantener esto sin efectos secundarios.

export function stripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  );
}

// Cuando se active la Fase 2:
//  1. npm install stripe
//  2. crear getStripe() que devuelva un cliente con STRIPE_SECRET_KEY y
//     apiVersion fija.
//  3. mover aca: createPaymentIntent (con setup_future_usage: 'off_session'),
//     createOrGetCustomer, y addExtraCharge (cobro off-session sobre la
//     tarjeta guardada).
// Hasta entonces, cualquier intento de cobrar debe fallar de forma explicita.
export function assertStripeReady(): never {
  throw new Error(
    "Stripe todavia no esta activo (Fase 2). Ver docs/PHASE2-STRIPE.md.",
  );
}
