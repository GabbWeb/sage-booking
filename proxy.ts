import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// La raiz "/" sirve el landing estatico (public/landing.html). El resto del
// sitio (/booking, /admin, /login, /dev) son rutas normales de la app y pasan
// sin cambios. El proxy corre antes del filesystem (Next 16 renombro
// middleware a proxy), por eso puede mostrar el landing en "/" sin que exista
// una page de App Router ahi.
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/landing.html";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  // No interferir con API (Stripe, crons, OAuth), assets de Next ni el propio
  // archivo del landing.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|landing.html|robots.txt|sitemap.xml).*)",
  ],
};
