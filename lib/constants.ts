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

export function serviceLabel(value: string): string {
  return SERVICE_TYPES.find((s) => s.value === value)?.label ?? value;
}

export function frequencyLabel(value: string): string {
  return FREQUENCIES.find((f) => f.value === value)?.label ?? value;
}
