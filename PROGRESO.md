# Progreso del Sistema de Reservas, Sage Essence

Última actualización: 2026-06-21. Resumen de lo construido y lo que sigue.
Para el detalle técnico de cada fase, ver `SPEC.md`.

## Cómo verlo funcionando ahora mismo (sin cuentas ni costo)

El sistema ya funciona en **modo demo**: si no hay Supabase conectado, guarda
las reservas en un archivo local (`.data/db.json`) en vez de la base de datos.
Así podés ver TODO el flujo hoy.

```bash
npm install        # solo la primera vez
npm run dev        # arranca en http://localhost:3000
```

- `http://localhost:3000` — el formulario de reserva (lo que ve el cliente).
- `http://localhost:3000/dev` — herramientas internas (no enlazado al sitio).
- `http://localhost:3000/dev/bookings` — las reservas guardadas.
- `http://localhost:3000/dev/emails` — preview de los 3 emails automáticos.

Cuando completes una reserva de prueba vas a ver la pantalla de confirmación, y
la reserva aparece en `/dev/bookings`. En modo demo dice "saved locally".

## Comandos útiles

```bash
npm run dev        # desarrollo
npm run build      # build de producción (valida tipos y compila)
npm run lint       # linter
npm run typecheck  # solo chequeo de tipos
npm run verify     # tests de precio y de la capa de datos
```

## Estado por fase

| Fase | Qué es | Estado |
|------|--------|--------|
| 1 | Reservas guardadas (datos) | **Completa y funcionando con Supabase real.** |
| 2 | Pagos con Stripe | **Funcionando y verificado** en modo test (Checkout crea el cobro; webhook confirma la reserva). Falta configurar el webhook en el dominio de producción y luego pasar a llaves live. Ver `docs/PHASE2-STRIPE.md`. |
| 3 | Google Calendar | **Funcionando.** OAuth con la cuenta de Sage; el cliente elige fecha y se crea el evento. Ver `docs/PHASE3-GOOGLE.md`. |
| 4 | Emails automáticos | **Funcionando** (los 3 emails + disparadores + cron + dedupe). En modo log hasta cargar `RESEND_API_KEY` y verificar el dominio del remitente. |
| 5 | Leads abandonados | **Completa.** Captura + email de aviso a Sage. |
| 6 | Panel de administración | **Funcionando.** Login en `/login`, panel en `/admin`: reservas (filtro por estado), cargo extra, leads, export CSV de clientes. |

## El panel de administración

- Entrá a `/login` con la contraseña que está en `.env.local` (`ADMIN_PASSWORD`).
- En `/admin` ves: reservas (filtrables por estado), botón de cargo extra por
  reserva, leads abandonados, y export CSV de clientes para marketing.
- Cambiá la contraseña editando `ADMIN_PASSWORD` en `.env.local` (y desplegando
  la variable en Vercel). El login se puede migrar a Supabase Auth más adelante.

## Lo que falta (todo es configuración de salida a producción, no código)

1. **Webhook de Stripe en producción:** en el dashboard de Stripe, crear un
   endpoint apuntando a `https://TU-DOMINIO/api/stripe/webhook` (evento
   `checkout.session.completed`), copiar el `whsec_...` a `STRIPE_WEBHOOK_SECRET`.
   Después de probar, cambiar las llaves test por las `live`. La integración ya
   está verificada (Checkout + webhook).
2. **El estimador real:** `sage-essence-v7.html` no está en el repo. Los precios
   de `lib/pricing.ts` son provisorios (solo los descuentos por frecuencia son
   definitivos). Pasalo para replicar la fórmula exacta.

Ya resuelto: Supabase conectado, Google Calendar autorizado, Resend con dominio
verificado (emails reales), panel admin con contraseña.

## Deploy a Vercel (cuando quieras publicarlo)

1. Subir el repo a GitHub (a nombre de Sage) y conectar el proyecto en Vercel.
2. Cargar en Vercel todas las variables de `.env.local` (Settings, Environment
   Variables). Sin estas, cada fase cae a su modo seguro (demo / log / sin pago).
3. Agregar el `redirect_uri` de producción en el OAuth client de Google
   (`https://TU-DOMINIO/api/google/oauth/callback`) y re-autorizar.
4. Apuntar el webhook de Stripe al dominio de producción.
5. Los cron jobs de emails ya están en `vercel.json` (corren solos en Vercel).

## Notas técnicas

- Stack: Next.js 16 (App Router) + TypeScript + Tailwind v4 + Supabase.
- La capa de datos (`lib/store/`) tiene dos implementaciones intercambiables:
  Supabase (producción) y archivo local (demo). La lógica de negocio no sabe
  cuál usa.
- Sin emojis ni guiones largos en texto visible (regla de marca), verificado.
- `.env.local` nunca se sube a git (sí se versiona `.env.local.example`).
