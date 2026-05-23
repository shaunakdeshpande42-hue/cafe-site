"use client";

import { useState } from "react";
import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import { categories, menuItems } from "@/lib/menu-data";
import { useCartStore } from "@/lib/cart-store";

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState("patisserie");
  const { addItem } = useCartStore();

  const filtered = menuItems.filter((item) => item.category === activeCategory);

  return (
    <div className="pt-20 bg-cream min-h-screen">
      {/* Header */}
      <div className="bg-charcoal py-20 px-6 text-center">
        <FadeIn>
          <p className="text-xs tracking-widest uppercase text-blush font-sans mb-4">Crafted Daily</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-cream">Our Menu</h1>
          <p className="text-cream/60 font-sans text-base mt-4 max-w-md mx-auto leading-relaxed">
            Everything is made fresh in our kitchen. Availability may vary — ask us what&apos;s on today.
          </p>
        </FadeIn>
      </div>

      {/* Category tabs */}
      <div className="sticky top-20 z-30 bg-cream border-b border-cream-dark">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-6 py-5 text-xs tracking-widest uppercase font-sans transition-colors duration-200 border-b-2 whitespace-nowrap ${
                  activeCategory === cat.id
                    ? "border-burgundy text-burgundy"
                    : "border-transparent text-charcoal/50 hover:text-charcoal"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items grid */}
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((item, i) => (
            <FadeIn key={item.id} delay={i * 0.06}>
              <div className="group flex flex-col gap-0 border border-cream-dark bg-white hover:shadow-sm transition-shadow duration-300">
                <div className="aspect-[4/3] bg-cream-dark overflow-hidden relative">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-blush-light">
                      <span className="font-serif text-5xl text-burgundy/15">EM</span>
                    </div>
                  )}
                  {item.badge && (
                    <span className="absolute top-3 left-3 bg-burgundy text-cream text-[10px] tracking-widest uppercase font-sans px-2.5 py-1">
                      {item.badge}
                    </span>
                  )}
                </div>

                <div className="px-5 py-5 flex flex-col gap-2 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-serif text-lg text-charcoal leading-snug">{item.name}</h3>
                    <span className="text-base font-sans font-medium text-burgundy shrink-0">₹{item.price}</span>
                  </div>
                  <p className="text-sm text-charcoal/55 font-sans leading-relaxed flex-1">{item.description}</p>
                  <button
                    onClick={() => addItem({ id: item.id, name: item.name, price: item.price })}
                    className="mt-3 w-full py-2.5 bg-burgundy text-cream text-xs tracking-widest uppercase font-sans text-center hover:bg-burgundy-dark transition-colors duration-200 active:scale-[0.98]"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>

      <div className="bg-cream-dark py-10 px-6 text-center">
        <p className="text-xs text-charcoal/40 font-sans max-w-lg mx-auto leading-relaxed">
          All prices are inclusive of taxes. Custom cake orders require 48-hour advance notice.
          Please inform us of any dietary requirements or allergens when ordering.
        </p>
      </div>
    </div>
  );
}
