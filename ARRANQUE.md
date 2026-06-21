# Arranque del Sistema de Reservas — Sage Essence
### Checklist de setup + Prompt de arranque para Claude Code

---

## PARTE 1 — CHECKLIST DE SETUP

Hacé esto ANTES de empezar a construir. El orden importa: lo que no depende de Katerina va primero, así arrancás sin esperar a nadie.

### Ahora mismo (no necesitás nada de Katerina)

- [ ] **Node.js instalado** (versión 18 o superior). Verificá con `node -v`.
- [ ] **VSCode + Claude Code** funcionando (ya lo tenés de Prata de 15).
- [ ] **Carpeta del proyecto** creada y vacía, ej. `sage-booking/`.
- [ ] **Cuenta Supabase** (supabase.com). Creá un proyecto nuevo llamado "sage-essence". Es gratis para empezar.
  - Guardá a mano: `SUPABASE_URL` y `SUPABASE_ANON_KEY` (Settings → API).
  - Guardá también la `SERVICE_ROLE_KEY` (para operaciones del servidor, NO la expongas en el cliente).
- [ ] **Cuenta Vercel** (vercel.com) para el deploy. Conectala a tu GitHub.
- [ ] **Cuenta Resend** (resend.com) para los emails. Plan gratis alcanza para empezar.
  - Guardá la `RESEND_API_KEY`.
  - Para enviar desde `hello@thesageessence.com` vas a tener que verificar el dominio (registros DNS). Esto puede esperar a la Fase 4.

### Cuando avances a Fase 2 (necesitás datos de Katerina/Felipe)

- [ ] **Cuenta Stripe** a nombre de Sage Essence LLC.
  - Necesitás de ellos: datos fiscales del negocio (EIN) y cuenta bancaria.
  - El trámite de verificación tarda unos días: pedíselos YA aunque todavía no llegues a esta fase.
  - Guardá: `STRIPE_SECRET_KEY` y `STRIPE_PUBLISHABLE_KEY` (en modo test al principio).

### Cuando avances a Fase 3

- [ ] **Google Cloud project** con Calendar API habilitada.
  - Necesitás acceso/autorización a la cuenta de Google de Sage.
  - Configurar OAuth o service account con el calendario compartido.

### Regla de oro de las llaves

Todas las keys van en un archivo `.env.local` (nunca en el código, nunca subido a GitHub). Claude Code te va a ir diciendo cuál necesita en cada paso. Tenelas en un lugar seguro (un gestor de contraseñas, no un .txt suelto).

---

## PARTE 2 — PROMPT DE ARRANQUE FASE 1

Copiá y pegá esto al inicio de tu sesión de Claude Code, junto con el archivo `spec-sistema-reservas-sage.md`:

---

> Estoy construyendo un sistema de reservas para Sage Essence, un servicio de limpieza no tóxica en Austin. Te adjunto el spec técnico completo (`spec-sistema-reservas-sage.md`). Vamos a construir SOLO la Fase 1 en esta sesión. No avances a pagos, calendario ni emails todavía.
>
> **Stack:** Next.js (App Router) + Supabase + TypeScript + Tailwind. Hosting en Vercel.
>
> **Objetivo de la Fase 1:** que una reserva real se guarde en Supabase.
>
> **Pasos concretos que necesito:**
>
> 1. Inicializá un proyecto Next.js con App Router, TypeScript y Tailwind en la carpeta actual.
> 2. Instalá y configurá el cliente de Supabase (`@supabase/supabase-js`). Las variables van en `.env.local` (te las paso cuando me digas exactamente cuáles necesitás).
> 3. Creá las migraciones SQL para estas tablas en Supabase: `customers`, `bookings`, `abandoned_leads`, `email_log`, `extra_charges` (los esquemas están en el spec adjunto, sección "Modelo de datos"). Dame el SQL para correr en el editor de Supabase.
> 4. Construí un formulario de reserva multi-paso que replique los campos del estimador de la web actual: servicio (deep/general/move_in_out/one_time), frecuencia (weekly/biweekly/monthly/once), recámaras, baños, extras (texto libre), nombre, email, teléfono, zip, alergias/sensibilidades.
> 5. Replicá la lógica de cálculo de precio del estimador actual: descuentos por frecuencia (weekly 20%, biweekly 15%, monthly 10%, once sin descuento). Mostrá el rango estimado.
> 6. Al hacer submit: buscá si el cliente ya existe por email; si no, creá el registro en `customers`. Después creá el registro en `bookings` con status `pending`, guardando el estimado y los extras pedidos.
> 7. Aplicá la estética de marca Apothecary: paleta ink #1F1810, sage #77816B, sage-deep #5E674F, amber #A67C52, amber-light #C9A372, cream #F2EEE5, paper #F7F4EC. Tipografías Cormorant Garamond (títulos) + Jost (body). Sin emojis. Sin guiones largos (—) en el texto visible: usá comas, dos puntos o punto seguido.
>
> **Importante:**
> - Trabajá paso por paso. Después de cada paso, explicame qué hiciste y qué necesito hacer yo (correr un comando, pegar una llave, etc.).
> - Decime exactamente qué variables de entorno necesito y dónde conseguir cada una.
> - No hardcodees ninguna llave secreta en el código.
> - Al terminar la Fase 1, quiero poder hacer una reserva de prueba y verla aparecer en la tabla `bookings` de Supabase.
>
> Empezá por el paso 1 y esperá mi confirmación antes de seguir al 2.

---

## PARTE 3 — CONSEJOS PARA NO FRUSTRARTE

- **Validá cada paso antes de seguir.** Si el paso 3 (tablas) no funcionó, no sigas al 4. Arreglá primero.
- **Algo va a fallar la primera vez.** Es normal, le pasa a todos. Una variable mal escrita, un import faltante. Copiá el error y pegáselo a Claude Code, que lo arregla.
- **Andá fase por fase.** No intentes pagos + calendario + emails de una. El spec está dividido por algo.
- **Hacé commits seguido** (git) cuando algo funcione, así tenés puntos de retorno.
- **La Fase 1 no necesita a Katerina.** Podés tenerla funcionando hoy mismo. Pedí los datos de Stripe en paralelo para no frenar después.

---

## RECORDATORIO DE PROPIEDAD

Todas las cuentas (Supabase, Stripe, Google, Resend, Vercel) a nombre de Sage Essence, no de Ocean IT. Esto cumple la cláusula del contrato: el cliente es dueño de todo, sin ataduras a la agencia.
