import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Menu — Pastries, Chocolates & Cakes",
  description:
    "Browse our full menu of handcrafted pastries, artisanal chocolates, desserts, cakes, and drinks at EM Patisserie, Kalyani Nagar, Pune. Order online for pickup.",
  openGraph: {
    title: "Menu | EM Patisserie",
    description:
      "Pastries, chocolates, custom cakes, desserts, and drinks — made fresh daily in Pune. Order online.",
  },
  alternates: { canonical: "/menu" },
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
