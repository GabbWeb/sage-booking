import { createSign } from "node:crypto";

// Integracion con Google Calendar (Fase 3) SIN dependencias externas: firma el
// JWT de la service account con node:crypto y habla con la REST API por fetch.
//
// Setup (ver docs/PHASE3-GOOGLE.md):
//  1. Crear una service account en Google Cloud, habilitar Calendar API.
//  2. Compartir el calendario de Sage con el email de la service account
//     (permiso "Hacer cambios en eventos").
//  3. Cargar en .env.local: GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY,
//     GOOGLE_CALENDAR_ID.

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/calendar";
const TIME_ZONE = "America/Chicago"; // Austin, TX

export function googleCalendarConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_CALENDAR_ID,
  );
}

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function getPrivateKey(): string {
  // Las private keys en .env suelen venir con \n literales: los normalizamos.
  return (process.env.GOOGLE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  if (!email) throw new Error("Falta GOOGLE_SERVICE_ACCOUNT_EMAIL.");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: email,
    scope: SCOPE,
    aud: TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(
    JSON.stringify(claim),
  )}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  const signature = signer.sign(getPrivateKey(), "base64url");
  const assertion = `${signingInput}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
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
