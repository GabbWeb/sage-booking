// Helpers para los cron jobs de emails (Vercel Cron).

// Autoriza un request de cron. Vercel Cron manda Authorization: Bearer
// CRON_SECRET si la variable existe. En dev sin secret, se permite para poder
// probar; en produccion sin secret, se rechaza.
export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.get("authorization");
  const url = new URL(req.url);
  return (
    auth === `Bearer ${secret}` || url.searchParams.get("secret") === secret
  );
}

// Fecha (YYYY-MM-DD) desplazada N dias desde hoy.
export function dateOffsetStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}
