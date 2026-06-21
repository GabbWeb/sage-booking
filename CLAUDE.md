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
  elige `getStore()` según haya llaves de Supabase. La Server Action no sabe
  cuál usa.
- Reservas: `app/actions.ts` (`createBooking`, `saveAbandonedLead`).
- Precios: `lib/pricing.ts` (constantes PROVISORIAS, ver `PROGRESO.md`).
- Emails (Fase 4): plantillas en `lib/emails/`, preview en `/dev/emails`. No
  envían todavía.
- Herramientas dev bajo `/dev` (no enlazadas al sitio, el endpoint de test se
  apaga en producción).

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
