"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createBooking, saveAbandonedLead, type BookingState } from "@/app/actions";
import {
  SERVICE_TYPES,
  FREQUENCIES,
  SERVICE_VALUES,
  FREQUENCY_VALUES,
  ADD_ONS,
  addOnsTotal,
  addOnApplies,
  addOnLabel,
  parseAddOns,
  encodeAddOns,
  serviceLabel,
  frequencyLabel,
  type ServiceType,
  type Frequency,
  type SelectedAddOn,
} from "@/lib/constants";
import { estimatePrice, formatUsd, OVERAGE_HOURLY } from "@/lib/pricing";

type FormShape = {
  serviceType: ServiceType | "";
  frequency: Frequency | "";
  bedrooms: number;
  bathrooms: number;
  addOns: SelectedAddOn[];
  requestedExtras: string;
  scheduledDate: string; // "YYYY-MM-DD"
  scheduledTime: string; // "HH:mm"
  fullName: string;
  email: string;
  phone: string;
  zipCode: string;
  allergies: string;
  marketingOptIn: boolean;
};

const INITIAL: FormShape = {
  serviceType: "",
  frequency: "",
  bedrooms: 2,
  bathrooms: 1,
  addOns: [],
  requestedExtras: "",
  scheduledDate: "",
  scheduledTime: "",
  fullName: "",
  email: "",
  phone: "",
  zipCode: "",
  allergies: "",
  marketingOptIn: true,
};

const STEP_TITLES = [
  "Choose your clean",
  "How often",
  "About your home",
  "Your details",
  "Pick a date",
  "Review and request",
];

// Horarios disponibles (hora de Austin). Cada limpieza dura unas 2 horas.
const TIME_SLOTS: Array<{ value: string; label: string }> = [
  { value: "08:00", label: "8:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "16:00", label: "4:00 PM" },
];

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Datos que llegan precargados desde el landing (handoff). Todo opcional: el
// server component los lee de la URL (?prefill=1&...) y los pasa como prop.
export type BookingPrefill = {
  serviceType?: string;
  frequency?: string;
  bedrooms?: number;
  bathrooms?: number;
  addOns?: string; // codificado "oven,windows:3"
  requestedExtras?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  zipCode?: string;
  allergies?: string;
};

function clampRooms(n: number | undefined, fallback: number): number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 20
    ? n
    : fallback;
}

// Estado inicial del formulario, ya con lo que venga del landing aplicado.
function buildInitial(prefill?: BookingPrefill | null): FormShape {
  if (!prefill) return INITIAL;
  const svc = prefill.serviceType ?? "";
  const freq = prefill.frequency ?? "";
  return {
    ...INITIAL,
    serviceType: (SERVICE_VALUES as string[]).includes(svc)
      ? (svc as ServiceType)
      : INITIAL.serviceType,
    frequency: (FREQUENCY_VALUES as string[]).includes(freq)
      ? (freq as Frequency)
      : INITIAL.frequency,
    bedrooms: clampRooms(prefill.bedrooms, INITIAL.bedrooms),
    bathrooms: clampRooms(prefill.bathrooms, INITIAL.bathrooms),
    addOns: parseAddOns(prefill.addOns ?? ""),
    requestedExtras: prefill.requestedExtras ?? INITIAL.requestedExtras,
    fullName: prefill.fullName ?? INITIAL.fullName,
    email: (prefill.email ?? INITIAL.email).toLowerCase(),
    phone: prefill.phone ?? INITIAL.phone,
    zipCode: prefill.zipCode ?? INITIAL.zipCode,
    allergies: prefill.allergies ?? INITIAL.allergies,
  };
}

// Primer paso aun incompleto, para no hacerle repetir lo que ya trajo del
// landing. Normalmente cae en "Pick a date".
function initialStep(d: FormShape): number {
  const hasService = d.serviceType !== "";
  const hasFreq = d.frequency !== "";
  const hasContact =
    d.fullName.trim() !== "" && EMAIL_RE.test(d.email.trim());
  if (hasService && hasFreq && hasContact) return 4;
  if (hasService && hasFreq) return 3;
  if (hasService) return 1;
  return 0;
}

// Fecha minima seleccionable: manana (no se reserva para hoy).
function minBookingDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function BookingForm({
  prefill,
  takenSlots,
}: {
  prefill?: BookingPrefill | null;
  takenSlots?: string[];
}) {
  // Horarios ya ocupados (formato "YYYY-MM-DDTHH:mm"), para no dejar elegirlos.
  const takenSet = useMemo(() => new Set(takenSlots ?? []), [takenSlots]);
  const isSlotTaken = (date: string, time: string) =>
    date !== "" && takenSet.has(`${date}T${time}`);
  const [state, formAction, pending] = useActionState<BookingState, FormData>(
    createBooking,
    null,
  );
  const [step, setStep] = useState(() => initialStep(buildInitial(prefill)));
  const [data, setData] = useState<FormShape>(() => buildInitial(prefill));
  const [touchedNext, setTouchedNext] = useState(false);

  function update<K extends keyof FormShape>(key: K, value: FormShape[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  function toggleAddOn(def: (typeof ADD_ONS)[number]) {
    setData((d) => {
      const exists = d.addOns.some((a) => a.value === def.value);
      if (exists) {
        return { ...d, addOns: d.addOns.filter((a) => a.value !== def.value) };
      }
      const qty = def.perUnit ? (def.minUnits ?? 1) : 1;
      return { ...d, addOns: [...d.addOns, { value: def.value, qty }] };
    });
  }

  function setAddOnQty(value: string, qty: number) {
    setData((d) => ({
      ...d,
      addOns: d.addOns.map((a) => (a.value === value ? { ...a, qty } : a)),
    }));
  }

  const addOnQty = (value: string) =>
    data.addOns.find((a) => a.value === value)?.qty ?? 0;

  const estimate = useMemo(() => {
    if (!data.serviceType || !data.frequency) return null;
    return estimatePrice({
      serviceType: data.serviceType,
      frequency: data.frequency,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      addOnsUsd: addOnsTotal(data.addOns, data.serviceType),
    });
  }, [
    data.serviceType,
    data.frequency,
    data.bedrooms,
    data.bathrooms,
    data.addOns,
  ]);

  // ---- Captura de leads abandonados (requerimiento de Katerina) ----
  // Si el visitante dejo datos de contacto y abandona sin terminar, guardamos
  // un lead. Best effort: nunca rompe la UX, y solo se envia una vez.
  const dataRef = useRef(data);
  const stepRef = useRef(step);
  const submittedRef = useRef(false);
  const leadSentRef = useRef(false);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);
  useEffect(() => {
    if (state?.ok) submittedRef.current = true;
  }, [state]);

  // Si Stripe esta activo, la reserva devuelve una URL de pago: redirigimos a
  // la pagina segura de Stripe Checkout.
  useEffect(() => {
    if (state?.ok && state.checkoutUrl) {
      window.location.href = state.checkoutUrl;
    }
  }, [state]);

  const sendLeadIfAbandoned = useCallback(() => {
    if (submittedRef.current || leadSentRef.current) return;
    const d = dataRef.current;
    const hasContact = Boolean(d.email.trim() || d.phone.trim());
    if (!hasContact) return;
    leadSentRef.current = true;
    void saveAbandonedLead({
      fullName: d.fullName,
      email: d.email,
      phone: d.phone,
      zipCode: d.zipCode,
      lastStepReached: STEP_TITLES[stepRef.current],
      partialData: {
        serviceType: d.serviceType,
        frequency: d.frequency,
        bedrooms: d.bedrooms,
        bathrooms: d.bathrooms,
        requestedExtras: d.requestedExtras,
        allergies: d.allergies,
        marketingOptIn: d.marketingOptIn,
      },
    });
  }, []);

  // Disparador 1: el visitante deja la pestana o cierra.
  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden") sendLeadIfAbandoned();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", sendLeadIfAbandoned);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", sendLeadIfAbandoned);
    };
  }, [sendLeadIfAbandoned]);

  // Disparador 2: inactividad. Se reinicia con cada cambio; si pasa contacto y
  // se queda 90 segundos sin avanzar, lo tomamos como lead.
  const hasContact = data.email.trim() !== "" || data.phone.trim() !== "";
  useEffect(() => {
    if (!hasContact) return;
    const t = window.setTimeout(sendLeadIfAbandoned, 90_000);
    return () => window.clearTimeout(t);
  }, [hasContact, data, step, sendLeadIfAbandoned]);

  // Accesibilidad: al cambiar de paso, llevamos el foco al titulo del paso para
  // que lectores de pantalla anuncien el nuevo contenido. Saltea el montaje.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  function stepIsValid(s: number): boolean {
    switch (s) {
      case 0:
        return data.serviceType !== "";
      case 1:
        return data.frequency !== "";
      case 2:
        return (
          data.bedrooms >= 0 &&
          data.bedrooms <= 20 &&
          data.bathrooms >= 0 &&
          data.bathrooms <= 20
        );
      case 3:
        return data.fullName.trim() !== "" && EMAIL_RE.test(data.email.trim());
      case 4:
        return (
          data.scheduledDate !== "" &&
          data.scheduledTime !== "" &&
          data.scheduledDate >= minBookingDate() &&
          !isSlotTaken(data.scheduledDate, data.scheduledTime)
        );
      default:
        return true;
    }
  }

  function goNext() {
    if (!stepIsValid(step)) {
      setTouchedNext(true);
      return;
    }
    setTouchedNext(false);
    setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  }

  function goBack() {
    setTouchedNext(false);
    setStep((s) => Math.max(s - 1, 0));
  }

  // ---- Redirigiendo a Stripe Checkout ----
  if (state?.ok && state.checkoutUrl) {
    return (
      <div className="rounded-2xl border border-sage/30 bg-cream p-10 text-center shadow-sm">
        <p className="font-display text-sm uppercase tracking-[0.2em] text-amber">
          Almost there
        </p>
        <h2 className="mt-3 text-3xl text-ink">Taking you to secure payment</h2>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-sage-deep">
          If you are not redirected,{" "}
          <a href={state.checkoutUrl} className="text-sage-deep underline">
            click here to pay
          </a>
          .
        </p>
      </div>
    );
  }

  // ---- Pantalla de confirmacion (flujo sin pago) ----
  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-sage/30 bg-cream p-10 text-center shadow-sm">
        <p className="font-display text-sm uppercase tracking-[0.2em] text-amber">
          Request received
        </p>
        <h2 className="mt-3 text-4xl text-ink">Thank you, {data.fullName.split(" ")[0]}</h2>
        <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-sage-deep">
          We have your request for a {serviceLabel(data.serviceType || "")}, a
          total of {formatUsd(state.price)} for about {state.hours} hours. We will
          reach out shortly to confirm the date and send you a secure link to
          complete your payment.
        </p>
        <p className="mt-6 text-xs uppercase tracking-widest text-sage">
          Reference {state.bookingId.slice(0, 8)}
        </p>
        <p className="mt-4 text-sm text-sage-deep">
          Need a different day?{" "}
          <a
            href={`/booking/manage?id=${state.bookingId}`}
            className="text-sage-deep underline hover:text-ink"
          >
            Reschedule your booking
          </a>
          .
        </p>
        {state.mode === "local" && (
          <p className="mt-3 text-xs text-amber">
            Demo mode: saved locally in .data, not in Supabase yet.
          </p>
        )}
      </div>
    );
  }

  const isLastStep = step === STEP_TITLES.length - 1;

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        // Enter en un campo antes del ultimo paso no envia la reserva
        // incompleta: avanzamos de paso.
        if (!isLastStep) {
          e.preventDefault();
          goNext();
        }
      }}
      className="flex flex-col gap-8"
    >
      {/* Hidden inputs: cargan el estado controlado en el FormData al enviar */}
      <input type="hidden" name="serviceType" value={data.serviceType} />
      <input type="hidden" name="frequency" value={data.frequency} />
      <input type="hidden" name="bedrooms" value={data.bedrooms} />
      <input type="hidden" name="bathrooms" value={data.bathrooms} />
      <input type="hidden" name="addOns" value={encodeAddOns(data.addOns)} />
      <input type="hidden" name="requestedExtras" value={data.requestedExtras} />
      <input type="hidden" name="scheduledDate" value={data.scheduledDate} />
      <input type="hidden" name="scheduledTime" value={data.scheduledTime} />
      <input type="hidden" name="fullName" value={data.fullName} />
      <input type="hidden" name="email" value={data.email} />
      <input type="hidden" name="phone" value={data.phone} />
      <input type="hidden" name="zipCode" value={data.zipCode} />
      <input type="hidden" name="allergies" value={data.allergies} />
      {data.marketingOptIn && (
        <input type="hidden" name="marketingOptIn" value="on" />
      )}

      <Stepper step={step} />

      <div>
        <p className="text-xs uppercase tracking-widest text-sage">
          Step {step + 1} of {STEP_TITLES.length}
        </p>
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="mt-1 text-3xl text-ink outline-none"
        >
          {STEP_TITLES[step]}
        </h2>
        <div className="mt-6">
          {step === 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {SERVICE_TYPES.map((s) => (
                <SelectCard
                  key={s.value}
                  selected={data.serviceType === s.value}
                  title={s.label}
                  blurb={s.blurb}
                  onClick={() => update("serviceType", s.value)}
                />
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {FREQUENCIES.map((f) => (
                <SelectCard
                  key={f.value}
                  selected={data.frequency === f.value}
                  title={f.label}
                  blurb={f.note}
                  onClick={() => update("frequency", f.value)}
                />
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <Counter
                  label="Bedrooms"
                  value={data.bedrooms}
                  min={0}
                  max={20}
                  onChange={(v) => update("bedrooms", v)}
                />
                <Counter
                  label="Bathrooms"
                  value={data.bathrooms}
                  min={0}
                  max={20}
                  onChange={(v) => update("bathrooms", v)}
                />
              </div>

              {/* Adicionales: se suman al precio automaticamente. */}
              <div>
                <span className="mb-2 block text-sm uppercase tracking-widest text-sage">
                  Add-ons (optional)
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ADD_ONS.filter((a) =>
                    addOnApplies(a, data.serviceType || "general"),
                  ).map((a) => {
                    const on = data.addOns.some((x) => x.value === a.value);
                    const qty = addOnQty(a.value);
                    return (
                      <div
                        key={a.value}
                        className={`rounded-lg border px-4 py-3 text-sm transition ${
                          on
                            ? "border-sage-deep bg-cream"
                            : "border-sage/30 bg-paper"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleAddOn(a)}
                          aria-pressed={on}
                          className="flex w-full items-center justify-between text-left"
                        >
                          <span className={on ? "text-ink" : "text-sage-deep"}>
                            {a.label}
                          </span>
                          <span className="ml-2 shrink-0 text-amber">
                            +{formatUsd(a.price)}
                            {a.perUnit ? ` / ${a.unit?.replace(/s$/, "")}` : ""}
                          </span>
                        </button>
                        {on && a.perUnit && (
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-xs uppercase tracking-widest text-sage">
                              {a.unit}
                            </span>
                            <Counter
                              label=""
                              value={qty}
                              min={a.minUnits ?? 1}
                              max={40}
                              onChange={(v) => setAddOnQty(a.value, v)}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Field label="Any areas you'd like us to focus on? (optional)">
                <textarea
                  value={data.requestedExtras}
                  onChange={(e) => update("requestedExtras", e.target.value)}
                  rows={2}
                  placeholder="Baseboards in the hallway, pet area, kitchen detail..."
                  className={inputClass}
                />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Full name" required>
                  <input
                    value={data.fullName}
                    onChange={(e) => update("fullName", e.target.value)}
                    placeholder="Jane Rivera"
                    className={inputClass}
                  />
                </Field>
                <Field label="Email" required>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="jane@email.com"
                    className={inputClass}
                  />
                </Field>
                <Field label="Phone (optional)">
                  <input
                    type="tel"
                    value={data.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="(512) 555 0142"
                    className={inputClass}
                  />
                </Field>
                <Field label="Zip code (optional)">
                  <input
                    value={data.zipCode}
                    onChange={(e) => update("zipCode", e.target.value)}
                    placeholder="78704"
                    className={inputClass}
                  />
                </Field>
              </div>
              <Field label="Allergies or sensitivities (optional)">
                <textarea
                  value={data.allergies}
                  onChange={(e) => update("allergies", e.target.value)}
                  rows={2}
                  placeholder="Fragrance free please, sensitive to citrus..."
                  className={inputClass}
                />
              </Field>
              <label className="flex items-start gap-3 text-sm text-sage-deep">
                <input
                  type="checkbox"
                  checked={data.marketingOptIn}
                  onChange={(e) => update("marketingOptIn", e.target.checked)}
                  className="mt-1 h-4 w-4 accent-sage-deep"
                />
                <span>
                  Keep me posted with seasonal tips and offers from Sage Essence.
                </span>
              </label>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-6">
              <p className="text-sm leading-relaxed text-sage-deep">
                Pick a preferred day and time. We will confirm with you before
                the visit. Each clean takes about two hours.
              </p>
              <Field label="Preferred date" required>
                <input
                  type="date"
                  min={minBookingDate()}
                  value={data.scheduledDate}
                  onChange={(e) => update("scheduledDate", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <div>
                <span className="mb-2 block text-sm uppercase tracking-widest text-sage">
                  Preferred time<span className="text-amber"> *</span>
                </span>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {TIME_SLOTS.map((slot) => {
                    const taken = isSlotTaken(data.scheduledDate, slot.value);
                    const selected = data.scheduledTime === slot.value;
                    return (
                      <button
                        key={slot.value}
                        type="button"
                        disabled={taken}
                        onClick={() => update("scheduledTime", slot.value)}
                        aria-pressed={selected}
                        className={`rounded-lg border px-4 py-3 text-sm transition ${
                          taken
                            ? "cursor-not-allowed border-sage/20 bg-cream/60 text-sage/50 line-through"
                            : selected
                              ? "border-sage-deep bg-cream text-ink"
                              : "border-sage/30 bg-paper text-sage-deep hover:border-sage"
                        }`}
                      >
                        {slot.label}
                        {taken && (
                          <span className="ml-1 text-xs no-underline">
                            (taken)
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {data.scheduledDate !== "" &&
                  TIME_SLOTS.every((s) =>
                    isSlotTaken(data.scheduledDate, s.value),
                  ) && (
                    <p className="mt-2 text-sm text-amber">
                      All times are booked for this day. Please pick another date.
                    </p>
                  )}
              </div>
            </div>
          )}

          {step === 5 && <Review data={data} estimate={estimate} />}
        </div>

        {touchedNext && !stepIsValid(step) && (
          <p role="alert" className="mt-4 text-sm text-amber">
            Please complete this step before continuing.
          </p>
        )}
      </div>

      {/* Precio en vivo (un solo total) + tiempo estimado */}
      {estimate && (
        <div className="rounded-xl border border-sage/30 bg-cream px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-sage">
              Your price
            </span>
            <span className="font-display text-3xl text-ink">
              {formatUsd(estimate.price)}
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-sage-deep">
            Estimated for about {estimate.hours} hours. If the clean runs longer
            due to the home&apos;s condition, extra time is billed at{" "}
            {formatUsd(OVERAGE_HOURLY)}/hour.
          </p>
        </div>
      )}

      {/* Error del servidor */}
      {state && !state.ok && (
        <p
          role="alert"
          className="rounded-xl border border-amber/40 bg-amber-light/20 px-4 py-3 text-sm text-ink"
        >
          {state.error}
        </p>
      )}

      {/* Navegacion */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0}
          className="text-sm uppercase tracking-widest text-sage-deep transition disabled:invisible hover:text-ink"
        >
          Back
        </button>

        {!isLastStep ? (
          <button type="button" onClick={goNext} className={primaryBtn}>
            Continue
          </button>
        ) : (
          <button type="submit" disabled={pending} className={primaryBtn}>
            {pending ? "Sending..." : "Request this clean"}
          </button>
        )}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Subcomponentes
// ---------------------------------------------------------------------------

const inputClass =
  "w-full rounded-lg border border-sage/40 bg-paper px-4 py-3 text-ink outline-none transition placeholder:text-sage/70 focus:border-sage-deep focus:ring-1 focus:ring-sage-deep";

const primaryBtn =
  "rounded-full bg-sage-deep px-8 py-3 text-sm uppercase tracking-widest text-paper transition hover:bg-ink disabled:opacity-60";

function Stepper({ step }: { step: number }) {
  return (
    <div
      className="flex items-center gap-2"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={STEP_TITLES.length}
      aria-valuenow={step + 1}
      aria-label={`Step ${step + 1} of ${STEP_TITLES.length}: ${STEP_TITLES[step]}`}
    >
      {STEP_TITLES.map((_, i) => (
        <span
          key={i}
          className={`h-1 flex-1 rounded-full transition ${
            i <= step ? "bg-sage-deep" : "bg-sage/25"
          }`}
        />
      ))}
    </div>
  );
}

function SelectCard({
  selected,
  title,
  blurb,
  onClick,
}: {
  selected: boolean;
  title: string;
  blurb: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border p-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-deep ${
        selected
          ? "border-sage-deep bg-cream shadow-sm"
          : "border-sage/30 bg-paper hover:border-sage"
      }`}
    >
      <span className="block font-display text-xl text-ink">{title}</span>
      <span className="mt-1 block text-sm leading-relaxed text-sage-deep">
        {blurb}
      </span>
    </button>
  );
}

function Counter({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <span className="mb-2 block text-sm uppercase tracking-widest text-sage">
        {label}
      </span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="h-10 w-10 rounded-full border border-sage/40 text-xl text-sage-deep transition hover:border-sage-deep"
          aria-label={`Decrease ${label}`}
        >
          &minus;
        </button>
        <span className="w-10 text-center font-display text-2xl text-ink">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="h-10 w-10 rounded-full border border-sage/40 text-xl text-sage-deep transition hover:border-sage-deep"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm uppercase tracking-widest text-sage">
        {label}
        {required && <span className="text-amber"> *</span>}
      </span>
      {children}
    </label>
  );
}

function Review({
  data,
  estimate,
}: {
  data: FormShape;
  estimate: ReturnType<typeof estimatePrice> | null;
}) {
  const timeLabel =
    TIME_SLOTS.find((s) => s.value === data.scheduledTime)?.label ??
    data.scheduledTime;
  const whenText =
    data.scheduledDate && data.scheduledTime
      ? `${data.scheduledDate} at ${timeLabel}`
      : "Not set";

  const rows: Array<[string, string]> = [
    ["Clean", data.serviceType ? serviceLabel(data.serviceType) : "Not set"],
    ["Frequency", data.frequency ? frequencyLabel(data.frequency) : "Not set"],
    ["Home", `${data.bedrooms} bed, ${data.bathrooms} bath`],
    ["When", whenText],
    ["Name", data.fullName || "Not set"],
    ["Email", data.email || "Not set"],
    ["Phone", data.phone || "Not provided"],
    ["Zip", data.zipCode || "Not provided"],
  ];
  const appliedAddOns = data.addOns.filter((a) => {
    const def = ADD_ONS.find((d) => d.value === a.value);
    return def ? addOnApplies(def, data.serviceType || "general") : false;
  });
  if (appliedAddOns.length > 0) {
    rows.push([
      "Add-ons",
      appliedAddOns.map((a) => addOnLabel(a.value, a.qty)).join(", "),
    ]);
  }
  if (data.requestedExtras) rows.push(["Focus areas", data.requestedExtras]);
  if (data.allergies) rows.push(["Sensitivities", data.allergies]);
  if (estimate) {
    rows.push(["Total", formatUsd(estimate.price)]);
    rows.push(["Estimated time", `about ${estimate.hours} hours`]);
  }

  return (
    <div className="flex flex-col gap-4">
      <dl className="divide-y divide-sage/20 rounded-xl border border-sage/30 bg-cream">
        {rows.map(([k, v]) => (
          <div key={k} className="flex gap-4 px-5 py-3">
            <dt className="w-32 shrink-0 text-sm uppercase tracking-widest text-sage">
              {k}
            </dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-sm leading-relaxed text-sage-deep">
        This quote is based on about {estimate?.hours ?? 0} hours of work. If the
        clean runs longer due to the home&apos;s condition, extra time is billed
        at {formatUsd(OVERAGE_HOURLY)}/hour.
        {estimate && estimate.discount > 0 && (
          <>
            {" "}
            Your {frequencyLabel(data.frequency || "")} plan already includes a{" "}
            {Math.round(estimate.discount * 100)} percent discount.
          </>
        )}
      </p>
    </div>
  );
}
