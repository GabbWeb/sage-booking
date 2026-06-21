-- Sage Essence | Sistema de Reservas
-- Migracion 0001: tablas base (Fase 1).
-- Corre este SQL en Supabase: Dashboard -> SQL Editor -> New query -> Run.

-- ---------------------------------------------------------------------------
-- Clientes (CRM basico para marketing futuro)
-- ---------------------------------------------------------------------------
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  zip_code text,
  allergies_sensitivities text,
  stripe_customer_id text,          -- para cobros futuros sobre tarjeta guardada (Fase 2)
  marketing_opt_in boolean default true,
  created_at timestamptz default now()
);

create index if not exists customers_email_idx on customers (email);

-- ---------------------------------------------------------------------------
-- Reservas
-- ---------------------------------------------------------------------------
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers (id) on delete set null,
  service_type text not null,       -- deep | general | move_in_out | one_time
  frequency text not null,          -- weekly | biweekly | monthly | once
  bedrooms int,
  bathrooms int,
  requested_extras text,            -- campo libre del estimador ("inside the fridge", etc.)
  estimate_low numeric,
  estimate_high numeric,
  final_amount numeric,             -- precio final confirmado (Fase 2)
  scheduled_date timestamptz,
  status text default 'pending',    -- pending | confirmed | completed | cancelled
  stripe_payment_intent_id text,
  google_calendar_event_id text,
  created_at timestamptz default now()
);

create index if not exists bookings_customer_idx on bookings (customer_id);
create index if not exists bookings_status_idx on bookings (status);
create index if not exists bookings_scheduled_idx on bookings (scheduled_date);

-- ---------------------------------------------------------------------------
-- Cargos extra (el "cargo despues" que pidio Katerina) (Fase 2)
-- ---------------------------------------------------------------------------
create table if not exists extra_charges (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings (id) on delete cascade,
  description text not null,         -- "Inside the fridge", "Extra bathroom", etc.
  amount numeric not null,
  stripe_charge_id text,
  charged_at timestamptz default now()
);

create index if not exists extra_charges_booking_idx on extra_charges (booking_id);

-- ---------------------------------------------------------------------------
-- Leads abandonados (reserva empezada y no terminada) (Fase 5)
-- ---------------------------------------------------------------------------
create table if not exists abandoned_leads (
  id uuid primary key default gen_random_uuid(),
  full_name text,
  email text,
  phone text,
  zip_code text,
  last_step_reached text,            -- en que paso del estimador abandono
  partial_data jsonb,                -- todo lo que alcanzo a llenar
  notified_to_sage boolean default false,
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Log de emails enviados (para no duplicar y para auditoria) (Fase 4)
-- ---------------------------------------------------------------------------
create table if not exists email_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings (id) on delete cascade,
  email_type text not null,          -- prep | reminder_2days | thankyou
  sent_at timestamptz default now()
);

create index if not exists email_log_booking_idx on email_log (booking_id);

-- ---------------------------------------------------------------------------
-- Seguridad: activamos RLS y NO creamos politicas publicas.
-- El servidor accede con la service_role key (omite RLS), asi el cliente
-- anonimo no puede leer ni escribir estas tablas directamente.
-- ---------------------------------------------------------------------------
alter table customers enable row level security;
alter table bookings enable row level security;
alter table extra_charges enable row level security;
alter table abandoned_leads enable row level security;
alter table email_log enable row level security;
