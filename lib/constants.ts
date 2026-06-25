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
  {
    value: "one_time",
    label: "One time clean",
    blurb: "A single visit, no ongoing commitment.",
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

// Servicios adicionales opcionales. El precio se suma al total. Referencias de
// Austin: horno/heladera $25-50, ventanas $40-80. Replicado en el estimador del
// landing (public/landing.html via scripts/build_landing.py); mantener en sync.
export const ADD_ONS = [
  { value: "oven", label: "Inside the oven", price: 30 },
  { value: "fridge", label: "Inside the fridge", price: 30 },
  { value: "dishwasher", label: "Inside the dishwasher", price: 25 },
  { value: "windows", label: "Interior windows", price: 45 },
  { value: "cabinets", label: "Inside kitchen cabinets", price: 40 },
  { value: "laundry", label: "Laundry, wash and fold", price: 25 },
  { value: "washer", label: "Clean the washing machine", price: 25 },
  { value: "upholstery", label: "Upholstery and couch vacuum", price: 35 },
  { value: "baseboards", label: "Baseboards and detail dusting", price: 30 },
  { value: "priority", label: "Priority 9 AM start", price: 20 },
] as const;

export type AddOnValue = (typeof ADD_ONS)[number]["value"];
export const ADD_ON_VALUES: string[] = ADD_ONS.map((a) => a.value);

/** Suma el precio de una lista de adicionales (ignora valores desconocidos). */
export function addOnsTotal(values: string[]): number {
  return values.reduce(
    (sum, v) => sum + (ADD_ONS.find((a) => a.value === v)?.price ?? 0),
    0,
  );
}

/** Etiqueta legible de un adicional. */
export function addOnLabel(value: string): string {
  return ADD_ONS.find((a) => a.value === value)?.label ?? value;
}

export function serviceLabel(value: string): string {
  return SERVICE_TYPES.find((s) => s.value === value)?.label ?? value;
}

export function frequencyLabel(value: string): string {
  return FREQUENCIES.find((f) => f.value === value)?.label ?? value;
}
