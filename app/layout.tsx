import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://empatisserie.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "EM Patisserie & Artisanal Chocolates | Kalyani Nagar, Pune",
    template: "%s | EM Patisserie",
  },
  description:
    "Pune's finest patisserie — handcrafted pastries, artisanal chocolates, custom celebration cakes & desserts. Open daily 10 AM–10 PM in Kalyani Nagar.",

  keywords: [
    "patisserie Pune",
    "artisanal chocolates Pune",
    "custom cakes Pune",
    "pastry shop Kalyani Nagar",
    "EM Patisserie",
    "French patisserie Pune",
    "birthday cakes Pune",
    "desserts Kalyani Nagar",
    "cake shop Pune",
    "chocolate shop Pune",
  ],

  authors: [{ name: "EM Patisserie & Artisanal Chocolates" }],
  creator: "EM Patisserie",
  publisher: "EM Patisserie",

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "EM Patisserie & Artisanal Chocolates",
    title: "EM Patisserie & Artisanal Chocolates | Kalyani Nagar, Pune",
    description:
      "Handcrafted pastries, artisanal chocolates, and custom celebration cakes — made fresh daily in Kalyani Nagar, Pune.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "EM Patisserie — pastries and chocolates",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "EM Patisserie & Artisanal Chocolates",
    description:
      "Handcrafted pastries, chocolates & custom cakes. Kalyani Nagar, Pune — open daily 10 AM–10 PM.",
    images: ["/og-image.jpg"],
  },

  alternates: {
    canonical: SITE_URL,
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    name: "EM Patisserie & Artisanal Chocolates",
    description:
      "Handcrafted pastries, artisanal chocolates, and custom celebration cakes made fresh daily in Kalyani Nagar, Pune.",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.svg`,
    image: `${SITE_URL}/og-image.jpg`,
    telephone: "+918857874437",
    email: "empatisserieofficial@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Kalyani Nagar",
      addressLocality: "Pune",
      addressRegion: "Maharashtra",
      postalCode: "411006",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 18.544375,
      longitude: 73.9004449,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday",
        ],
        opens: "10:00",
        closes: "22:00",
      },
    ],
    sameAs: ["https://www.instagram.com/empatisserie"],
    priceRange: "₹₹",
    servesCuisine: ["Patisserie", "French", "Chocolates", "Desserts"],
    hasMap: "https://www.google.com/maps/dir/?api=1&destination=18.544375%2C73.9004449",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Credit Card, UPI",
  };

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-charcoal font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
