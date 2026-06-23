"use client";

import { useState } from "react";
import { addExtraChargeToBooking } from "@/app/actions";

// Genera un link de pago para un cargo extra. Se lo enviamos al cliente y el lo
// aprueba y paga. No se le cobra nada sin su confirmacion.
export default function ExtraChargeForm({ bookingId }: { bookingId: string }) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    setLink(null);
    setCopied(false);
    const res = await addExtraChargeToBooking({
      bookingId,
      description,
      amountUsd: Number(amount),
    });
    setPending(false);
    if (res.ok) {
      setLink(res.url);
      setDescription("");
      setAmount("");
    } else {
      setError(res.error);
    }
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
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
          {pending ? "..." : "Create payment link"}
        </button>
      </div>

      {error && <span className="text-xs text-amber">{error}</span>}

      {link && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-sage/30 bg-cream px-3 py-2">
          <span className="text-xs text-sage-deep">
            Send this link to the customer to pay:
          </span>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="max-w-full break-all text-xs text-ink underline"
          >
            {link}
          </a>
          <button
            type="button"
            onClick={copy}
            className="rounded-full bg-sage-deep px-3 py-1 text-xs uppercase tracking-widest text-paper hover:bg-ink"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
