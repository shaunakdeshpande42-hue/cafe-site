"use client";

import Image from "next/image";
import { useRef } from "react";
import FadeIn from "@/components/FadeIn";

const POSTS = [
  "/gallery/3.webp",
  "/gallery/4.webp",
  "/gallery/5.webp",
  "/gallery/6.webp",
  "/gallery/7.webp",
  "/gallery/8.webp",
  "/gallery/9.webp",
  "/gallery/10.webp",
  "/gallery/11.webp",
  "/gallery/12.webp",
];

const INSTAGRAM_URL = "https://www.instagram.com/empatisserie_/";

export default function InstagramSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "right" ? amount : -amount, behavior: "smooth" });
  }

  return (
    <section className="py-20 bg-cream overflow-hidden">
      {/* Header */}
      <FadeIn>
        <div className="text-center mb-10 px-6">
          <p className="text-xs tracking-widest uppercase text-gold font-sans mb-3">
            Stay in the loop
          </p>
          <h2 className="font-serif text-4xl text-charcoal mb-3">
            Instagram
          </h2>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-sans text-charcoal/50 hover:text-burgundy transition-colors duration-200"
          >
            {/* Instagram icon */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" strokeWidth={0} />
            </svg>
            @empatisserie_
          </a>
        </div>
      </FadeIn>

      {/* Carousel */}
      <div className="relative group">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-charcoal hover:text-burgundy transition-colors opacity-0 group-hover:opacity-100 duration-200"
          aria-label="Scroll left"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-charcoal hover:text-burgundy transition-colors opacity-0 group-hover:opacity-100 duration-200"
          aria-label="Scroll right"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Scroll track */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scroll-smooth px-6 pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {POSTS.map((src, i) => (
            <a
              key={src}
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="relative shrink-0 w-64 h-64 sm:w-72 sm:h-72 overflow-hidden bg-cream-dark group/photo"
            >
              <Image
                src={src}
                alt={`EM Patisserie Instagram post ${i + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover/photo:scale-105"
                sizes="(max-width: 640px) 256px, 288px"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-charcoal/0 group-hover/photo:bg-charcoal/30 transition-colors duration-300 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth={1.5}
                  className="w-8 h-8 opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.5" fill="white" strokeWidth={0} />
                </svg>
              </div>
            </a>
          ))}

          {/* Final CTA tile */}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="relative shrink-0 w-64 h-64 sm:w-72 sm:h-72 bg-burgundy flex flex-col items-center justify-center gap-4 hover:bg-burgundy-dark transition-colors duration-200"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-10 h-10">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="white" strokeWidth={0} />
            </svg>
            <div className="text-center px-6">
              <p className="font-serif text-xl text-cream leading-snug">Follow us</p>
              <p className="text-cream/70 font-sans text-xs tracking-widest uppercase mt-1">@empatisserie_</p>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
