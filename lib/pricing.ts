import type { ServiceType, Frequency } from "./constants";

// ---------------------------------------------------------------------------
// Modelo de precios de Sage Essence (nivel medio para Austin, 2026).
// Referencias de mercado: estandar ~$0.09-0.14/sqft, profunda +50-100%,
// mudanza $200-450, recurrencia con 10-20% de descuento. Las limpiadoras
// cobran ~$18/h, asi que el margen del negocio queda holgado.
//
// Formula:
//   raw = (BASE + sqft*PER_SQFT + dorm*PER_BEDROOM + bano*PER_BATHROOM)
//         * multiplicador de servicio * (1 - descuento de frecuencia)
//   precio = raw + adicionales
// Se muestra un rango ajustado (RANGE_SPREAD = 8%) para cubrir casas en peor
// estado, sin la brecha grande que asusta al cliente.
//
// IMPORTANTE: estos numeros estan replicados identicos en el estimador del
// landing (public/landing.html, generado por scripts/build_landing.py).
// Si cambias uno, cambia el otro.
// ---------------------------------------------------------------------------

const BASE = 45;
const PER_SQFT = 0.06;
const PER_BEDROOM = 9;
const PER_BATHROOM = 13;

export const SERVICE_MULTIPLIER: Record<ServiceType, number> = {
  general: 1.0,
  deep: 1.6,
  move_in_out: 1.8,
  one_time: 1.2,
};

// Descuentos por frecuencia.
export const FREQUENCY_DISCOUNT: Record<Frequency, number> = {
  weekly: 0.2,
  biweekly: 0.15,
  monthly: 0.1,
  once: 0,
};

// El extremo alto del rango queda 8 por ciento por encima del precio base.
const RANGE_SPREAD = 0.08;

// Pies cuadrados por defecto si no se informan (estimado por dormitorios).
export function defaultSquareFeet(bedrooms: number): number {
  return Math.max(0, bedrooms) * 350 + 500;
}

const round5 = (n: number) => Math.round(n / 5) * 5;

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
  squareFeet?: number;
  addOnsUsd?: number;
}): Estimate {
  const sqft =
    input.squareFeet != null && input.squareFeet > 0
      ? input.squareFeet
      : defaultSquareFeet(input.bedrooms);

  const raw =
    (BASE +
      sqft * PER_SQFT +
      Math.max(0, input.bedrooms) * PER_BEDROOM +
      Math.max(0, input.bathrooms) * PER_BATHROOM) *
    (SERVICE_MULTIPLIER[input.serviceType] ?? 1) *
    (1 - (FREQUENCY_DISCOUNT[input.frequency] ?? 0));

  const addOns = Math.max(0, input.addOnsUsd ?? 0);
  const low = round5(raw + addOns);
  const high = round5(raw * (1 + RANGE_SPREAD) + addOns);
  const discount = FREQUENCY_DISCOUNT[input.frequency] ?? 0;

  return { low, high, discount };
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
