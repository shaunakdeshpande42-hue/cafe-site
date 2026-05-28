import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import FadeIn from "@/components/FadeIn";

export const metadata: Metadata = {
  title: "Gallery — Inside EM Patisserie",
  description:
    "A visual tour of EM Patisserie — our space, pastries, cakes, and chocolates. Located in Kalyani Nagar, Pune.",
  openGraph: {
    title: "Gallery | EM Patisserie",
    description: "Step inside EM Patisserie — photos of our café, pastries, cakes, and chocolates in Pune.",
  },
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <div className="bg-cream min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative h-[52vh] min-h-[360px] overflow-hidden">
        <Image
          src="/gallery/9.webp"
          alt="EM Patisserie"
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-charcoal/60" />
        {/* Navbar clearance + centred title */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pt-20">
          <p className="text-[10px] tracking-widest uppercase text-cream/50 font-sans mb-3">
            The World of EM
          </p>
          <h1 className="font-serif text-5xl sm:text-6xl text-cream tracking-wide">Gallery</h1>
          {/* Ornamental rule */}
          <div className="flex items-center gap-3 w-36 mt-5">
            <span className="flex-1 h-px bg-cream/30" />
            <span className="w-1 h-1 rounded-full bg-cream/40" />
            <span className="flex-1 h-px bg-cream/30" />
          </div>
          <p className="text-cream/60 font-sans text-sm mt-4 max-w-sm leading-relaxed">
            From our kitchen to our space — a glimpse into what makes EM special.
          </p>
        </div>
      </div>

      {/* ── The Space ────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-10">

        {/* Section header */}
        <FadeIn>
          <div className="flex items-center gap-5 mb-8">
            <div className="h-px flex-1 bg-charcoal/10" />
            <span className="text-[10px] tracking-widest uppercase font-sans text-charcoal/35 shrink-0">
              The Space
            </span>
            <div className="h-px flex-1 bg-charcoal/10" />
          </div>
        </FadeIn>

        {/* Row 1 — Large left + two stacked right */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
          <FadeIn className="md:col-span-2">
            <div className="relative aspect-[4/3] overflow-hidden group">
              <Image
                src="/gallery/5.webp"
                alt="The arch window — EM Patisserie interior"
                fill
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
                quality={85}
              />
            </div>
          </FadeIn>
          <div className="flex flex-row md:flex-col gap-2">
            <FadeIn className="flex-1">
              <div className="relative aspect-square overflow-hidden group">
                <Image
                  src="/gallery/14.webp"
                  alt="Outdoor terrace seating"
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  quality={85}
                />
              </div>
            </FadeIn>
            <FadeIn delay={0.08} className="flex-1">
              <div className="relative aspect-square overflow-hidden group">
                <Image
                  src="/gallery/15.webp"
                  alt="EM Patisserie exterior"
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  quality={85}
                />
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Row 2 — Three equal */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { src: "/gallery/10.webp", alt: "The warm glow of our dining room" },
            { src: "/gallery/12.webp", alt: "A quiet moment at EM" },
            { src: "/gallery/9.webp",  alt: "An evening at the terrace" },
          ].map((photo, i) => (
            <FadeIn key={photo.src} delay={i * 0.08}>
              <div className="relative aspect-square overflow-hidden group">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 768px) 33vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  quality={85}
                />
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Our Creations ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-10 pb-20">

        {/* Section header */}
        <FadeIn>
          <div className="flex items-center gap-5 mb-8">
            <div className="h-px flex-1 bg-charcoal/10" />
            <span className="text-[10px] tracking-widest uppercase font-sans text-charcoal/35 shrink-0">
              Our Creations
            </span>
            <div className="h-px flex-1 bg-charcoal/10" />
          </div>
        </FadeIn>

        {/* Featured — wide cinematic strip */}
        <FadeIn className="mb-2">
          <div className="relative aspect-[2/1] overflow-hidden group">
            <Image
              src="/gallery/13.webp"
              alt="EM celebration cakes — handcrafted with love"
              fill
              sizes="100vw"
              className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
              quality={90}
            />
          </div>
        </FadeIn>

        {/* Three portrait cakes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
          {[
            { src: "/gallery/4.webp",  alt: "White cream cake with gold accents", pos: "object-top" },
            { src: "/gallery/17.webp", alt: "Pink celebration cake",             pos: "object-bottom" },
            { src: "/gallery/6.webp",  alt: "Birthday cake with macarons",       pos: "object-top" },
          ].map((photo, i) => (
            <FadeIn key={photo.src} delay={i * 0.08}>
              <div className="relative aspect-[3/4] overflow-hidden group">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className={`object-cover ${photo.pos} group-hover:scale-105 transition-transform duration-700`}
                  quality={85}
                />
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Two stacked squares left + one large right */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
          <div className="flex flex-col gap-2">
            <FadeIn>
              <div className="relative aspect-square overflow-hidden group">
                <Image
                  src="/gallery/7.webp"
                  alt="Assorted patisserie on display"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  quality={85}
                />
              </div>
            </FadeIn>
            <FadeIn delay={0.1}>
              <div className="relative aspect-square overflow-hidden group">
                <Image
                  src="/gallery/8.webp"
                  alt="Pastries served on blush plates"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  quality={85}
                />
              </div>
            </FadeIn>
          </div>
          <FadeIn delay={0.05} className="md:col-span-2">
            <div className="relative aspect-[4/3] overflow-hidden group">
              <Image
                src="/gallery/16.webp"
                alt="Fresh fruit and cream cake"
                fill
                sizes="(max-width: 768px) 100vw, 66vw"
                className="object-cover object-[center_30%] group-hover:scale-105 transition-transform duration-700"
                quality={85}
              />
            </div>
          </FadeIn>
        </div>

        {/* Final three */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { src: "/gallery/18.webp", alt: "Blue and gold birthday cake",        pos: "object-top" },
            { src: "/gallery/3.webp",  alt: "Artisanal chocolate packaging",      pos: "object-center" },
            { src: "/gallery/11.webp", alt: "Focaccia sandwich with fresh salad", pos: "object-center" },
          ].map((photo, i) => (
            <FadeIn key={photo.src} delay={i * 0.08}>
              <div className="relative aspect-square overflow-hidden group">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className={`object-cover ${photo.pos} group-hover:scale-105 transition-transform duration-700`}
                  quality={85}
                />
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── CTA strip ────────────────────────────────────────────────────── */}
      <section className="relative py-28 px-6 overflow-hidden">
        <Image
          src="/gallery/4.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-top"
          quality={70}
          aria-hidden
        />
        <div className="absolute inset-0 bg-charcoal/75" />
        <FadeIn className="relative z-10 max-w-xl mx-auto text-center flex flex-col items-center gap-6">
          <p className="text-[10px] tracking-widest uppercase font-sans text-cream/40">
            Ready to celebrate?
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-cream leading-snug">
            Create something extraordinary
          </h2>
          <p className="text-cream/60 font-sans text-sm leading-relaxed">
            Every custom cake is made entirely by hand — tell us your vision and we&rsquo;ll bring it to life.
          </p>
          <Link
            href="/custom-order"
            className="px-10 py-4 bg-burgundy text-cream text-xs tracking-widest uppercase font-sans hover:bg-burgundy-dark transition-colors duration-200"
          >
            Order a Custom Cake
          </Link>
        </FadeIn>
      </section>

    </div>
  );
}
