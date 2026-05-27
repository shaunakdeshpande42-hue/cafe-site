import Link from "next/link";
import Image from "next/image";

const socialLinks = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/empatisserie",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="bg-charcoal text-cream/80">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Brand */}
        <div className="flex flex-col gap-4">
          <Image
            src="/logo.svg"
            alt="EM Patisserie"
            width={88}
            height={56}
            className="object-contain brightness-0 invert opacity-90"
            unoptimized
          />
          <p className="text-sm leading-relaxed text-cream/60 max-w-xs">
            Handcrafted pastries, artisanal chocolates, and custom cakes —
            made with love every single day.
          </p>
        </div>

        {/* Quick links */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs tracking-widest uppercase text-cream/40 mb-2">
            Navigate
          </h4>
          {[
            { href: "/", label: "Home" },
            { href: "/menu", label: "Menu" },
            { href: "/gallery", label: "Gallery" },
            { href: "/events", label: "Events" },
            { href: "/order", label: "Order Online" },
            { href: "/custom-order", label: "Custom Cake" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm hover:text-cream transition-colors duration-200"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Contact + Socials */}
        <div className="flex flex-col gap-4">
          <h4 className="text-xs tracking-widest uppercase text-cream/40 mb-1">
            Find Us
          </h4>
          <p className="text-sm leading-relaxed text-cream/60">
            Kalyani Nagar<br />
            Pune – 411006, Maharashtra
          </p>
          <div className="flex flex-col gap-1 text-sm text-cream/50">
            <span>Open daily · 10:00 AM – 10:00 PM</span>
          </div>
          <a href="tel:+918857874437" className="text-sm text-cream/50 hover:text-cream transition-colors">
            +91 88578 74437
          </a>
          {/* ↓ Replace destination with your actual address */}
          <a
            href="https://www.google.com/maps/dir/?api=1&destination=18.544375%2C73.9004449"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs tracking-widest uppercase font-sans text-blush hover:text-cream transition-colors mt-1"
          >
            Get Directions
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13L13 3M13 3H7M13 3v6" />
            </svg>
          </a>
          <div className="flex gap-4 mt-2">
            {socialLinks.map(({ label, href, icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-cream/50 hover:text-blush transition-colors duration-200"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-cream/10 px-6 lg:px-10 py-5 max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
        <p className="text-xs text-cream/30">
          © {new Date().getFullYear()} EM Patisserie & Artisanal Chocolates. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
