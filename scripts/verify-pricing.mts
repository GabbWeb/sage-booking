// Tests del modelo de precios (tabla de Katerina). node scripts/verify-pricing.mts
import assert from "node:assert/strict";
import {
  estimatePrice,
  formatUsd,
  baseQuote,
  durationHours,
  FREQUENCY_DISCOUNT,
} from "../lib/pricing.ts";

const price = (
  serviceType: "general" | "deep" | "move_in_out",
  frequency: "once" | "weekly" | "biweekly" | "monthly",
  bedrooms: number,
  bathrooms: number,
  addOnsUsd = 0,
) =>
  estimatePrice({ serviceType, frequency, bedrooms, bathrooms, addOnsUsd }).price;

// 1) Precios EXACTOS de la hoja (one-time, sin adicionales)
assert.equal(price("deep", "once", 2, 2), 335, "deep 2/2 = 335");
assert.equal(price("general", "once", 3, 2), 245, "general 3/2 = 245");
assert.equal(price("move_in_out", "once", 1, 1), 260, "move 1/1 = 260");
assert.equal(price("general", "once", 1, 1), 135, "general 1/1 = 135");

// 2) Duracion de la hoja: 2/2 deep ~ 3.5 horas (ejemplo de Katerina)
assert.equal(
  estimatePrice({ serviceType: "deep", frequency: "once", bedrooms: 2, bathrooms: 2 }).hours,
  3.5,
  "deep 2/2 dura 3.5h",
);

// 3) La frecuencia descuenta (one-time > monthly > biweekly > weekly)
const once = price("general", "once", 3, 2);
const monthly = price("general", "monthly", 3, 2);
const biweekly = price("general", "biweekly", 3, 2);
const weekly = price("general", "weekly", 3, 2);
assert.ok(
  weekly < biweekly && biweekly < monthly && monthly < once,
  "weekly < biweekly < monthly < once",
);
assert.equal(weekly, Math.round((245 * 0.8) / 5) * 5, "weekly = round5(245*0.8)");

// 4) Descuentos por frecuencia (hoja)
assert.equal(FREQUENCY_DISCOUNT.weekly, 0.2);
assert.equal(FREQUENCY_DISCOUNT.biweekly, 0.15);
assert.equal(FREQUENCY_DISCOUNT.monthly, 0.1);
assert.equal(FREQUENCY_DISCOUNT.once, 0);

// 5) Los adicionales se suman al total
assert.equal(price("deep", "once", 2, 2, 70), 335 + 70, "adicionales suman");

// 6) Respaldo por formula fuera de la tabla (7 dormitorios)
const big = baseQuote("general", 7, 3);
assert.equal(big.base, Math.ceil((45 + 7 * 50 + 3 * 25) / 5) * 5, "formula 7/3");
assert.ok(big.minutes > 0, "formula da duracion");

// 7) Profunda mas cara que estandar; mudanza la mas cara
assert.ok(price("deep", "once", 3, 2) > price("general", "once", 3, 2));
assert.ok(price("move_in_out", "once", 3, 2) > price("deep", "once", 3, 2));

// 8) durationHours redondea a la media hora
assert.equal(durationHours(160), 2.5, "2h40 -> 2.5h");
assert.equal(durationHours(200), 3.5, "3h20 -> 3.5h");

// 9) Formato USD sin decimales
assert.equal(formatUsd(335), "$335");
assert.equal(formatUsd(1500), "$1,500");

console.log("OK pricing: tabla de la hoja, duracion, frecuencia, adicionales y formato.");
