# Fase 2: Pagos con Stripe

Estado: **implementado y verificado en modo test.** Código en `lib/stripe/` y
`app/api/stripe/webhook`. Falta solo configurar el webhook en producción y pasar
a llaves live (ver abajo).

## Lo que falta para ir a producción

1. En el dashboard de Stripe: **Developers > Webhooks > Add endpoint**,
   apuntando a `https://TU-DOMINIO/api/stripe/webhook`, suscribir el evento
   `checkout.session.completed`. Copiar el secreto `whsec_...` a
   `STRIPE_WEBHOOK_SECRET` (en Vercel).
2. Probar con tarjeta de test `4242 4242 4242 4242` (cualquier fecha futura y
   CVC): reservar, pagar, y confirmar que la reserva queda `confirmed`.
3. Cuando todo funcione, cambiar `sk_test_`/`pk_test_` por las llaves `live`.

## Por qué todavía no

1. El spec pide validar la Fase 1 con datos reales (una reserva en Supabase)
   antes de saltar a pagos.
2. Stripe debe estar a nombre de **Sage Essence LLC**, no de la agencia
   (cláusula contractual). La verificación tarda días: pedir EIN + cuenta
   bancaria a Katerina y Felipe cuanto antes.
3. No tiene sentido escribir código de cobro que no se puede probar sin llaves
   de TEST. Mejor dejarlo diseñado y activarlo con la cuenta lista.

## Variables de entorno (ya previstas en `.env.local.example`)

```
STRIPE_SECRET_KEY=            # sk_test_... al principio
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=  # pk_test_...
STRIPE_WEBHOOK_SECRET=        # whsec_... del endpoint de webhook
```

## Requerimiento clave de Katerina

Cobrar al reservar **y poder agregar un cargo extra después** sobre la misma
tarjeta. Eso exige guardar el método de pago para uso off-session.

## Flujo propuesto

1. **Al confirmar la reserva**
   - Crear (o reutilizar) un Stripe Customer; guardar `stripe_customer_id` en
     `customers`.
   - Crear un PaymentIntent con `setup_future_usage: 'off_session'` para dejar
     la tarjeta lista para cobros posteriores.
   - Cobrar el estimado/monto confirmado. Guardar `stripe_payment_intent_id`
     en `bookings`.
2. **Webhook** (`/api/stripe/webhook`)
   - Verificar firma con `STRIPE_WEBHOOK_SECRET`.
   - En `payment_intent.succeeded`: pasar `bookings.status` a `confirmed` y
     disparar el email de preparación (Fase 4).
3. **Cargo extra después** (`addExtraCharge`)
   - Cobro off-session sobre la tarjeta guardada del Customer.
   - Registrar en `extra_charges` (description, amount, stripe_charge_id).

## Pasos de implementación

1. `npm install stripe`
2. `getStripe()` en `lib/stripe/index.ts` con `apiVersion` fija.
3. Server Action `createPaymentIntent(bookingId)`.
4. Route Handler del webhook con verificación de firma (raw body).
5. Server Action `addExtraCharge(bookingId, description, amount)`.
6. UI de pago con Stripe Payment Element en el último paso del formulario.
7. Probar todo en **modo test** antes de tocar claves de producción.

## Notas

- Los fondos van directo a la cuenta de Sage, no de la agencia.
- El cliente del store ya tiene los campos `stripe_customer_id`,
  `stripe_payment_intent_id` y la tabla `extra_charges` listos en la migración
  `supabase/migrations/0001_init.sql`.
