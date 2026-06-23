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
| 2 | Pagos con Stripe | **Estructura completa** (Checkout, guardado de tarjeta, cargo extra, webhook). Falta probar con llaves de TEST y luego pasar a live. Ver `docs/PHASE2-STRIPE.md`. |
| 3 | Google Calendar | **Funcionando.** OAuth con la cuenta de Sage; el cliente elige fecha y se crea el evento. Ver `docs/PHASE3-GOOGLE.md`. |
| 4 | Emails automáticos | **Funcionando** (los 3 emails + disparadores + cron + dedupe). En modo log hasta cargar `RESEND_API_KEY` y verificar el dominio del remitente. |
| 5 | Leads abandonados | **Completa.** Captura + email de aviso a Sage. |
| 6 | Panel de administración | **Funcionando.** Login en `/login`, panel en `/admin`: reservas (filtro por estado), cargo extra, leads, export CSV de clientes. |

## Lo único que falta para cerrar la Fase 1 de verdad

Conectar Supabase. Cuando tengas la **cuenta gratis de Sage** (recordá: una
cuenta nueva tiene el primer proyecto en $0; el costo de antes era por reusar la
org de la agencia):

1. Crear el proyecto en supabase.com.
2. Correr `supabase/migrations/0001_init.sql` en el SQL Editor.
3. Pegar las 3 llaves en `.env.local` (ver `.env.local.example`).
4. `npm run dev` y hacer una reserva: ahora se guarda en Supabase, no en demo.

No hay que cambiar nada de código: el sistema detecta las llaves y cambia solo
de modo demo a modo Supabase.

## Pendiente de Katerina y Felipe (pedir cuanto antes)

- **Stripe** a nombre de Sage Essence LLC: necesita EIN y cuenta bancaria. La
  verificación tarda días.
- **El estimador real:** el archivo `sage-essence-v7.html` no está en el repo.
  Los precios de `lib/pricing.ts` son provisorios (solo los descuentos por
  frecuencia son los definitivos). Pasalo para replicar la fórmula exacta.
- Acceso a la cuenta Google de Sage (Fase 3) y dominio para emails (Fase 4).

## Notas técnicas

- Stack: Next.js 16 (App Router) + TypeScript + Tailwind v4 + Supabase.
- La capa de datos (`lib/store/`) tiene dos implementaciones intercambiables:
  Supabase (producción) y archivo local (demo). La lógica de negocio no sabe
  cuál usa.
- Sin emojis ni guiones largos en texto visible (regla de marca), verificado.
- `.env.local` nunca se sube a git (sí se versiona `.env.local.example`).
