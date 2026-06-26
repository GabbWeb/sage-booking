import type { ServiceType, Frequency } from "./constants";

// ---------------------------------------------------------------------------
// Modelo de precios de Sage Essence (hoja de Katerina, Jun 2026).
// Tarifa FIJA por cantidad de habitaciones (no por metros cuadrados).
// Motor: Precio = $50 x horas-persona (cuadrilla x tiempo de trabajo),
// redondeado hacia arriba al $5. Limpiadoras a $20/h, margen de mano de obra 60%.
//
// Usamos la TABLA exacta de la hoja para los tamanos listados (precio + tiempo);
// para combinaciones fuera de la tabla caemos a la formula simple. Frecuencia y
// adicionales se aplican encima. Se muestra UN solo precio (sin rango) y el
// tiempo estimado; si la limpieza se extiende se cobra $60/hora.
//
// IMPORTANTE: esta misma tabla esta replicada en el estimador del landing
// (public/landing.html via scripts/build_landing.py). Si cambias una, cambia
// la otra. Hay un cross-check automatico en scripts/verify-pricing.mts.
// ---------------------------------------------------------------------------

export const OVERAGE_HOURLY = 60; // USD por hora si la limpieza se extiende

// Descuentos por frecuencia (hoja: one-time 1.0, monthly .9, biweekly .85, weekly .8).
export const FREQUENCY_DISCOUNT: Record<Frequency, number> = {
  weekly: 0.2,
  biweekly: 0.15,
  monthly: 0.1,
  once: 0,
};

// Configuraciones que van con una sola limpiadora (cuadrilla = 1).
const SOLO_CONFIGS = new Set(["1-1", "1-2", "2-1"]);
function crewFor(bedrooms: number, bathrooms: number): number {
  return SOLO_CONFIGS.has(`${bedrooms}-${bathrooms}`) ? 1 : 2;
}

// Formula simple de respaldo (hoja, engine 2), para tamanos fuera de la tabla.
const FORMULA: Record<ServiceType, { base: number; perBr: number; perBa: number }> = {
  general: { base: 45, perBr: 50, perBa: 25 },
  deep: { base: 185, perBr: 40, perBa: 35 },
  move_in_out: { base: 225, perBr: 40, perBa: 35 },
};

// Tabla exacta de la hoja: [precio base one-time, minutos de trabajo (wall-clock)].
// Clave: "dormitorios-banos".
type Cell = [price: number, minutes: number];
const TABLE: Record<ServiceType, Record<string, Cell>> = {
  general: {
    "1-1": [135, 160], "1-2": [150, 180], "2-1": [150, 180], "2-2": [195, 115],
    "2-3": [220, 130], "3-1": [220, 130], "3-2": [245, 145], "3-3": [270, 160],
    "3-4": [285, 170], "4-2": [300, 180], "4-3": [325, 195], "4-4": [350, 210],
    "4-5": [375, 225], "5-3": [350, 210], "5-4": [375, 225], "5-5": [400, 240],
    "6-4": [400, 240], "6-5": [425, 255],
  },
  deep: {
    "1-1": [225, 270], "1-2": [250, 300], "2-1": [250, 300], "2-2": [335, 200],
    "2-3": [370, 220], "3-1": [335, 200], "3-2": [370, 220], "3-3": [400, 240],
    "3-4": [445, 265], "4-2": [420, 250], "4-3": [460, 275], "4-4": [495, 295],
    "4-5": [525, 315], "5-3": [495, 295], "5-4": [525, 315], "5-5": [560, 335],
    "6-4": [560, 335], "6-5": [595, 355],
  },
  move_in_out: {
    "1-1": [260, 310], "1-2": [290, 345], "2-1": [290, 345], "2-2": [375, 225],
    "2-3": [410, 245], "3-1": [375, 225], "3-2": [410, 245], "3-3": [450, 270],
    "3-4": [485, 290], "4-2": [450, 270], "4-3": [485, 290], "4-4": [520, 310],
    "4-5": [560, 335], "5-3": [520, 310], "5-4": [560, 335], "5-5": [600, 360],
    "6-4": [600, 360], "6-5": [645, 385],
  },
};

const round5 = (n: number) => Math.round(n / 5) * 5;
const roundup5 = (n: number) => Math.ceil(n / 5) * 5;

/** Precio base one-time + minutos de trabajo, por tabla o formula de respaldo. */
export function baseQuote(
  serviceType: ServiceType,
  bedrooms: number,
  bathrooms: number,
): { base: number; minutes: number } {
  const br = Math.max(0, Math.round(bedrooms));
  const ba = Math.max(0, Math.round(bathrooms));
  const cell = TABLE[serviceType]?.[`${br}-${ba}`];
  if (cell) return { base: cell[0], minutes: cell[1] };

  // Respaldo: formula simple + tiempo derivado (base = $50 x cuadrilla x horas).
  const f = FORMULA[serviceType] ?? FORMULA.general;
  const base = roundup5(f.base + br * f.perBr + ba * f.perBa);
  const crew = crewFor(br, ba);
  const minutes = Math.round((base / (50 * crew)) * 60);
  return { base, minutes };
}

/** Horas estimadas, redondeadas a la media hora mas cercana (para mostrar). */
export function durationHours(minutes: number): number {
  return Math.round((minutes / 60) * 2) / 2;
}

export type Estimate = {
  price: number; // precio total unico (USD)
  minutes: number; // tiempo de trabajo estimado
  hours: number; // tiempo redondeado a la media hora
  discount: number; // 0 a 1
};

export function estimatePrice(input: {
  serviceType: ServiceType;
  frequency: Frequency;
  bedrooms: number;
  bathrooms: number;
  addOnsUsd?: number;
}): Estimate {
  const { base, minutes } = baseQuote(
    input.serviceType,
    input.bedrooms,
    input.bathrooms,
  );
  const discount = FREQUENCY_DISCOUNT[input.frequency] ?? 0;
  const addOns = Math.max(0, input.addOnsUsd ?? 0);
  const price = round5(base * (1 - discount)) + addOns;

  return { price, minutes, hours: durationHours(minutes), discount };
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
