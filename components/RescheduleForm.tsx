"use client";

import { useState } from "react";
import { rescheduleBooking } from "@/app/actions";

const TIME_SLOTS = [
  { value: "08:00", label: "8:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "16:00", label: "4:00 PM" },
];

function minDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function RescheduleForm({
  bookingId,
  takenSlots,
}: {
  bookingId: string;
  takenSlots: string[];
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const taken = new Set(takenSlots);
  const isTaken = (t: string) => date !== "" && taken.has(`${date}T${t}`);
  const valid =
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    time !== "" &&
    date >= minDate() &&
    !isTaken(time);

  async function submit() {
    if (!valid) return;
    setPending(true);
    setError(null);
    const res = await rescheduleBooking({
      bookingId,
      scheduledDate: date,
      scheduledTime: time,
    });
    setPending(false);
    if (res.ok) setDone(res.scheduledDate);
    else setError(res.error);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-sage/30 bg-cream p-8 text-center">
        <p className="font-display text-sm uppercase tracking-[0.2em] text-amber">
          Date updated
        </p>
        <h2 className="mt-3 text-3xl text-ink">You are all set</h2>
        <p className="mx-auto mt-3 max-w-md text-sage-deep">
          Your clean is now scheduled for {done}. We will see you then.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="mb-2 block text-sm uppercase tracking-widest text-sage">
          New date
        </label>
        <input
          type="date"
          min={minDate()}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-sage/40 bg-paper px-4 py-3 text-ink outline-none focus:border-sage-deep"
        />
      </div>

      <div>
        <span className="mb-2 block text-sm uppercase tracking-widest text-sage">
          New time
        </span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TIME_SLOTS.map((slot) => {
            const t = isTaken(slot.value);
            const sel = time === slot.value;
            return (
              <button
                key={slot.value}
                type="button"
                disabled={t}
                onClick={() => setTime(slot.value)}
                className={`rounded-lg border px-4 py-3 text-sm transition ${
                  t
                    ? "cursor-not-allowed border-sage/20 bg-cream/60 text-sage/50 line-through"
                    : sel
                      ? "border-sage-deep bg-cream text-ink"
                      : "border-sage/30 bg-paper text-sage-deep hover:border-sage"
                }`}
              >
                {slot.label}
                {t && <span className="ml-1 text-xs no-underline">(taken)</span>}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-amber/40 bg-amber-light/20 px-4 py-3 text-sm text-ink">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!valid || pending}
        className="rounded-full bg-sage-deep px-6 py-3 text-xs uppercase tracking-widest text-paper transition hover:bg-ink disabled:opacity-50"
      >
        {pending ? "Updating..." : "Update my date"}
      </button>
    </div>
  );
}
