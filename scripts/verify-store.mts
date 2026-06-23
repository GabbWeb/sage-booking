// Verificacion del store local (FileStore) sin Supabase ni red.
// Autocontenido: usa un directorio temporal y lo limpia al final.
// Corre con: node scripts/verify-store.mts

import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";

// Apuntar el store a un temp ANTES de importar el modulo (lee el env al cargar).
const dir = mkdtempSync(path.join(os.tmpdir(), "sage-store-"));
process.env.SAGE_DATA_DIR = dir;

const { FileStore } = await import("../lib/store/file-store.ts");

try {
  const store = new FileStore();
  assert.equal(store.mode, "local", "el modo debe ser local");

  // 1) Cliente nuevo
  const id1 = await store.findOrCreateCustomer({
    fullName: "Jane Rivera",
    email: "Jane@Email.com",
    phone: "512 555 0142",
    zipCode: "78704",
    allergies: "fragrance free",
    marketingOptIn: true,
  });
  assert.ok(id1, "deberia devolver un id de cliente");

  // 2) Mismo email (distinta capitalizacion) -> mismo cliente
  const id2 = await store.findOrCreateCustomer({
    fullName: "Jane R.",
    email: "jane@email.com",
    marketingOptIn: false,
  });
  assert.equal(id2, id1, "el match por email debe ser case-insensitive");

  // 3) Reserva nace en pending
  const bookingId = await store.createBooking(id1, {
    serviceType: "deep",
    frequency: "biweekly",
    bedrooms: 3,
    bathrooms: 2,
    requestedExtras: "inside the fridge",
    estimateLow: 268,
    estimateHigh: 348,
  });
  assert.ok(bookingId, "deberia devolver un id de reserva");

  // 4) Lead abandonado
  const leadId = await store.saveAbandonedLead({
    email: "lead@email.com",
    lastStepReached: "Your details",
    partialData: { serviceType: "general" },
  });
  assert.ok(leadId, "deberia devolver un id de lead");

  // 5) Listado
  const bookings = await store.listBookings();
  assert.equal(bookings.length, 1, "deberia haber 1 reserva");
  assert.equal(bookings[0].status, "pending", "la reserva nace en pending");
  assert.equal(bookings[0].service_type, "deep");
  assert.equal(bookings[0].bedrooms, 3);

  // 6) email_log: dedupe por tipo
  assert.equal(await store.hasEmail(bookingId, "prep"), false, "sin email aun");
  await store.logEmail(bookingId, "prep");
  assert.equal(await store.hasEmail(bookingId, "prep"), true, "prep registrado");
  assert.equal(
    await store.hasEmail(bookingId, "reminder_2days"),
    false,
    "otro tipo no cuenta",
  );

  console.log(
    "OK store: cliente, dedupe email, reserva, lead, listado y email_log.",
  );
} finally {
  rmSync(dir, { recursive: true, force: true });
}
