@AGENTS.md

# Sage Essence, sistema de reservas

Sistema de reservas a medida para Sage Essence LLC (limpieza no tóxica, Austin).
Se construye por fases (ver `SPEC.md`); estado actual en `PROGRESO.md`.

## Reglas del proyecto

- **Estética de marca:** paleta Apothecary (tokens en `app/globals.css`),
  tipografías Cormorant Garamond (títulos) y Jost (cuerpo). Sin emojis y sin
  guiones largos (—) en texto visible. Usar comas o dos puntos.
- **Propiedad:** todas las cuentas (Supabase, Stripe, Google, Resend, Vercel) a
  nombre de Sage Essence, no de la agencia. No incurrir en costos sin OK
  explícito de la dueña.
- **Secretos:** solo en `.env.local` (gitignored). Nunca hardcodear llaves.

## Arquitectura

- Next.js 16 App Router + TypeScript + Tailwind v4 + Supabase.
- Capa de datos: `lib/store/` con interfaz común y dos implementaciones,
  `SupabaseStore` (producción) y `FileStore` (`.data/`, demo sin cuenta). La
  elige `getStore()` según haya llaves de Supabase. Las Server Actions no saben
  cuál usa.
- Patrón general: cada integración externa tiene un `xConfigured()` y cae a un
  modo seguro si faltan llaves (store local, email a consola, sin pago). Así
  todo el flujo corre sin cuentas.
- Reservas y acciones: `app/actions.ts` (`createBooking`, `saveAbandonedLead`,
  `addExtraChargeToBooking`, `syncBookingToCalendar`).
- Precios: `lib/pricing.ts` (constantes PROVISORIAS, ver `PROGRESO.md`).
- Pagos (Fase 2): `lib/stripe/` (Checkout + cargo extra off_session), webhook en
  `app/api/stripe/webhook`. Ver `docs/PHASE2-STRIPE.md`.
- Calendar (Fase 3): `lib/google/` (OAuth, sin SDK). Ver `docs/PHASE3-GOOGLE.md`.
- Emails (Fase 4): plantillas en `lib/emails/templates.ts`, envío en `send.ts`
  (Resend o log), `dispatch.ts` con dedupe; crons en `app/api/cron/*`.
- Panel admin (Fase 6): `/login` + `/admin` (auth por cookie en `lib/auth.ts`).
- Herramientas dev bajo `/dev` (no enlazadas al sitio, se apagan en producción).

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # build de producción
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
npm run verify     # tests de precio y de la capa de datos
```

Después de cambios, correr al menos `npm run typecheck` y `npm run verify`.
Los scripts en `scripts/` son `.mts` y corren con Node directo (type stripping);
por eso están excluidos del `tsconfig` e importan con extensión `.ts` explícita.
