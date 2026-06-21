# Sage Essence — Sistema de Reservas

Carpeta del proyecto. Construido por Ocean IT para Sage Essence LLC (Austin, TX).

## Cómo empezar

1. Abrí esta carpeta en VSCode: File → Open Folder → elegí esta carpeta.
2. Abrí Claude Code dentro de VSCode.
3. Leé `ARRANQUE.md` (checklist de cuentas + el prompt para pegar).
4. Pegá el prompt de arranque de la Fase 1 en Claude Code, junto con `SPEC.md`.
5. Seguí fase por fase. No avances hasta que cada fase funcione.

## Archivos de referencia

- `SPEC.md` — especificación técnica completa (las 6 fases, modelo de datos, todo).
- `ARRANQUE.md` — checklist de setup y el prompt de arranque de la Fase 1.
- `.env.local.example` — plantilla de variables de entorno (copiala a `.env.local` y completá).

## Regla de oro

Todas las cuentas (Supabase, Stripe, Google, Resend, Vercel) van a nombre de Sage Essence, no de la agencia. Las llaves secretas van en `.env.local`, NUNCA subidas a GitHub.
