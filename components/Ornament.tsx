interface OrnamentProps {
  className?: string;
  light?: boolean; // white/cream variant for dark backgrounds
}

/** Decorative gold dot-and-rule divider used between page sections */
export default function Ornament({ className = "", light = false }: OrnamentProps) {
  const lineColor = light ? "bg-cream/25" : "bg-charcoal/12";
  const dotColor  = light ? "text-cream/50" : "text-gold";

  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <span className={`flex-1 max-w-[80px] h-px ${lineColor}`} />
      <span className={`text-xs leading-none ${dotColor}`}>✦</span>
      <span className={`flex-1 max-w-[80px] h-px ${lineColor}`} />
    </div>
  );
}
