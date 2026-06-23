import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "./actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <header className="mb-8 flex items-center justify-between border-b border-sage/20 pb-4">
        <div className="flex items-baseline gap-4">
          <Link href="/admin" className="font-display text-2xl text-ink">
            Sage Essence
          </Link>
          <span className="text-xs uppercase tracking-widest text-sage">
            Admin
          </span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-xs uppercase tracking-widest text-sage-deep hover:text-ink"
          >
            Sign out
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
