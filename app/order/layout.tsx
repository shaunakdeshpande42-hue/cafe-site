import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Online — Pickup from EM Patisserie",
  description:
    "Order pastries, chocolates, and desserts online for pickup at EM Patisserie, Kalyani Nagar, Pune. Choose your pickup time and pay securely.",
  openGraph: {
    title: "Order Online | EM Patisserie",
    description:
      "Place your order for pastries and chocolates at EM Patisserie, Pune — pick up at your preferred time.",
  },
  alternates: { canonical: "/order" },
};

export default function OrderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
