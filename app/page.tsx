import { redirect } from "next/navigation";

// En produccion la raiz "/" la sirve el landing estatico via proxy.ts (corre
// antes del filesystem). Esta page es solo un respaldo: si el proxy no estuviera
// activo, "/" lleva al sistema de reservas en lugar de quedar en blanco.
export default function Home() {
  redirect("/booking");
}
