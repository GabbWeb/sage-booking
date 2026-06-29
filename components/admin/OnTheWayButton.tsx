"use client";

import { useState } from "react";
import { notifyOnTheWay } from "@/app/actions";

// Avisa al cliente que la limpiadora va en camino (hoy por email).
export default function OnTheWayButton({ bookingId }: { bookingId: string }) {
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function send() {
    setPending(true);
    setMsg(null);
    const res = await notifyOnTheWay(bookingId);
    setPending(false);
    setMsg(
      res.ok
        ? {
            ok: true,
            text: res.channel === "sms" ? "On-the-way text sent." : "On-the-way email sent.",
          }
        : { ok: false, text: res.error ?? "Could not send." },
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={send}
        disabled={pending}
        className="rounded-full border border-sage-deep px-5 py-2 text-xs uppercase tracking-widest text-sage-deep transition hover:bg-sage-deep hover:text-paper disabled:opacity-50"
      >
        {pending ? "..." : "Notify on the way"}
      </button>
      {msg && (
        <span className={`text-xs ${msg.ok ? "text-sage-deep" : "text-amber"}`}>
          {msg.text}
        </span>
      )}
    </div>
  );
}
