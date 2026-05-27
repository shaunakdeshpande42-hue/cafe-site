import { NextResponse } from "next/server";

export const revalidate = 86400; // re-fetch from Google once every 24 hours

export interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  profile_photo_url: string;
}

export async function GET() {
  const apiKey  = process.env.GOOGLE_MAPS_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) {
    return NextResponse.json({ error: "Google Maps not configured." }, { status: 503 });
  }

  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${placeId}` +
      `&fields=reviews,rating,user_ratings_total` +
      `&language=en` +
      `&key=${apiKey}`;

    const res = await fetch(url, {
      next: { revalidate: 86400 },
    });

    const data = await res.json();

    if (data.status !== "OK") {
      throw new Error(data.error_message ?? data.status);
    }

    // Only return reviews that have text and are 4★ or above
    const reviews: GoogleReview[] = (data.result.reviews ?? [])
      .filter((r: GoogleReview) => r.text && r.rating >= 4)
      .slice(0, 5);

    return NextResponse.json({
      reviews,
      rating: data.result.rating,
      total: data.result.user_ratings_total,
    });
  } catch (err) {
    console.error("Google reviews fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch reviews." }, { status: 500 });
  }
}
