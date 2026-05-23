import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import FadeIn from "@/components/FadeIn";
import EventSignupForm from "@/components/EventSignupForm";

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  image_url: string | null;
  capacity: number | null;
}

async function getEvent(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

export const revalidate = 60;

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) notFound();

  const formattedDate = new Date(event.event_date).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedTime = new Date(event.event_date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="pt-20 bg-cream min-h-screen">
      {/* Header */}
      <div className="bg-charcoal py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <p className="text-xs tracking-widest uppercase text-blush font-sans mb-4">
              {formattedDate}
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl text-cream leading-snug">
              {event.title}
            </h1>
            <p className="text-cream/60 font-sans text-base mt-3">{formattedTime}</p>
          </FadeIn>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-[1fr_360px] gap-12">
        {/* Description */}
        <FadeIn>
          <div className="flex flex-col gap-6">
            {event.description && (
              <div>
                <h2 className="font-serif text-2xl text-charcoal mb-4">About this event</h2>
                <p className="font-sans text-base text-charcoal/70 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            )}

            <div className="border-t border-cream-dark pt-6 flex flex-col gap-3">
              <div className="flex gap-4 items-start">
                <span className="text-xs tracking-widest uppercase font-sans text-charcoal/40 w-16 shrink-0 pt-0.5">Date</span>
                <span className="text-sm font-sans text-charcoal">{formattedDate}</span>
              </div>
              <div className="flex gap-4 items-start">
                <span className="text-xs tracking-widest uppercase font-sans text-charcoal/40 w-16 shrink-0 pt-0.5">Time</span>
                <span className="text-sm font-sans text-charcoal">{formattedTime}</span>
              </div>
              <div className="flex gap-4 items-start">
                <span className="text-xs tracking-widest uppercase font-sans text-charcoal/40 w-16 shrink-0 pt-0.5">Where</span>
                <span className="text-sm font-sans text-charcoal">EM Patisserie, Pune</span>
              </div>
              {event.capacity && (
                <div className="flex gap-4 items-start">
                  <span className="text-xs tracking-widest uppercase font-sans text-charcoal/40 w-16 shrink-0 pt-0.5">Spots</span>
                  <span className="text-sm font-sans text-charcoal">{event.capacity} available</span>
                </div>
              )}
            </div>
          </div>
        </FadeIn>

        {/* Sign-up form */}
        <FadeIn delay={0.1}>
          <EventSignupForm
            eventId={event.id}
            eventTitle={event.title}
            eventDate={event.event_date}
          />
        </FadeIn>
      </div>
    </div>
  );
}
