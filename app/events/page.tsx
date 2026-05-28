import type { Metadata } from "next";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import FadeIn from "@/components/FadeIn";
import Ornament from "@/components/Ornament";

export const metadata: Metadata = {
  title: "Events & Workshops",
  description:
    "Join us for workshops, chocolate tastings, and special evenings at EM Patisserie in Kalyani Nagar, Pune. Check upcoming events and sign up.",
  openGraph: {
    title: "Events & Workshops | EM Patisserie",
    description:
      "Workshops, tastings, and special evenings — join us for something memorable at EM Patisserie, Pune.",
  },
  alternates: { canonical: "/events" },
};

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  image_url: string | null;
  capacity: number | null;
}

async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true });

  if (error) return [];
  return data ?? [];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export const revalidate = 60; // revalidate every minute

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="pt-20 bg-cream min-h-screen">
      {/* Header */}
      <div className="bg-blush-light py-20 px-6 text-center">
        <FadeIn className="flex flex-col items-center gap-4">
          <p className="text-xs tracking-widest uppercase text-gold font-sans">At EM</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-charcoal">Events</h1>
          <Ornament className="mx-auto" />
          <p className="text-charcoal/50 font-sans text-base max-w-md mx-auto leading-relaxed">
            Workshops, tastings, and special evenings — join us for something memorable.
          </p>
        </FadeIn>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {events.length === 0 ? (
          <FadeIn className="flex flex-col items-center text-center py-24 gap-6">
            <div className="w-16 h-16 rounded-full bg-blush-light flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-burgundy/60">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <div>
              <p className="font-serif text-2xl text-charcoal/60">Nothing on the calendar just yet</p>
              <p className="text-sm font-sans text-charcoal/35 mt-2 max-w-xs mx-auto leading-relaxed">
                We&apos;re always planning workshops, tastings, and special evenings — check back soon or follow us on Instagram to be the first to know.
              </p>
            </div>
            <Link
              href="https://www.instagram.com/empatisserie"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 border border-burgundy text-burgundy text-xs tracking-widest uppercase font-sans hover:bg-burgundy hover:text-cream transition-colors duration-200"
            >
              Follow on Instagram
            </Link>
          </FadeIn>
        ) : (
          <div className="flex flex-col gap-6">
            {events.map((event, i) => (
              <FadeIn key={event.id} delay={i * 0.08}>
                <Link href={`/events/${event.id}`} className="group block">
                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] border border-cream-dark bg-white hover:shadow-sm transition-shadow duration-300">
                    {/* Date block */}
                    <div className="bg-burgundy flex flex-col items-center justify-center py-10 px-6 text-center">
                      <p className="text-cream/60 font-sans text-xs tracking-widest uppercase mb-1">
                        {new Date(event.event_date).toLocaleDateString("en-IN", { month: "short" })}
                      </p>
                      <p className="font-serif text-5xl text-cream leading-none">
                        {new Date(event.event_date).getDate()}
                      </p>
                      <p className="text-cream/70 font-sans text-sm mt-2">
                        {formatTime(event.event_date)}
                      </p>
                    </div>

                    {/* Details */}
                    <div className="p-8 flex flex-col justify-between gap-4">
                      <div>
                        <p className="text-xs tracking-widest uppercase text-gold font-sans mb-2">
                          {formatDate(event.event_date)}
                        </p>
                        <h2 className="font-serif text-2xl text-charcoal group-hover:text-burgundy transition-colors duration-200">
                          {event.title}
                        </h2>
                        {event.description && (
                          <p className="text-sm font-sans text-charcoal/55 mt-3 leading-relaxed line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        {event.capacity && (
                          <p className="text-xs font-sans text-charcoal/40 tracking-wider uppercase">
                            {event.capacity} spots available
                          </p>
                        )}
                        <span className="text-xs tracking-widest uppercase font-sans text-burgundy group-hover:underline underline-offset-2">
                          View & Sign Up →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
