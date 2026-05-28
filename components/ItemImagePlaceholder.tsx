/**
 * Elegant placeholder shown in product cards when no image is available.
 * Replaces the "EM" beige block with a refined patterned tile.
 */

const CATEGORY_ICONS: Record<string, string> = {
  desserts:  "🍰",
  cakes:     "🎂",
  chocolates:"🍫",
  drinks:    "☕",
  breads:    "🥐",
  savouries: "🥐",
};

interface Props {
  category?: string;
  className?: string;
}

export default function ItemImagePlaceholder({ category = "", className = "" }: Props) {
  const icon = CATEGORY_ICONS[category.toLowerCase()] ?? "✦";

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center gap-3 bg-[#f5ede6] select-none ${className}`}
      aria-hidden="true"
    >
      {/* Faint crosshatch tile pattern */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="hatch" width="16" height="16" patternUnits="userSpaceOnUse">
            <path d="M0 16 L16 0" stroke="#6a162b" strokeWidth="0.8" fill="none" />
            <path d="M-4 4 L4 -4"  stroke="#6a162b" strokeWidth="0.8" fill="none" />
            <path d="M12 20 L20 12" stroke="#6a162b" strokeWidth="0.8" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hatch)" />
      </svg>

      {/* Centred icon + wordmark */}
      <span className="relative text-3xl leading-none opacity-70">{icon}</span>
      <span className="relative font-serif text-sm tracking-widest text-burgundy/30 uppercase">
        EM
      </span>
    </div>
  );
}
