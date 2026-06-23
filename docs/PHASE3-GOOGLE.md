# Fase 3: Google Calendar (OAuth)

Estado: **estructura lista, falta autorizar**. Código en `lib/google/` y acción
`syncBookingToCalendar` en `app/actions.ts`.

## Por qué OAuth y no service account

La organización de Sage (thesageessence.com) tiene una política de seguridad que
bloquea crear llaves de service account (`iam.disableServiceAccountKeyCreation`).
OAuth queda dentro de la cuenta de Sage y no choca con esa política, sin depender
del administrador de la organización.

## Objetivo

Cuando Sage confirma una reserva con fecha y hora, crear un evento en el Google
Calendar del negocio (servicio, cliente, notas) y guardar el
`google_calendar_event_id`.

## Setup

### 1. Crear el OAuth client (en Google Cloud, cuenta de Sage)

1. Habilitar la **Google Calendar API** (ya hecho).
2. **APIs & Services > OAuth consent screen**: tipo **Internal** (es un Workspace),
   completar nombre y email de soporte. Agregar el scope
   `.../auth/calendar.events`.
3. **APIs & Services > Credentials > Create credentials > OAuth client ID**:
   - Tipo: **Web application**.
   - **Authorized redirect URIs**: agregar
     `http://localhost:3000/api/google/oauth/callback`
     (y la URL de producción cuando se despliegue, ej.
     `https://TU-DOMINIO/api/google/oauth/callback`).
4. Copiar **Client ID** y **Client secret**.

### 2. Cargar y autorizar

1. En `.env.local`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y
   `GOOGLE_CALENDAR_ID` (el ID del calendario de Sage, de Configuración del
   calendario).
2. `npm run dev`, abrir **http://localhost:3000/api/google/oauth/start** logueado
   con la cuenta de Sage, aceptar el consentimiento.
3. La página de retorno muestra el **refresh token**: pegarlo en `.env.local`
   como `GOOGLE_REFRESH_TOKEN` y reiniciar el server.

## Cómo funciona el código

- `lib/google/oauth.ts`: arma la URL de consentimiento y canjea el code por
  tokens (rutas `/api/google/oauth/start` y `/callback`, solo dev).
- `lib/google/calendar.ts`: con el refresh token pide access tokens y crea
  eventos por REST. Sin librerías externas.
- `syncBookingToCalendar({ bookingId, startISO, endISO, location })` arma el
  evento desde la reserva y el cliente y guarda el id.

## Falta para activarlo

1. Crear el OAuth client y autorizar (arriba).
2. **Definir la fecha y hora de la reserva.** El formulario hoy no la pide; la
   idea es que Sage la confirme desde el panel (Fase 6) y ahí se dispara
   `syncBookingToCalendar`.
3. Probar con una reserva real contra el calendario de Sage.

## Notas

- Zona horaria fijada en `America/Chicago` (Austin), en `lib/google/calendar.ts`.
- La columna `google_calendar_event_id` ya existe en la migración
  `supabase/migrations/0001_init.sql`.
- Consent screen **Internal** evita verificación de Google y da refresh tokens
  durables.
