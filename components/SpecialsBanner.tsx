"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Special {
  id: string;
  title: string;
  subtitle: string | null;
  link_text: string;
  link_url: string;
}

export default function SpecialsBanner() {
  const [special, setSpecial] = useState<Special | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetch("/api/specials")
      .then((r) => r.json())
      .then((data: Special | null) => {
        if (!data) return;
        // Check if this banner was already dismissed this session
        const dismissed = sessionStorage.getItem(`special_dismissed_${data.id}`);
        if (!dismissed) {
          setSpecial(data);
          // Small delay so it doesn't compete with the hero entrance animation
          setTimeout(() => setVisible(true), 1800);
        }
      })
      .catch(() => {});
  }, []);

  function dismiss() {
    if (special) sessionStorage.setItem(`special_dismissed_${special.id}`, "1");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && special && (
        <motion.div
          key={special.id}
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute bottom-0 inset-x-0 z-20 bg-charcoal/75 backdrop-blur-md border-t border-cream/10"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Animated gold diamond */}
              <motion.span
                className="text-gold shrink-0 text-base leading-none"
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              >
                ✦
              </motion.span>
              <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
                <span className="font-serif text-cream text-sm sm:text-base leading-snug">
                  {special.title}
                </span>
                {special.subtitle && (
                  <>
                    <span className="text-cream/30 hidden sm:inline">·</span>
                    <span className="text-cream/60 font-sans text-xs sm:text-sm hidden sm:inline truncate">
                      {special.subtitle}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <Link
                href={special.link_url}
                className="text-[11px] tracking-widest uppercase font-sans text-cream/70 hover:text-cream transition-colors border-b border-cream/30 hover:border-cream pb-px whitespace-nowrap"
              >
                {special.link_text} →
              </Link>
              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="text-cream/40 hover:text-cream transition-colors p-1"
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
