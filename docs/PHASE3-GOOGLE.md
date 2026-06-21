# Fase 3: Google Calendar (diseño)

Estado: **estructura lista, sin credenciales**. Código en `lib/google/calendar.ts`
(sin dependencias externas) y acción `syncBookingToCalendar` en `app/actions.ts`.

## Objetivo

Cuando Sage confirma una reserva con fecha y hora, crear automáticamente un
evento en el Google Calendar del negocio, con el servicio, el cliente y las
notas (alergias, extras, contacto). Guardar el `google_calendar_event_id` para
poder actualizar o cancelar después.

## Enfoque: service account (recomendado)

Es lo más simple para que el servidor cree eventos solo, sin que haya un usuario
presente ni manejo de refresh tokens.

### Setup (una vez)

1. En **Google Cloud Console**, crear (o usar) un proyecto.
2. Habilitar la **Google Calendar API**.
3. Crear una **service account** y generar una **clave JSON**.
4. Del JSON sacar `client_email` y `private_key`.
5. En el **Google Calendar de Sage**, compartir el calendario con ese
   `client_email`, con permiso **"Hacer cambios en los eventos"**.
6. El `GOOGLE_CALENDAR_ID` suele ser el email del calendario (o `primary`).

### Variables (.env.local)

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=...@...iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=...@group.calendar.google.com
```

La `GOOGLE_PRIVATE_KEY` va entre comillas y con los saltos como `\n` literales
(el código los normaliza).

## Cómo funciona el código

- `googleCalendarConfigured()` detecta si están las 3 variables.
- `createCalendarEvent({ summary, description, location, startISO, endISO })`
  firma un JWT de la service account con `node:crypto`, pide un access token y
  hace POST a la REST API del calendario. Sin librerías externas.
- `syncBookingToCalendar({ bookingId, startISO, endISO, location })` arma el
  evento desde la reserva y el cliente, lo crea y guarda el id.

## Falta para activarlo

1. Cargar las credenciales de la service account (arriba).
2. **Definir la fecha y hora de la reserva.** El formulario hoy no pide fecha;
   la idea es que Sage la confirme desde el panel (Fase 6) y ahí se dispara
   `syncBookingToCalendar`. Si se quiere que el cliente elija fecha al reservar,
   hay que agregar ese paso al formulario.
3. Probar con una reserva real contra el calendario de Sage.

## Notas

- Zona horaria fijada en `America/Chicago` (Austin). Cambiar en
  `lib/google/calendar.ts` si hiciera falta.
- La columna `google_calendar_event_id` ya existe en la migración
  `supabase/migrations/0001_init.sql`.
