import type { BuiltEmail } from "./types";

// Envio de emails. Con RESEND_API_KEY envia de verdad (via la REST API de
// Resend, sin SDK). Sin la key, cae a modo log: imprime en consola, asi el
// flujo se puede probar sin cuenta. Igual que la capa de datos.

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

function fromAddress(): string {
  const addr = process.env.SAGE_FROM_EMAIL || "hello@thesageessence.com";
  return `Sage Essence <${addr}>`;
}

export async function sendEmail(params: {
  to: string;
  email: BuiltEmail;
}): Promise<{ ok: boolean; mode: "resend" | "log"; error?: string }> {
  const { to, email } = params;

  if (!emailConfigured()) {
    console.log(
      `[email:log] Para: ${to} | Asunto: ${email.subject}\n${email.text}\n---`,
    );
    return { ok: true, mode: "log" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to,
        subject: email.subject,
        html: email.html,
        text: email.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[email:resend] error ${res.status}: ${body}`);
      return { ok: false, mode: "resend", error: `Resend ${res.status}` };
    }
    return { ok: true, mode: "resend" };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[email:resend] excepcion:", error);
    return { ok: false, mode: "resend", error };
  }
}
