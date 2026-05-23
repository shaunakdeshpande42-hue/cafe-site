"use client";

import { useCartStore } from "@/lib/cart-store";
import Link from "next/link";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, total } = useCartStore();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal/40 z-40"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-cream z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-cream-dark">
          <h2 className="font-serif text-xl text-charcoal">Your Order</h2>
          <button onClick={closeCart} className="text-charcoal/50 hover:text-charcoal transition-colors p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <span className="font-serif text-4xl text-burgundy/20">EM</span>
              <p className="text-charcoal/40 font-sans text-sm">Your cart is empty</p>
              <button
                onClick={closeCart}
                className="mt-2 text-sm text-burgundy underline underline-offset-2 font-sans"
              >
                Browse the menu
              </button>
            </div>
          ) : (
            <ul className="flex flex-col divide-y divide-cream-dark">
              {items.map((item) => (
                <li key={item.id} className="py-4 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-serif text-base text-charcoal leading-snug">{item.name}</p>
                    <p className="text-sm text-burgundy font-sans mt-0.5">₹{item.price}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 border border-cream-dark flex items-center justify-center text-charcoal hover:bg-cream-dark transition-colors font-sans"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-sans text-charcoal">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 border border-cream-dark flex items-center justify-center text-charcoal hover:bg-cream-dark transition-colors font-sans"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-charcoal/30 hover:text-charcoal transition-colors shrink-0 mt-0.5"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-cream-dark px-6 py-5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <span className="font-sans text-sm text-charcoal/60 uppercase tracking-widest">Total</span>
              <span className="font-serif text-xl text-charcoal">₹{total()}</span>
            </div>
            <Link
              href="/order"
              onClick={closeCart}
              className="w-full py-3.5 bg-burgundy text-cream text-sm tracking-widest uppercase font-sans text-center hover:bg-burgundy-dark transition-colors duration-200"
            >
              Proceed to Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
