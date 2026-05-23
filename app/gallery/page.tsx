import Image from "next/image";
import FadeIn from "@/components/FadeIn";

const photos = [
  { src: "/gallery/10.webp", alt: "EM Patisserie interior with warm lighting" },
  { src: "/gallery/14.webp", alt: "EM outdoor seating terracotta" },
  { src: "/gallery/5.webp", alt: "EM café interior arch window" },
  { src: "/gallery/12.webp", alt: "EM hot chocolate with gold signage" },
  { src: "/gallery/3.webp", alt: "Caramel Crunch artisanal chocolate packaging" },
  { src: "/gallery/13.webp", alt: "EM celebration cakes" },
  { src: "/gallery/4.webp", alt: "White cream cake with gold accents" },
  { src: "/gallery/7.webp", alt: "Assorted patisserie on display" },
  { src: "/gallery/8.webp", alt: "Pastries served on blush plates" },
  { src: "/gallery/16.webp", alt: "Fresh fruit and cream cake" },
  { src: "/gallery/17.webp", alt: "Pink celebration cake" },
  { src: "/gallery/6.webp", alt: "Birthday cake with macarons" },
  { src: "/gallery/18.webp", alt: "Blue and gold birthday cake" },
  { src: "/gallery/11.webp", alt: "Focaccia sandwich with salad" },
  { src: "/gallery/15.webp", alt: "EM Patisserie exterior signage" },
];

export default function GalleryPage() {
  return (
    <div className="pt-20 bg-cream min-h-screen">
      {/* Header */}
      <div className="bg-blush-light py-20 px-6 text-center">
        <FadeIn>
          <p className="text-xs tracking-widest uppercase text-gold font-sans mb-4">
            The World of EM
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl text-charcoal">Gallery</h1>
          <p className="text-charcoal/50 font-sans text-base mt-4 max-w-md mx-auto leading-relaxed">
            From our kitchen to our space — a glimpse into what makes EM special.
          </p>
        </FadeIn>
      </div>

      {/* Masonry-style grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {photos.map((photo, i) => (
            <FadeIn key={photo.src} delay={i * 0.04} className="break-inside-avoid">
              <div className="overflow-hidden group">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  width={600}
                  height={800}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </div>
  );
}
