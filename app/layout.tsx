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
  openGraph: {
    title: "Book a Clean | Sage Essence",
    description:
      "Non toxic home cleaning in Austin. Reserve your clean with Sage Essence.",
    siteName: "Sage Essence",
    type: "website",
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
