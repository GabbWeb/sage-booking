// Tests de la logica de precio. Corre con: node scripts/verify-pricing.mts
import assert from "node:assert/strict";
import {
  estimatePrice,
  formatUsd,
  FREQUENCY_DISCOUNT,
} from "../lib/pricing.ts";

// Base deep + 2 bed + 1 bath = 200 + 50 + 20 = 270
const baseInput = {
  serviceType: "deep" as const,
  bedrooms: 2,
  bathrooms: 1,
};

// 1) "once" no aplica descuento
const once = estimatePrice({ ...baseInput, frequency: "once" });
assert.equal(once.discount, 0, "once no descuenta");
assert.equal(once.low, 270, "base low correcto");
assert.equal(once.high, Math.round(270 * 1.3), "high es +30%");

// 2) descuentos por frecuencia correctos
assert.equal(FREQUENCY_DISCOUNT.weekly, 0.2);
assert.equal(FREQUENCY_DISCOUNT.biweekly, 0.15);
assert.equal(FREQUENCY_DISCOUNT.monthly, 0.1);
assert.equal(FREQUENCY_DISCOUNT.once, 0);

// 3) el descuento se aplica sobre el bajo y el alto
const weekly = estimatePrice({ ...baseInput, frequency: "weekly" });
assert.equal(weekly.low, Math.round(270 * 0.8), "weekly low = base * 0.8");
assert.ok(weekly.low < once.low, "weekly mas barato que once");
assert.ok(weekly.high < once.high, "weekly high mas barato que once");

// 4) a mayor frecuencia, menor precio (orden monotono)
const biweekly = estimatePrice({ ...baseInput, frequency: "biweekly" });
const monthly = estimatePrice({ ...baseInput, frequency: "monthly" });
assert.ok(
  weekly.low < biweekly.low &&
    biweekly.low < monthly.low &&
    monthly.low < once.low,
  "weekly < biweekly < monthly < once",
);

// 5) mas ambientes, mas caro
const bigger = estimatePrice({
  serviceType: "deep",
  frequency: "once",
  bedrooms: 4,
  bathrooms: 3,
});
assert.ok(bigger.low > once.low, "mas ambientes sube el precio");

// 6) cada servicio tiene una base distinta
const general = estimatePrice({
  serviceType: "general",
  frequency: "once",
  bedrooms: 2,
  bathrooms: 1,
});
assert.ok(general.low !== once.low, "general y deep difieren");

// 7) formato de moneda en USD sin decimales
assert.equal(formatUsd(268), "$268");
assert.equal(formatUsd(1500), "$1,500");

console.log("OK pricing: descuentos, monotonia, bases por servicio y formato.");
