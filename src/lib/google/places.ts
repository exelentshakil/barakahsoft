// call_places_api atom — Places Text Search to resolve place_id, then Place
// Details for the full field set the spec requires (rating, review text,
// GBP photos, hours, business status). Two calls because Details needs a
// place_id, which we usually only have once we've searched by name+address.

export interface PlacesResult {
  place_id: string;
  name: string;
  formatted_address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  reviews: { author_name: string; rating: number; text: string; time: number }[];
  weekday_hours: string[] | null;
  business_status: string | null;
  photo_refs: string[];
  types: string[];
}

export async function callPlacesApi(name: string, addressHint?: string): Promise<PlacesResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("[places] GOOGLE_PLACES_API_KEY is not set");
    return null;
  }

  try {
    const query = encodeURIComponent(`${name} ${addressHint ?? ""}`.trim());
    const searchRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id&key=${apiKey}`
    );
    const searchData = await searchRes.json();
    const placeId = searchData.candidates?.[0]?.place_id;
    if (!placeId) {
      // Places returns 200 OK even on failure, with the real reason in
      // `status`/`error_message` — surface it, or a billing/API-not-enabled
      // failure looks identical to "no such business found" in the logs.
      console.error("[places] no candidate found", { status: searchData.status, error_message: searchData.error_message, query });
      return null;
    }

    const fields = [
      "name",
      "formatted_address",
      "geometry",
      "formatted_phone_number",
      "website",
      "rating",
      "user_ratings_total",
      "reviews",
      "opening_hours",
      "business_status",
      "photos",
      "types",
    ].join(",");
    const detailsRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`
    );
    const detailsData = await detailsRes.json();
    const result = detailsData.result;
    if (!result) {
      console.error("[places] no result from details call", { status: detailsData.status, error_message: detailsData.error_message, placeId });
      return null;
    }

    return {
      place_id: placeId,
      name: result.name,
      formatted_address: result.formatted_address ?? null,
      lat: result.geometry?.location?.lat ?? null,
      lng: result.geometry?.location?.lng ?? null,
      phone: result.formatted_phone_number ?? null,
      website: result.website ?? null,
      rating: result.rating ?? null,
      review_count: result.user_ratings_total ?? null,
      reviews: (result.reviews ?? []).map(
        (r: {
          author_name: string;
          rating: number;
          text: string;
          time: number;
          profile_photo_url?: string;
          relative_time_description?: string;
        }) => ({
          author_name: r.author_name,
          rating: r.rating,
          text: r.text,
          time: r.time,
          // Both were already in the response and both were dropped. A review
          // card with a face and a date reads as a real person; the same card
          // with an initial and no date reads as filler we wrote ourselves.
          profile_photo_url: r.profile_photo_url ?? null,
          relative_time_description: r.relative_time_description ?? null,
        })
      ),
      weekday_hours: result.opening_hours?.weekday_text ?? null,
      business_status: result.business_status ?? null,
      photo_refs: (result.photos ?? []).map((p: { photo_reference: string }) => p.photo_reference),
      types: result.types ?? [],
    };
  } catch (err) {
    console.error("[places] call failed", err);
    return null;
  }
}

// fetch_gbp_photos atom — resolves photo_refs from callPlacesApi into real
// image URLs the photo-waterfall can download and copy into Storage.
export function resolvePlacesPhotoUrl(photoRef: string, maxWidth = 1600): string | null {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoRef}&key=${apiKey}`;
}

export interface CompetitorCandidate {
  place_id: string;
  name: string;
  rating: number | null;
  review_count: number | null;
  website: string | null;
}

// Powers ResearchCompetitors (src/lib/research-competitors.ts) and the
// Phase 8 Competitors tab — real local businesses in the same niche, found
// via Text Search rather than a paid third-party search API, since Places
// is already a configured, working credential. `near` bias (lat/lng +
// radius) matters more than the query text for sparse rural niches — a
// literal "near {town}" string search comes up empty the moment the
// nearest same-category business is one town over, which real rural
// businesses often are (case 0: Kilrea has zero other karting venues
// within the town itself). A geo radius finds the real nearest ones
// instead of depending on Google's free-text place-name parsing.
export async function searchNearbyCompetitors(
  query: string,
  excludePlaceId?: string,
  limit = 8,
  near?: { lat: number; lng: number; radiusMeters?: number }
): Promise<CompetitorCandidate[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.error("[places] GOOGLE_PLACES_API_KEY is not set");
    return [];
  }

  const locationBias = near ? `&location=${near.lat},${near.lng}&radius=${near.radiusMeters ?? 50000}` : "";

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}${locationBias}&key=${apiKey}`
    );
    const data = await res.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("[places] nearby competitor search failed", { status: data.status, error_message: data.error_message, query });
      return [];
    }

    const results = (data.results ?? []) as { place_id: string; name: string; rating?: number; user_ratings_total?: number }[];
    return results
      .filter((r) => r.place_id !== excludePlaceId)
      .slice(0, limit)
      .map((r) => ({ place_id: r.place_id, name: r.name, rating: r.rating ?? null, review_count: r.user_ratings_total ?? null, website: null }));
  } catch (err) {
    console.error("[places] nearby competitor search call failed", err);
    return [];
  }
}

// One Details call per candidate just for the website field — kept
// separate from the main callPlacesApi Details call (which needs the
// heavier field set) to keep this cheap when only a URL is needed.
export async function resolveCompetitorWebsite(placeId: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=website&key=${apiKey}`);
    const data = await res.json();
    return data.result?.website ?? null;
  } catch (err) {
    console.error("[places] resolveCompetitorWebsite failed", err);
    return null;
  }
}
