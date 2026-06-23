"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-5 py-20">
      <header className="mb-8 text-center">
        <p className="font-display text-sm uppercase tracking-[0.25em] text-amber">
          Sage Essence
        </p>
        <h1 className="mt-2 text-4xl text-ink">Admin</h1>
      </header>

      <form action={action} className="flex flex-col gap-4">
        <label className="block">
          <span className="mb-2 block text-sm uppercase tracking-widest text-sage">
            Password
          </span>
          <input
            type="password"
            name="password"
            autoFocus
            className="w-full rounded-lg border border-sage/40 bg-paper px-4 py-3 text-ink outline-none focus:border-sage-deep focus:ring-1 focus:ring-sage-deep"
          />
        </label>

        {state?.error && (
          <p role="alert" className="text-sm text-amber">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-sage-deep px-8 py-3 text-sm uppercase tracking-widest text-paper transition hover:bg-ink disabled:opacity-60"
        >
          {pending ? "..." : "Enter"}
        </button>
      </form>
    </main>
  );
}
