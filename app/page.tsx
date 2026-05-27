"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import FadeIn from "@/components/FadeIn";
import ReviewsSection from "@/components/ReviewsSection";
import InstagramSection from "@/components/InstagramSection";
import SpecialsBanner from "@/components/SpecialsBanner";

type DbMenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  badge: string | null;
  image_url: string | null;
};

export default function Home() {
  const [featuredItems, setFeaturedItems] = useState<DbMenuItem[]>([]);

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((items: DbMenuItem[]) => {
        setFeaturedItems(
          items
            .filter((item) => item.badge === "Bestseller" || item.badge === "Signature")
            .slice(0, 3)
        );
      })
      .catch(() => {});
  }, []);
  return (
    <div>
      {/* Hero */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <Image
          src="/gallery/10.webp"
          alt="EM Patisserie interior"
          fill
          sizes="100vw"
          className="object-cover object-[center_40%]"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-charcoal/55" />

        <motion.div
          className="relative z-10 text-center px-6 flex flex-col items-center gap-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col items-center gap-4 mb-2">
            <Image
              src="/logo.svg"
              alt="EM Patisserie logo"
              width={180}
              height={115}
              className="object-contain brightness-0 invert opacity-95 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
              priority
              unoptimized
            />
            {/* thin ornamental rule */}
            <div className="flex items-center gap-3 w-40">
              <span className="flex-1 h-px bg-cream/40" />
              <span className="w-1 h-1 rounded-full bg-cream/40" />
              <span className="flex-1 h-px bg-cream/40" />
            </div>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-cream leading-tight tracking-wide">
            EM Patisserie &<br />Artisanal Chocolates
          </h1>
          <p className="text-cream/80 text-lg sm:text-xl font-sans font-light tracking-wider max-w-md">
            Handcrafted with love. Enjoyed with care.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link
              href="/menu"
              className="px-8 py-3.5 bg-burgundy text-cream text-sm tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors duration-200"
            >
              Explore Menu
            </Link>
            <Link
              href="/menu"
              className="px-8 py-3.5 border border-cream/60 text-cream text-sm tracking-widest uppercase font-sans hover:bg-cream/10 transition-colors duration-200"
            >
              Order Online
            </Link>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
        >
          <span className="text-cream/40 text-xs tracking-widest uppercase font-sans">Scroll</span>
          <motion.div
            className="w-px h-10 bg-cream/30"
            animate={{ scaleY: [0, 1, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            style={{ transformOrigin: "top" }}
          />
        </motion.div>

        {/* Specials banner — slides up from hero bottom */}
        <SpecialsBanner />
      </section>

      {/* About strip */}
      <section className="bg-burgundy py-16 px-6">
        <FadeIn className="max-w-3xl mx-auto text-center flex flex-col gap-4">
          <p className="text-xs tracking-widest uppercase text-blush font-sans">Our Story</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-cream leading-snug">
            Where every creation is a labour of love
          </h2>
          <p className="text-cream/70 font-sans text-base leading-relaxed max-w-2xl mx-auto">
            EM Patisserie was born from a passion for the finest European baking traditions,
            reimagined for the Indian palate. Each pastry, chocolate, and cake is made by hand
            in our kitchen — no shortcuts, no compromises.
          </p>
        </FadeIn>
      </section>

      {/* Featured items */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-xs tracking-widest uppercase text-gold font-sans mb-3">From Our Kitchen</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-charcoal">A few favourites</h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {featuredItems.map((item, i) => (
              <FadeIn key={item.id} delay={i * 0.1}>
                <div className="group flex flex-col gap-4">
                  <div className="aspect-square bg-cream-dark overflow-hidden">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        width={400}
                        height={400}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="font-serif text-4xl text-burgundy/20">EM</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-serif text-lg text-charcoal">{item.name}</h3>
                      <span className="text-sm font-sans text-burgundy shrink-0">₹{item.price}</span>
                    </div>
                    <p className="text-sm text-charcoal/60 font-sans mt-1 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="text-center mt-12">
            <Link
              href="/menu"
              className="inline-block px-8 py-3.5 border border-burgundy text-burgundy text-sm tracking-widest uppercase font-sans hover:bg-burgundy hover:text-cream transition-colors duration-200"
            >
              View Full Menu
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Gallery teaser */}
      <section className="py-20 px-6 bg-blush-light">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-10">
            <p className="text-xs tracking-widest uppercase text-gold font-sans mb-3">The Space</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-charcoal">Step inside EM</h2>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["5.webp", "8.webp", "14.webp", "12.webp"].map((photo, i) => (
              <FadeIn key={photo} delay={i * 0.08} className={i === 0 ? "col-span-2 row-span-2" : ""}>
                <div className={`overflow-hidden ${i === 0 ? "aspect-square" : "aspect-square"}`}>
                  <Image
                    src={`/gallery/${photo}`}
                    alt="EM Patisserie"
                    width={600}
                    height={600}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="text-center mt-10">
            <Link
              href="/gallery"
              className="inline-block px-8 py-3.5 border border-charcoal/30 text-charcoal text-sm tracking-widest uppercase font-sans hover:bg-charcoal hover:text-cream transition-colors duration-200"
            >
              View Gallery
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* Reviews — live from Google */}
      <ReviewsSection />

      {/* Instagram feed */}
      <InstagramSection />

      {/* Location & Directions */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="mb-12">
            <p className="text-xs tracking-widest uppercase text-gold font-sans mb-3">Visit Us</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-charcoal">Find EM Patisserie</h2>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-cream-dark">

            {/* Left — address + hours */}
            <FadeIn className="flex flex-col justify-between p-8 sm:p-10 gap-8 border-b lg:border-b-0 lg:border-r border-cream-dark">

              {/* Address */}
              <div className="flex flex-col gap-6">
                <div className="flex gap-4">
                  <div className="shrink-0 mt-0.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-burgundy">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs tracking-widest uppercase font-sans text-charcoal/40 mb-2">Address</p>
                    <p className="font-serif text-lg text-charcoal leading-snug">EM Patisserie &amp; Artisanal Chocolates</p>
                    <p className="font-sans text-sm text-charcoal/60 mt-1 leading-relaxed">
                      Kalyani Nagar<br />
                      Pune – 411006, Maharashtra
                    </p>
                  </div>
                </div>

                {/* Hours */}
                <div className="flex gap-4">
                  <div className="shrink-0 mt-0.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-burgundy">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs tracking-widest uppercase font-sans text-charcoal/40 mb-2">Opening Hours</p>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { days: "Monday – Sunday", hours: "10:00 AM – 10:00 PM" },
                      ].map(({ days, hours }) => (
                        <div key={days} className="flex justify-between gap-6">
                          <span className="font-sans text-sm text-charcoal/60">{days}</span>
                          <span className="font-sans text-sm text-charcoal font-medium whitespace-nowrap">{hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex gap-4">
                  <div className="shrink-0 mt-0.5">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-burgundy">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs tracking-widest uppercase font-sans text-charcoal/40 mb-2">Phone</p>
                    <a href="tel:+918857874437" className="font-sans text-sm text-charcoal hover:text-burgundy transition-colors">
                      +91 88578 74437
                    </a>
                  </div>
                </div>
              </div>

              {/* CTA button */}
              {/* ↓ Replace YOUR_FULL_ADDRESS with the actual address for the directions link */}
              <a
                href="https://www.google.com/maps/dir/?api=1&destination=18.544375%2C73.9004449"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 self-start px-7 py-3.5 bg-charcoal text-cream text-xs tracking-widest uppercase font-sans hover:bg-burgundy transition-colors duration-200 group"
              >
                Get Directions
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform">
                  <path fillRule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clipRule="evenodd" />
                </svg>
              </a>
            </FadeIn>

            {/* Right — Google Map embed */}
            <FadeIn className="min-h-[340px] lg:min-h-0 relative bg-cream-dark">
              {/*
                ── HOW TO UPDATE THE MAP ──────────────────────────────────────
                1. Go to maps.google.com and search for your café's address
                2. Click Share → Embed a map → Copy the src URL from the <iframe>
                3. Replace the src value below with that URL
                ────────────────────────────────────────────────────────────────
              */}
              <iframe
                src="https://maps.google.com/maps?q=18.544375,73.9004449&z=17&ie=UTF8&iwloc=B&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: "340px", display: "block" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="EM Patisserie location"
                className="w-full h-full absolute inset-0"
              />
            </FadeIn>

          </div>

          {/* Parking note */}
          <FadeIn className="mt-4 flex items-start gap-2">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-charcoal/30 mt-0.5 shrink-0">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            <p className="text-xs font-sans text-charcoal/35 leading-relaxed">
              Street parking available on Lane Number 3. For bulk orders and event pickups, please inform us in advance.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-24 px-6 overflow-hidden">
        <Image
          src="/gallery/13.webp"
          alt="EM cakes"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-charcoal/70" />
        <FadeIn className="relative z-10 max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
          <h2 className="font-serif text-3xl sm:text-4xl text-cream leading-snug">
            Celebrating something special?
          </h2>
          <p className="text-cream/70 font-sans text-base leading-relaxed">
            Every custom cake is made entirely by hand — share your vision and we&rsquo;ll bring it to life.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/custom-order"
              className="px-8 py-3.5 bg-burgundy text-cream text-sm tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors duration-200"
            >
              Order a Custom Cake
            </Link>
            <Link
              href="/menu"
              className="px-8 py-3.5 border border-cream/50 text-cream text-sm tracking-widest uppercase font-sans hover:bg-cream/10 transition-colors duration-200"
            >
              Browse Menu
            </Link>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
