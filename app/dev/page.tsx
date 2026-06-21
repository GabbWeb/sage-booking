import Link from "next/link";
import { getStore, supabaseConfigured } from "@/lib/store";

export const dynamic = "force-dynamic";

// Indice de herramientas de desarrollo. No enlazado desde el sitio publico.
export default function DevIndex() {
  const store = getStore();
  const links = [
    { href: "/", label: "Booking form", note: "The live customer flow" },
    { href: "/dev/bookings", label: "Bookings", note: "Recent bookings in the active store" },
    { href: "/dev/emails", label: "Email previews", note: "The three automated emails" },
  ];

  return (
    <main className="mx-auto max-w-2xl px-5 py-14">
      <header className="mb-8">
        <p className="font-display text-sm uppercase tracking-[0.25em] text-amber">
          Sage Essence
        </p>
        <h1 className="mt-2 text-4xl text-ink">Developer tools</h1>
        <p className="mt-3 text-sm text-sage-deep">
          Data store:{" "}
          <span className="text-ink">
            {store.mode === "supabase" ? "Supabase (live)" : "local file (demo)"}
          </span>
          {!supabaseConfigured() && (
            <span className="text-amber">
              {"  "}Add Supabase keys to .env.local to go live.
            </span>
          )}
        </p>
      </header>

      <ul className="flex flex-col gap-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="block rounded-xl border border-sage/30 bg-paper p-5 transition hover:border-sage-deep"
            >
              <span className="block font-display text-xl text-ink">
                {l.label}
              </span>
              <span className="mt-1 block text-sm text-sage-deep">{l.note}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
