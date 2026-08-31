import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import type { Lead, ScrapeResults } from "@/types/database";

/**
 * Correcting a Google Business Profile match by hand.
 *
 * The scrape resolves this automatically and now refuses anything it cannot
 * verify, but two cases still need an operator: a listing that carries no
 * website and a phone that does not match the site, which the verifier will
 * rightly reject; and a match that verified but is still not the business —
 * two branches of one company, say.
 *
 * Getting this wrong is expensive. A mismatched profile put a Florida
 * company's rating, review count, town and five of its customers'
 * testimonials onto a Wyoming roofer's homepage, so this route writes the
 * whole set from one place id rather than letting the pieces drift apart.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { place_id?: string } | null;
  const placeId = body?.place_id?.trim();
  if (!placeId) return NextResponse.json({ error: "A Google place id is required" }, { status: 400 });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY is not set" }, { status: 500 });

  const admin = createAdminClient();
  const [{ data: lead }, { data: scrape }] = await Promise.all([
    admin.from("leads").select("*").eq("id", leadId).single<Lead>(),
    admin.from("scrape_results").select("*").eq("lead_id", leadId).maybeSingle<ScrapeResults>(),
  ]);
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!scrape) return NextResponse.json({ error: "Scrape this lead before setting its profile" }, { status: 409 });

  const fields = [
    "name", "formatted_address", "geometry", "formatted_phone_number", "website",
    "rating", "user_ratings_total", "reviews", "opening_hours", "business_status", "photos", "types",
  ].join(",");

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${apiKey}`
  );
  const data = await res.json();
  const place = data.result;
  if (!place) {
    return NextResponse.json({ error: data.error_message || `Google returned ${data.status} for that place id` }, { status: 400 });
  }

  const facts = { ...((scrape.facts ?? {}) as Record<string, unknown>) };
  const nap = { ...((facts.nap as Record<string, unknown>) ?? {}) };

  facts.rating = place.rating ?? null;
  facts.review_count = place.user_ratings_total ?? null;
  facts.reviews = (place.reviews ?? []).map((r: { author_name: string; rating: number; text: string; time: number }) => ({
    author_name: r.author_name, rating: r.rating, text: r.text, time: r.time,
  }));
  facts.hours = place.opening_hours?.weekday_text ?? facts.hours ?? null;
  facts.business_status = place.business_status ?? null;
  facts.place_id = placeId;
  // Third from last comma-separated part of a US formatted address is the town.
  facts.town = place.formatted_address?.split(",").slice(-3, -2)[0]?.trim() ?? facts.town ?? null;
  nap.address = place.formatted_address ?? null;
  facts.nap = nap;

  const { error: factsError } = await admin
    .from("scrape_results")
    .update({ facts, places_raw: { ...place, place_id: placeId, review_count: place.user_ratings_total ?? null } })
    .eq("lead_id", leadId);
  if (factsError) return NextResponse.json({ error: factsError.message }, { status: 500 });

  await admin.from("leads").update({ place_id: placeId }).eq("id", leadId);

  return NextResponse.json({
    ok: true,
    place: {
      name: place.name,
      website: place.website ?? null,
      address: place.formatted_address ?? null,
      phone: place.formatted_phone_number ?? null,
      rating: place.rating ?? null,
      reviewCount: place.user_ratings_total ?? null,
      reviewsPulled: (place.reviews ?? []).length,
    },
  });
}
