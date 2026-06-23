import type { MetadataRoute } from "next";

const SITE = "https://thesageessence.com";

// Paginas publicas indexables. La raiz (landing) es la mas importante; /booking
// es la pagina de reserva.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE}/booking`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
