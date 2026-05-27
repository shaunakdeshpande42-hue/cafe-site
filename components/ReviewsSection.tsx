"use client";

import { useEffect, useState } from "react";
import FadeIn from "@/components/FadeIn";
import type { GoogleReview } from "@/app/api/reviews/route";

function StarRating({ count, size = "sm" }: { count: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-7 h-7" : "w-4 h-4";
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`${cls} ${i < count ? "text-gold" : "text-charcoal/15"}`}
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function truncate(text: string, max = 220) {
  if (text.length <= max) return text;
  return text.slice(0, text.lastIndexOf(" ", max)) + "…";
}

export default function ReviewsSection() {
  const [reviews, setReviews]   = useState<GoogleReview[]>([]);
  const [rating, setRating]     = useState<number | null>(null);
  const [total, setTotal]       = useState<number | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => {
        if (data.reviews) {
          setReviews(data.reviews);
          setRating(data.rating);
          setTotal(data.total);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-24 px-6 bg-blush-light">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <div className="text-center mb-14">
            <p className="text-xs tracking-widest uppercase text-gold font-sans mb-3">
              What our guests say
            </p>
            <h2 className="font-serif text-4xl text-charcoal">Reviews</h2>

            {rating && total && (
              <div className="flex flex-col items-center gap-2 mt-6">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-5xl text-charcoal leading-none">{rating}</span>
                  <span className="font-serif text-4xl text-charcoal/30 leading-none">/ 5</span>
                </div>
                <StarRating count={Math.round(rating)} size="lg" />
                <p className="text-sm font-sans text-charcoal/50 mt-1">
                  Based on {total} reviews on Google
                </p>
              </div>
            )}
          </div>
        </FadeIn>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white p-8 animate-pulse">
                <div className="h-4 bg-cream-dark rounded w-24 mb-4" />
                <div className="h-3 bg-cream-dark rounded w-full mb-2" />
                <div className="h-3 bg-cream-dark rounded w-5/6 mb-2" />
                <div className="h-3 bg-cream-dark rounded w-4/6" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((review, i) => (
              <FadeIn key={review.author_name + i} delay={i * 0.1}>
                <div className="bg-white p-8 flex flex-col gap-4 h-full">
                  <StarRating count={review.rating} />
                  <p className="font-sans text-sm text-charcoal/80 leading-relaxed flex-1">
                    &ldquo;{truncate(review.text)}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-2 border-t border-cream-dark">
                    {review.profile_photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.profile_photo_url}
                        alt={review.author_name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-serif text-sm text-charcoal">{review.author_name}</p>
                      <p className="text-[10px] font-sans text-charcoal/40 uppercase tracking-wider">
                        {review.relative_time_description} · Google
                      </p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        )}

        {/* Google attribution — required by Google's ToS */}
        <p className="text-center text-[11px] font-sans text-charcoal/30 mt-10 tracking-wide">
          Reviews from Google Maps · Powered by Google
        </p>
      </div>
    </section>
  );
}
