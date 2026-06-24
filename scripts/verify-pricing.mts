// Tests de la logica de precio. Corre con: node scripts/verify-pricing.mts
import assert from "node:assert/strict";
import {
  estimatePrice,
  formatUsd,
  FREQUENCY_DISCOUNT,
  SERVICE_MULTIPLIER,
} from "../lib/pricing.ts";

const base = {
  serviceType: "deep" as const,
  bedrooms: 2,
  bathrooms: 1,
  squareFeet: 1500,
};

// 1) "once" no descuenta; rango valido y ajustado (~8%)
const once = estimatePrice({ ...base, frequency: "once" });
assert.equal(once.discount, 0, "once no descuenta");
assert.ok(once.low > 0 && once.high >= once.low, "rango valido");
assert.ok(once.high <= Math.round(once.low * 1.12), "rango ajustado, no una brecha grande");

// 2) descuentos por frecuencia correctos
assert.equal(FREQUENCY_DISCOUNT.weekly, 0.2);
assert.equal(FREQUENCY_DISCOUNT.biweekly, 0.15);
assert.equal(FREQUENCY_DISCOUNT.monthly, 0.1);
assert.equal(FREQUENCY_DISCOUNT.once, 0);

// 3) la recurrencia abarata
const weekly = estimatePrice({ ...base, frequency: "weekly" });
assert.ok(weekly.low < once.low && weekly.high < once.high, "weekly mas barato que once");

// 4) a mayor frecuencia, menor precio (orden monotono)
const biweekly = estimatePrice({ ...base, frequency: "biweekly" });
const monthly = estimatePrice({ ...base, frequency: "monthly" });
assert.ok(
  weekly.low < biweekly.low && biweekly.low < monthly.low && monthly.low < once.low,
  "weekly < biweekly < monthly < once",
);

// 5) mas pies cuadrados sube el precio
const bigger = estimatePrice({ ...base, frequency: "once", squareFeet: 3000 });
assert.ok(bigger.low > once.low, "mas sqft sube el precio");

// 6) mas ambientes sube el precio
const moreRooms = estimatePrice({
  ...base,
  frequency: "once",
  bedrooms: 5,
  bathrooms: 4,
});
assert.ok(moreRooms.low > once.low, "mas ambientes sube el precio");

// 7) los adicionales se suman al total
const withAddons = estimatePrice({ ...base, frequency: "once", addOnsUsd: 60 });
assert.equal(withAddons.low, once.low + 60, "adicionales suman al low");
assert.equal(withAddons.high, once.high + 60, "adicionales suman al high");

// 8) multiplicadores de servicio: deep mas caro que general, mudanza el mas intenso
const general = estimatePrice({ ...base, serviceType: "general", frequency: "once" });
assert.ok(once.low > general.low, "deep mas caro que general");
assert.equal(SERVICE_MULTIPLIER.general, 1);
assert.ok(
  SERVICE_MULTIPLIER.move_in_out >= SERVICE_MULTIPLIER.deep,
  "move in/out es el mas intenso",
);

// 9) formato de moneda en USD sin decimales
assert.equal(formatUsd(268), "$268");
assert.equal(formatUsd(1500), "$1,500");

console.log("OK pricing: sqft, adicionales, descuentos, monotonia, servicios y formato.");
