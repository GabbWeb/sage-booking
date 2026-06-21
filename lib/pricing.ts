import type { ServiceType, Frequency } from "./constants";

// ---------------------------------------------------------------------------
// IMPORTANTE: estos numeros son un punto de partida razonable. Antes de salir
// a produccion, ajustalos para que coincidan EXACTO con el estimador que ya
// vive en la web actual (sage-essence-v7.html). El archivo no esta en este
// repo todavia; cuando lo tengas, pasamelo y replicamos su formula tal cual.
// ---------------------------------------------------------------------------

const SERVICE_BASE: Record<ServiceType, number> = {
  deep: 200,
  general: 120,
  move_in_out: 260,
  one_time: 150,
};

const PER_BEDROOM = 25;
const PER_BATHROOM = 20;

// El extremo alto del rango estimado queda 30 por ciento por encima del bajo.
const RANGE_SPREAD = 0.3;

// Descuentos por frecuencia (requerimiento del estimador actual).
export const FREQUENCY_DISCOUNT: Record<Frequency, number> = {
  weekly: 0.2,
  biweekly: 0.15,
  monthly: 0.1,
  once: 0,
};

export type Estimate = {
  low: number;
  high: number;
  discount: number; // 0 a 1
};

export function estimatePrice(input: {
  serviceType: ServiceType;
  frequency: Frequency;
  bedrooms: number;
  bathrooms: number;
}): Estimate {
  const base =
    (SERVICE_BASE[input.serviceType] ?? 0) +
    Math.max(0, input.bedrooms) * PER_BEDROOM +
    Math.max(0, input.bathrooms) * PER_BATHROOM;

  const discount = FREQUENCY_DISCOUNT[input.frequency] ?? 0;
  const multiplier = 1 - discount;

  const low = Math.round(base * multiplier);
  const high = Math.round(base * (1 + RANGE_SPREAD) * multiplier);

  return { low, high, discount };
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
