# Sistema de Reservas — Sage Essence
### Especificación técnica para Claude Code

> **Cómo usar este documento:** pegá este spec al inicio de una sesión de Claude Code en VSCode. Construí por fases, en orden. No avances a la siguiente fase hasta que la anterior esté funcionando y probada. Validá cada fase antes de seguir.

---

## CONTEXTO DEL PROYECTO

**Cliente:** Sage Essence LLC — servicio de limpieza no tóxica en Austin, TX.
**Dueños:** Katerina y Felipe Colmenares.
**Agencia:** Ocean IT (Gabby).

**Cláusula contractual crítica:** todo lo generado (código, base de datos, infraestructura) es propiedad del cliente. No se usan plataformas de terceros tipo Booking Koala que aten al cliente a una mensualidad. Por eso se construye a medida.

**Web actual:** existe una landing (`sage-essence-v7.html`) con un estimador que calcula precio pero NO toma reservas reales. El botón "Request this clean" hoy es un placeholder. Este sistema reemplaza ese placeholder con un flujo de reserva real.

**Estética de marca (respetar en toda UI):**
- Paleta Apothecary: ink `#1F1810`, sage `#77816B`, sage-deep `#5E674F`, amber `#A67C52`, amber-light `#C9A372`, cream `#F2EEE5`, paper `#F7F4EC`
- Tipografías: Cormorant Garamond (títulos), Jost 300–400 (body)
- Sin fondos negros puros, sin emojis, sin tipografías fuera de las dos. Sin guiones largos (—) en texto visible.

---

## STACK TÉCNICO

- **Framework:** Next.js (App Router)
- **Base de datos + Auth:** Supabase (Postgres)
- **Pagos:** Stripe
- **Calendario:** Google Calendar API
- **Emails:** Resend (recomendado por simplicidad con Next.js) o SendGrid
- **Hosting:** Vercel
- **Programación de emails diferidos:** Vercel Cron Jobs o Supabase scheduled functions

---

## REQUERIMIENTOS DEL CLIENTE (lo que pidió Katerina, textual, traducido a funcionalidad)

1. **Pagos con tarjeta** al reservar, con posibilidad de **agregar un cargo extra después** (si la limpieza requirió un adicional).
2. **Vincular la reserva con Google Calendar** automáticamente.
3. **Tres emails automáticos:**
   - Al reservar: "preparate para la limpieza" + checklist + instrucciones.
   - 2 días antes: recordatorio.
   - Después de la limpieza: agradecimiento + pedido de reseña/tips.
4. **Guardar info de clientes** para email/text marketing posterior.
5. **Captura de leads abandonados:** si alguien empieza la reserva y no la termina, enviar sus datos como lead al correo de Sage.

---

## MODELO DE DATOS (Supabase)

```sql
-- Clientes (CRM básico para marketing futuro)
create table customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  zip_code text,
  allergies_sensitivities text,
  stripe_customer_id text,        -- para cobros futuros sobre tarjeta guardada
  marketing_opt_in boolean default true,
  created_at timestamptz default now()
);

-- Reservas
create table bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  service_type text not null,     -- deep | general | move_in_out | one_time
  frequency text not null,        -- weekly | biweekly | monthly | once
  bedrooms int,
  bathrooms int,
  requested_extras text,          -- campo libre del estimador ("inside the fridge", etc.)
  estimate_low numeric,
  estimate_high numeric,
  final_amount numeric,           -- precio final confirmado
  scheduled_date timestamptz,
  status text default 'pending',  -- pending | confirmed | completed | cancelled
  stripe_payment_intent_id text,
  google_calendar_event_id text,
  created_at timestamptz default now()
);

-- Cargos extra (el "cargo después" que pidió Katerina)
create table extra_charges (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  description text not null,       -- "Inside the fridge", "Extra bathroom", etc.
  amount numeric not null,
  stripe_charge_id text,
  charged_at timestamptz default now()
);

-- Leads abandonados (reserva empezada y no terminada)
create table abandoned_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  zip_code text,
  last_step_reached text,          -- en qué paso del estimador abandonó
  partial_data jsonb,              -- todo lo que alcanzó a llenar
  notified_to_sage boolean default false,
  created_at timestamptz default now()
);

-- Log de emails enviados (para no duplicar y para auditoría)
create table email_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  email_type text not null,        -- prep | reminder_2days | thankyou
  sent_at timestamptz default now()
);
```

---

## CONSTRUCCIÓN POR FASES

### FASE 1 — Base de datos + captura de reservas
**Objetivo:** que una reserva real se guarde en Supabase.

- Configurar proyecto Supabase, crear las tablas de arriba.
- Conectar el formulario del estimador (los campos ya existen en `sage-essence-v7.html`: servicio, frecuencia, recámaras, baños, extras como texto libre, nombre, email, teléfono, zip, alergias).
- Al hacer submit en "Request this clean", crear un registro en `customers` (o encontrar el existente por email) y un registro en `bookings` con status `pending`.
- **Validar:** una reserva de prueba aparece en Supabase con todos los campos.

### FASE 2 — Pagos con Stripe
**Objetivo:** cobrar al reservar y poder cobrar extras después.

- Integrar Stripe Checkout o Payment Element para el pago inicial.
- **Importante:** guardar el `stripe_customer_id` y el método de pago para poder hacer cargos posteriores (esto es lo del "cargo extra después" que pidió Katerina). Usar Stripe Customer + guardar payment method off-session.
- Crear un endpoint/función para agregar un cargo extra a una reserva existente (registra en `extra_charges` y cobra sobre la tarjeta guardada).
- Al pagar con éxito, cambiar `bookings.status` a `confirmed`.
- **Validar:** pago de prueba (modo test de Stripe) confirma la reserva; un cargo extra de prueba se cobra sobre la tarjeta guardada.
- **Nota de cumplimiento:** Sage debe tener cuenta Stripe propia (no de la agencia). Los fondos van directo al cliente.

### FASE 3 — Google Calendar
**Objetivo:** cada reserva confirmada crea un evento en el calendar de Sage.

- Configurar Google Calendar API (OAuth con la cuenta Google de Sage, o service account con calendario compartido).
- Al confirmarse una reserva (status `confirmed`), crear el evento: título con el servicio + nombre del cliente, fecha/hora, dirección, notas (alergias, extras pedidos).
- Guardar el `google_calendar_event_id` en la reserva (para poder actualizar/cancelar después).
- **Validar:** una reserva confirmada aparece en el Google Calendar de Sage con todos los datos.

### FASE 4 — Emails automáticos
**Objetivo:** las tres secuencias que pidió Katerina.

Configurar Resend (o SendGrid). Diseñar las plantillas con la estética de marca (Cormorant + Jost, paleta apothecary, sin emojis, sin guiones largos). Todos los emails en inglés (público de Austin).

- **Email 1 — Al reservar (inmediato):** "How to prepare for your clean". Incluye el checklist de preparación e instrucciones (despejar superficies, dónde dejar llaves, mascotas, etc.). Disparar al confirmarse la reserva. Registrar en `email_log` tipo `prep`.
- **Email 2 — Recordatorio (2 días antes):** disparado por cron job que corre diario y busca reservas con `scheduled_date` a 2 días. Registrar tipo `reminder_2days`. Verificar contra `email_log` para no duplicar.
- **Email 3 — Post-limpieza (agradecimiento + reseña):** disparado cuando la reserva pasa a `completed` (o por cron, el día después de `scheduled_date`). Agradece y pide tips/reseña (link a Google review). Registrar tipo `thankyou`.
- **Validar:** los tres emails se envían en el momento correcto y se ven bien en mobile y desktop.

### FASE 5 — Captura de leads abandonados
**Objetivo:** si alguien empieza la reserva y no la termina, mandar el lead a Sage.

- En el flujo del estimador, ir guardando datos parciales (al menos cuando el usuario ingresa email o teléfono).
- Si el usuario no llega al submit final en X tiempo (o cierra), registrar en `abandoned_leads` con lo que alcanzó a llenar y en qué paso quedó.
- Disparar un email a la casilla de Sage (`hello@thesageessence.com`) con los datos del lead para seguimiento manual.
- **Cuidado con privacidad:** solo capturar datos que el usuario efectivamente ingresó. Incluir opt-in claro.
- **Validar:** abandonar una reserva de prueba a mitad genera un lead y un email a Sage.

### FASE 6 — Panel de administración (Sage)
**Objetivo:** que Katerina y Felipe vean y gestionen todo.

- Vista protegida (Supabase Auth) con: lista de reservas (filtrable por status), detalle de cada cliente, botón para agregar cargo extra, lista de leads abandonados, export de clientes (CSV) para marketing.
- **Validar:** Katerina puede entrar, ver reservas, agregar un cargo extra y exportar la lista de clientes.

---

## CONSIDERACIONES IMPORTANTES

- **Variables de entorno:** todas las claves (Stripe, Supabase, Google, Resend) en `.env.local`, nunca en el código. Documentar cuáles se necesitan.
- **Modo test primero:** todo Stripe en modo test hasta que el flujo completo funcione. Recién ahí pasar a producción con las claves reales de Sage.
- **Propiedad:** todas las cuentas (Stripe, Supabase, Google, Resend, Vercel) deben estar a nombre de Sage Essence, no de la agencia. Esto cumple la cláusula contractual.
- **Marketing (requerimiento 4):** la tabla `customers` con `marketing_opt_in` es la base para el email/text marketing futuro. El envío de campañas de marketing es un proyecto aparte (no parte de este sistema transaccional).
- **Text marketing:** el SMS marketing que mencionó Katerina requiere un proveedor adicional (Twilio) y cumplimiento legal (consentimiento, opt-out). Dejarlo para una fase posterior.

---

## ORDEN RECOMENDADO DE EJECUCIÓN

1. Fase 1 (datos) → sin esto no hay nada
2. Fase 2 (pagos) → el corazón del negocio
3. Fase 3 (calendar) → operación diaria
4. Fase 4 (emails) → experiencia del cliente
5. Fase 5 (leads) → optimización de conversión
6. Fase 6 (panel) → gestión

No intentar todo de una. Cada fase funcionando y probada antes de la siguiente.
