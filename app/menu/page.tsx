"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import FadeIn from "@/components/FadeIn";
import { categories } from "@/lib/menu-data";
import { useCartStore } from "@/lib/cart-store";
import { useInventoryStore } from "@/lib/inventory-store";
import type { InventoryEntry } from "@/app/api/inventory/route";

type UnavailableMap = Record<string, { note: string | null }>;

interface DbMenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  badge: string | null;
  note: string | null;
  is_active: boolean;
  sort_order: number;
}

const LOW_STOCK_THRESHOLD = 5;

export default function MenuPage() {
  const [activeCategory, setActiveCategory]   = useState("desserts");
  const [menuItems, setMenuItems]             = useState<DbMenuItem[]>([]);
  const [menuLoading, setMenuLoading]         = useState(true);
  const [unavailable, setUnavailable]         = useState<UnavailableMap>({});
  const { addItem, items: cartItems }         = useCartStore();
  const { setEntries, getRemaining, isSoldOut } = useInventoryStore();

  useEffect(() => {
    // Fetch menu items from DB
    fetch("/api/menu")
      .then((r) => r.json())
      .then((data: DbMenuItem[]) => setMenuItems(data))
      .catch(() => {})
      .finally(() => setMenuLoading(false));

    // Availability (staff-marked unavailable items)
    fetch("/api/availability")
      .then((r) => r.json())
      .then((data) => {
        const map: UnavailableMap = {};
        for (const entry of data.unavailable ?? []) {
          map[entry.item_id] = { note: entry.note };
        }
        setUnavailable(map);
      })
      .catch(() => {});

    // Daily inventory stock levels
    fetch("/api/inventory")
      .then((r) => r.json())
      .then((data: { items: InventoryEntry[] }) => {
        setEntries(data.items ?? []);
      })
      .catch(() => {});
  }, [setEntries]);

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
        {menuLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-cream-dark animate-pulse">
                <div className="aspect-[4/3] bg-cream-dark" />
                <div className="p-5 flex flex-col gap-3">
                  <div className="h-4 bg-cream-dark rounded w-3/4" />
                  <div className="h-3 bg-cream-dark rounded w-full" />
                  <div className="h-3 bg-cream-dark rounded w-2/3" />
                  <div className="h-9 bg-cream-dark rounded mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-charcoal/40 font-sans text-sm py-16">
            No items in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((item, i) => {
              const isUnavailable = item.id in unavailable;
              const staffNote     = unavailable[item.id]?.note;
              const soldOut       = !isUnavailable && isSoldOut(item.id);
              const remaining     = getRemaining(item.id); // null = no limit
              const isLowStock    =
                !isUnavailable &&
                !soldOut &&
                remaining !== null &&
                remaining > 0 &&
                remaining <= LOW_STOCK_THRESHOLD;

              const cartQty  = cartItems.find((ci) => ci.id === item.id)?.quantity ?? 0;
              const canAdd   =
                !isUnavailable &&
                !soldOut &&
                (remaining === null || cartQty < remaining);
              const isDisabled = isUnavailable || soldOut || !canAdd;

              return (
                <FadeIn key={item.id} delay={i * 0.06}>
                  <div
                    className={`group flex flex-col gap-0 border border-cream-dark bg-white hover:shadow-sm transition-shadow duration-300 ${
                      isUnavailable || soldOut ? "opacity-60" : ""
                    }`}
                  >
                    <div className="aspect-[4/3] bg-cream-dark overflow-hidden relative">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className={`object-cover transition-transform duration-500 ${
                            isUnavailable || soldOut ? "grayscale" : "group-hover:scale-105"
                          }`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blush-light">
                          <span className="font-serif text-5xl text-burgundy/15">EM</span>
                        </div>
                      )}

                      {isUnavailable ? (
                        <span className="absolute top-3 left-3 bg-charcoal text-cream text-[10px] tracking-widest uppercase font-sans px-2.5 py-1">
                          Unavailable Today
                        </span>
                      ) : soldOut ? (
                        <span className="absolute top-3 left-3 bg-charcoal text-cream text-[10px] tracking-widest uppercase font-sans px-2.5 py-1">
                          Sold Out
                        </span>
                      ) : isLowStock ? (
                        <span className="absolute top-3 left-3 bg-amber-600 text-white text-[10px] tracking-widest uppercase font-sans px-2.5 py-1">
                          Only {remaining} left
                        </span>
                      ) : item.badge ? (
                        <span className="absolute top-3 left-3 bg-burgundy text-cream text-[10px] tracking-widest uppercase font-sans px-2.5 py-1">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>

                    <div className="px-5 py-5 flex flex-col gap-2 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-serif text-lg text-charcoal leading-snug">{item.name}</h3>
                        <span className="text-base font-sans font-medium text-burgundy shrink-0">
                          ₹{item.price}
                        </span>
                      </div>
                      <p className="text-sm text-charcoal/55 font-sans leading-relaxed flex-1">
                        {item.description}
                      </p>
                      {item.note && (
                        <p className="text-[11px] font-sans text-charcoal/40 italic">{item.note}</p>
                      )}
                      {staffNote && (
                        <p className="text-[11px] font-sans text-amber-700 italic">{staffNote}</p>
                      )}
                      {!isDisabled && remaining !== null && cartQty > 0 && (
                        <p className="text-[11px] font-sans text-charcoal/40">
                          {cartQty} in cart · {remaining - cartQty} more available
                        </p>
                      )}

                      <button
                        disabled={isDisabled}
                        onClick={() => {
                          if (!isDisabled)
                            addItem({ id: item.id, name: item.name, price: item.price });
                        }}
                        className={`mt-3 w-full py-2.5 text-xs tracking-widest uppercase font-sans text-center transition-colors duration-200 ${
                          isUnavailable || soldOut
                            ? "bg-charcoal/10 text-charcoal/30 cursor-not-allowed"
                            : !canAdd
                            ? "bg-amber-50 text-amber-700 border border-amber-200 cursor-not-allowed"
                            : "bg-burgundy text-cream hover:bg-burgundy-dark active:scale-[0.98]"
                        }`}
                      >
                        {isUnavailable
                          ? "Not Available"
                          : soldOut
                          ? "Sold Out"
                          : !canAdd
                          ? `Max ${remaining} reached`
                          : "Add to Cart"}
                      </button>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-cream-dark py-10 px-6 text-center">
        <p className="text-xs text-charcoal/40 font-sans max-w-lg mx-auto leading-relaxed">
          A 7% service charge is levied on the bill for dine-in. Custom cake orders require 48-hour advance notice.
          VE = Vegan · GF = Gluten Free · RSF = Refined Sugar Free.
          Please inform us of any dietary requirements or allergens when ordering.
        </p>
      </div>
    </div>
  );
}
