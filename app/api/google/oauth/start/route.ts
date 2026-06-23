import {
  buildAuthUrl,
  callbackRedirectUri,
  googleOAuthConfigured,
} from "@/lib/google/oauth";

// Inicia la autorizacion de Google (una sola vez). Dev only. Abrir en el
// navegador: /api/google/oauth/start con la cuenta de Sage logueada.
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }
  if (!googleOAuthConfigured()) {
    return new Response(
      "Falta GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET en .env.local.",
      { status: 400 },
    );
  }
  const origin = new URL(req.url).origin;
  return Response.redirect(buildAuthUrl(callbackRedirectUri(origin)), 302);
}
