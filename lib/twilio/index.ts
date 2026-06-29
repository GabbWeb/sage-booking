// Integracion de Twilio para SMS (aviso "en camino"). Usa la REST API directa
// (sin SDK), igual que Stripe/Resend. Sin llaves, cae a modo log: imprime en
// consola, asi el flujo se puede probar sin cuenta.

export function twilioConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );
}

/** Normaliza un telefono de EE.UU. a formato E.164 (+1XXXXXXXXXX). */
export function toE164US(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) return trimmed;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function sendSms(params: {
  to: string;
  body: string;
}): Promise<{ ok: boolean; mode: "twilio" | "log"; error?: string }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    console.log(`[sms:log] Para: ${params.to} | ${params.body}`);
    return { ok: true, mode: "log" };
  }

  const to = toE164US(params.to);
  if (!to) {
    return { ok: false, mode: "twilio", error: "Invalid phone number." };
  }

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: to,
          From: from,
          Body: params.body,
        }).toString(),
      },
    );
    if (!res.ok) {
      const text = await res.text();
      console.error(`[sms:twilio] error ${res.status}: ${text}`);
      return { ok: false, mode: "twilio", error: `Twilio ${res.status}` };
    }
    return { ok: true, mode: "twilio" };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[sms:twilio] excepcion:", error);
    return { ok: false, mode: "twilio", error };
  }
}
