import { isAuthed } from "@/lib/auth";
import { getStore } from "@/lib/store";

// Export CSV de clientes para marketing (requerimiento 4). Protegido.
export async function GET() {
  if (!(await isAuthed())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const customers = await getStore().listCustomers(5000);

  const headers = [
    "full_name",
    "email",
    "phone",
    "zip_code",
    "allergies_sensitivities",
    "marketing_opt_in",
    "created_at",
  ];

  const escape = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const lines = [headers.join(",")];
  for (const c of customers) {
    lines.push(
      [
        c.full_name,
        c.email,
        c.phone,
        c.zip_code,
        c.allergies_sensitivities,
        c.marketing_opt_in,
        c.created_at,
      ]
        .map(escape)
        .join(","),
    );
  }

  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="sage-customers.csv"',
    },
  });
}
