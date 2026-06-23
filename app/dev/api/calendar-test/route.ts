import {
  createCalendarEvent,
  googleCalendarConfigured,
} from "@/lib/google/calendar";

// Dev only: crea un evento de prueba en el calendario de Sage para verificar la
// integracion OAuth. Borrable. No usar en produccion.
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }
  if (!googleCalendarConfigured()) {
    return Response.json(
      { ok: false, error: "Google Calendar no configurado." },
      { status: 400 },
    );
  }
  try {
    const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const eventId = await createCalendarEvent({
      summary: "TEST, Sage Essence booking system",
      description:
        "Evento de prueba creado por el sistema de reservas. Se puede borrar.",
      location: "Austin, TX",
      startISO: start.toISOString(),
      endISO: end.toISOString(),
    });
    return Response.json({ ok: true, eventId });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
