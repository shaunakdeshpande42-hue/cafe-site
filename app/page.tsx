"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import FadeIn from "@/components/FadeIn";
import { menuItems } from "@/lib/menu-data";

const featuredItems = menuItems.filter((item) => item.badge === "Bestseller" || item.badge === "Signature").slice(0, 3);

const reviews = [
  {
    name: "Aditi Sharma",
    rating: 5,
    text: "The eclairs here are absolutely divine. Every bite is pure happiness — you can taste the craft that goes into each piece.",
  },
  {
    name: "Rohan Mehta",
    rating: 5,
    text: "EM's hot chocolate on a cool evening is unmatched. The space is gorgeous and the staff genuinely makes you feel at home.",
  },
  {
    name: "Priya Nair",
    rating: 5,
    text: "Ordered a custom cake for my anniversary — it was more beautiful and delicious than I ever imagined. Absolutely world-class.",
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gold">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        <Image
          src="/gallery/10.webp"
          alt="EM Patisserie interior"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-charcoal/55" />

        <motion.div
          className="relative z-10 text-center px-6 flex flex-col items-center gap-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <Image
            src="/logo.jpeg"
            alt="EM Patisserie logo"
            width={100}
            height={100}
            className="object-contain brightness-0 invert mb-2"
            priority
          />
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
              href="/order"
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
                    {item.image ? (
                      <Image
                        src={item.image}
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

      {/* Reviews */}
      <section className="py-20 px-6 bg-cream">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-xs tracking-widest uppercase text-gold font-sans mb-3">Testimonials</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-charcoal">What our guests say</h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((review, i) => (
              <FadeIn key={review.name} delay={i * 0.1}>
                <div className="bg-cream-dark p-8 flex flex-col gap-4">
                  <StarRating count={review.rating} />
                  <p className="font-serif text-base text-charcoal/80 leading-relaxed italic">
                    &ldquo;{review.text}&rdquo;
                  </p>
                  <p className="text-xs tracking-widest uppercase text-charcoal/50 font-sans mt-auto">
                    — {review.name}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
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
            Order a custom cake or a curated chocolate gift box for any occasion.
          </p>
          <Link
            href="/order"
            className="px-8 py-3.5 bg-burgundy text-cream text-sm tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors duration-200"
          >
            Order Now
          </Link>
        </FadeIn>
      </section>
    </div>
  );
}
