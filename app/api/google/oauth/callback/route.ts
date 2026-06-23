import {
  callbackRedirectUri,
  exchangeCodeForTokens,
} from "@/lib/google/oauth";

// Recibe el codigo de Google, lo cambia por tokens y muestra el refresh token
// para pegarlo en .env.local. Dev only, una sola vez.
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (error) return html(`Authorization error: ${escapeHtml(error)}`);
  if (!code) return html("Missing authorization code.");

  try {
    const tokens = await exchangeCodeForTokens(
      code,
      callbackRedirectUri(url.origin),
    );
    if (!tokens.refresh_token) {
      return html(
        "No llego refresh token. Revoca el acceso de la app en tu cuenta de Google y volve a /api/google/oauth/start (debe pedir consentimiento de nuevo).",
      );
    }
    return html(
      `<p>Listo. Copia este valor en <code>.env.local</code> como <code>GOOGLE_REFRESH_TOKEN</code>:</p>
       <textarea rows="4" style="width:100%">${escapeHtml(tokens.refresh_token)}</textarea>
       <p style="color:#5e674f">Despues guarda el archivo y avisa para reiniciar el servidor.</p>`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return html(`Token exchange failed: ${escapeHtml(message)}`);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function html(body: string): Response {
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>Google OAuth</title>
     <body style="font-family:system-ui;max-width:640px;margin:48px auto;padding:0 16px;color:#1f1810">
     <h1 style="font-weight:600">Google Calendar OAuth</h1>${body}</body>`,
    { headers: { "content-type": "text/html; charset=utf-8" } },
  );
}
