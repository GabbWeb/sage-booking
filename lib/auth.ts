import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "node:crypto";

// Autenticacion simple del panel admin (Fase 6) por contrasena + cookie firmada.
// Suficiente para un panel chico sobre HTTPS. Se puede migrar a Supabase Auth
// mas adelante sin cambiar las paginas (solo este modulo).

const COOKIE = "sage_admin";

function sessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "insecure-dev-secret"
  );
}

// Token determinista a partir del secreto. La cookie guarda esto; si el secreto
// o la contrasena cambian, las sesiones viejas dejan de valer.
export function sessionToken(): string {
  return createHmac("sha256", sessionSecret()).update("sage-admin-v1").digest("hex");
}

export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected || !password) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return false;
  const expected = sessionToken();
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function setSession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

// Protege una pagina del panel: si no hay sesion, redirige al login.
export async function requireAdmin(): Promise<void> {
  if (!(await isAuthed())) redirect("/login");
}
