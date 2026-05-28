import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Cake Orders — Celebrate with EM",
  description:
    "Order a bespoke custom celebration cake from EM Patisserie, Pune. Birthdays, weddings, anniversaries — made entirely by hand. 48-hour advance notice required.",
  openGraph: {
    title: "Custom Cake Orders | EM Patisserie",
    description:
      "Bespoke custom cakes for every celebration — birthdays, weddings, anniversaries. Handcrafted at EM Patisserie, Kalyani Nagar, Pune.",
  },
  alternates: { canonical: "/custom-order" },
};

export default function CustomOrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
