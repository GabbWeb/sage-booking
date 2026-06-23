// Integracion con Google Calendar (Fase 3) por OAuth, SIN dependencias externas.
// Usa un refresh token de la cuenta de Sage para pedir access tokens y habla con
// la REST API por fetch. Elegimos OAuth (no service account) porque la org de
// Sage bloquea la creacion de llaves de service account por politica.
//
// Setup (ver docs/PHASE3-GOOGLE.md):
//  1. Crear un OAuth client (Web) en Google Cloud y configurar el consent screen.
//  2. Autorizar una vez con la cuenta de Sage en /api/google/oauth/start para
//     obtener el refresh token.
//  3. Cargar en .env.local: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
//     GOOGLE_REFRESH_TOKEN, GOOGLE_CALENDAR_ID.

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const TIME_ZONE = "America/Chicago"; // Austin, TX

export function googleCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REFRESH_TOKEN &&
      process.env.GOOGLE_CALENDAR_ID,
  );
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Faltan credenciales de Google OAuth en .env.local.");
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

export type CalendarEvent = {
  summary: string;
  description?: string;
  location?: string;
  startISO: string; // ISO 8601
  endISO: string;
};

/** Crea un evento en el calendario de Sage y devuelve su id. */
export async function createCalendarEvent(
  event: CalendarEvent,
): Promise<string> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error("Falta GOOGLE_CALENDAR_ID.");

  const token = await getAccessToken();
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
    calendarId,
  )}/events`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      summary: event.summary,
      description: event.description,
      location: event.location,
      start: { dateTime: event.startISO, timeZone: TIME_ZONE },
      end: { dateTime: event.endISO, timeZone: TIME_ZONE },
    }),
  });
  if (!res.ok) {
    throw new Error(`Google event error ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { id: string };
  return json.id;
}
