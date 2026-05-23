import Link from "next/link";
import { supabase } from "@/lib/supabase";
import FadeIn from "@/components/FadeIn";

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
        <FadeIn>
          <p className="text-xs tracking-widest uppercase text-gold font-sans mb-4">At EM</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-charcoal">Events</h1>
          <p className="text-charcoal/50 font-sans text-base mt-4 max-w-md mx-auto leading-relaxed">
            Workshops, tastings, and special evenings — join us for something memorable.
          </p>
        </FadeIn>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {events.length === 0 ? (
          <FadeIn className="text-center py-20">
            <p className="font-serif text-2xl text-charcoal/40">No upcoming events right now.</p>
            <p className="text-sm font-sans text-charcoal/30 mt-3">
              Check back soon — we&apos;re always planning something special.
            </p>
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
