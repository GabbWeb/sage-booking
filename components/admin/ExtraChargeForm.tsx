"use client";

import { useState } from "react";
import { addExtraChargeToBooking } from "@/app/actions";

// Cobra un cargo extra sobre la tarjeta guardada de una reserva (Fase 2 + 6).
export default function ExtraChargeForm({ bookingId }: { bookingId: string }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setPending(true);
    setMsg(null);
    const res = await addExtraChargeToBooking({
      bookingId,
      description,
      amountUsd: Number(amount),
    });
    setPending(false);
    if (res.ok) {
      setMsg({ ok: true, text: `Charged $${amount}.` });
      setDescription("");
      setAmount("");
    } else {
      setMsg({ ok: false, text: res.error });
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Extra charge, e.g. inside the fridge"
        className="min-w-50 flex-1 rounded-lg border border-sage/40 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-sage-deep"
      />
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="decimal"
        placeholder="USD"
        className="w-24 rounded-lg border border-sage/40 bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-sage-deep"
      />
      <button
        type="button"
        onClick={submit}
        disabled={pending || !description || !amount}
        className="rounded-full bg-sage-deep px-5 py-2 text-xs uppercase tracking-widest text-paper transition hover:bg-ink disabled:opacity-50"
      >
        {pending ? "..." : "Charge"}
      </button>
      {msg && (
        <span className={`text-xs ${msg.ok ? "text-sage-deep" : "text-amber"}`}>
          {msg.text}
        </span>
      )}
    </div>
  );
}
