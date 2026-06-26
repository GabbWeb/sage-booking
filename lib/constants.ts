// Opciones del estimador, compartidas entre el formulario (cliente) y la
// accion del servidor. Los valores (value) coinciden con los del modelo de
// datos en Supabase.

export const SERVICE_TYPES = [
  {
    value: "deep",
    label: "Deep clean",
    blurb: "A thorough, top to bottom reset of the whole home.",
  },
  {
    value: "general",
    label: "General clean",
    blurb: "Routine upkeep for a home that is already maintained.",
  },
  {
    value: "move_in_out",
    label: "Move in or move out",
    blurb: "An empty home detailed in every corner.",
  },
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number]["value"];

export const FREQUENCIES = [
  { value: "weekly", label: "Weekly", note: "Save 20 percent" },
  { value: "biweekly", label: "Every two weeks", note: "Save 15 percent" },
  { value: "monthly", label: "Monthly", note: "Save 10 percent" },
  { value: "once", label: "One time", note: "No discount" },
] as const;

export type Frequency = (typeof FREQUENCIES)[number]["value"];

export const SERVICE_VALUES = SERVICE_TYPES.map((s) => s.value);
export const FREQUENCY_VALUES = FREQUENCIES.map((f) => f.value);

// ---------------------------------------------------------------------------
// Servicios adicionales (hoja de Katerina). Algunos son por unidad (ventanas,
// mascotas) y "baseboards" solo aplica a limpieza estandar (la profunda y el
// move-out ya lo incluyen). Replicado en el estimador del landing
// (public/landing.html via scripts/build_landing.py); mantener en sync.
// ---------------------------------------------------------------------------
export type AddOnDef = {
  value: string;
  label: string;
  price: number;
  perUnit?: boolean; // precio por unidad (cantidad elegible)
  unit?: string; // etiqueta de unidad ("windows", "pets")
  minUnits?: number; // minimo de unidades cuando se elige
  includedIn?: string[]; // servicios que YA lo incluyen (no se ofrece ahi)
};

export const ADD_ONS: AddOnDef[] = [
  // Horno y heladera ya van incluidos en move-in/out.
  { value: "oven", label: "Inside the oven", price: 40, includedIn: ["move_in_out"] },
  { value: "fridge", label: "Inside the fridge", price: 30, includedIn: ["move_in_out"] },
  { value: "dishwasher", label: "Inside the dishwasher", price: 25 },
  {
    // Zocalos: la profunda y el move-out ya lo incluyen; solo en estandar.
    value: "baseboards",
    label: "Baseboards and detail dusting",
    price: 30,
    includedIn: ["deep", "move_in_out"],
  },
  {
    value: "windows",
    label: "Interior windows",
    price: 8,
    perUnit: true,
    unit: "windows",
    minUnits: 2,
  },
  {
    value: "pets",
    label: "Pet surcharge",
    price: 35,
    perUnit: true,
    unit: "pets",
    minUnits: 1,
  },
];

export const ADD_ON_VALUES: string[] = ADD_ONS.map((a) => a.value);

export type SelectedAddOn = { value: string; qty: number };

/** Se ofrece este adicional para el servicio? (no si ya viene incluido). */
export function addOnApplies(def: AddOnDef, serviceType: string): boolean {
  return !def.includedIn || !def.includedIn.includes(serviceType);
}

/**
 * Parsea la lista de adicionales desde texto ("oven,windows:3,pets:2").
 * Las unidades se fuerzan al minimo del adicional.
 */
export function parseAddOns(raw: string): SelectedAddOn[] {
  if (!raw) return [];
  const out: SelectedAddOn[] = [];
  for (const piece of raw.split(",")) {
    const [v, q] = piece.trim().split(":");
    const def = ADD_ONS.find((a) => a.value === v);
    if (!def) continue;
    const min = def.minUnits ?? 1;
    const qty = def.perUnit
      ? Math.max(min, Number.parseInt(q ?? "", 10) || min)
      : 1;
    out.push({ value: v, qty });
  }
  return out;
}

/** Serializa adicionales a texto para FormData / query ("oven,windows:3"). */
export function encodeAddOns(items: SelectedAddOn[]): string {
  return items
    .map((it) => {
      const def = ADD_ONS.find((a) => a.value === it.value);
      return def?.perUnit ? `${it.value}:${it.qty}` : it.value;
    })
    .join(",");
}

/** Suma el precio de los adicionales para un servicio dado. */
export function addOnsTotal(items: SelectedAddOn[], serviceType: string): number {
  return items.reduce((sum, it) => {
    const def = ADD_ONS.find((a) => a.value === it.value);
    if (!def || !addOnApplies(def, serviceType)) return sum;
    return sum + def.price * (def.perUnit ? it.qty : 1);
  }, 0);
}

/** Etiqueta legible de un adicional (con cantidad si corresponde). */
export function addOnLabel(value: string, qty = 1): string {
  const def = ADD_ONS.find((a) => a.value === value);
  if (!def) return value;
  if (def.perUnit && qty > 0) return `${def.label} (x${qty})`;
  return def.label;
}

export function serviceLabel(value: string): string {
  return SERVICE_TYPES.find((s) => s.value === value)?.label ?? value;
}

export function frequencyLabel(value: string): string {
  return FREQUENCIES.find((f) => f.value === value)?.label ?? value;
}
