import type { MetadataRoute } from "next";

const SITE = "https://thesageessence.com";

// Permite indexar el sitio publico (landing y reservas) y bloquea las zonas
// privadas (panel, login, herramientas dev y API).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login", "/dev", "/api"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
