import { createHash } from "node:crypto";

// fire_meta_capi_event atom — server half of the Pixel+CAPI pair (PRD §7),
// matched to the client's trackPixelEvent() call by eventId so Meta
// dedupes them. Called from /api/intake right after the leads insert.
function hashSha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function fireMetaCapiEvent(input: {
  eventName: string;
  eventId: string;
  email?: string;
  phone?: string;
  clickId?: string;
  sourceUrl: string;
}) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_TOKEN;
  if (!pixelId || !accessToken) {
    console.log("[meta-pixel] (stub) would fire CAPI event", input.eventName, input.eventId);
    return;
  }

  try {
    await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          {
            event_name: input.eventName,
            event_id: input.eventId,
            event_time: Math.floor(Date.now() / 1000),
            action_source: "website",
            event_source_url: input.sourceUrl,
            user_data: {
              em: input.email ? [hashSha256(input.email.toLowerCase().trim())] : undefined,
              ph: input.phone ? [hashSha256(input.phone.replace(/\D/g, ""))] : undefined,
              fbc: input.clickId,
            },
          },
        ],
      }),
    });
  } catch (err) {
    console.error("[meta-pixel] CAPI call failed", err);
  }
}
