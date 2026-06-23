import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thesageessence.com"),
  title: "Book a Clean | Sage Essence",
  description:
    "Non toxic home cleaning in Austin. Reserve your clean with Sage Essence.",
  keywords: [
    "non-toxic cleaning Austin",
    "eco-friendly house cleaning",
    "green cleaning service Austin TX",
    "hypoallergenic cleaning",
    "pet safe cleaning",
  ],
  authors: [{ name: "Sage Essence LLC" }],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    title: "Book a Clean | Sage Essence",
    description:
      "Non toxic home cleaning in Austin. Reserve your clean with Sage Essence.",
    siteName: "Sage Essence",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Book a Clean | Sage Essence",
    description:
      "Non toxic home cleaning in Austin. Reserve your clean with Sage Essence.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${jost.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
