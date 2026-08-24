import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/is-admin-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { callGemini, bestGeminiChain } from "@/lib/gemini-client";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { SocialContentSchema } from "@/lib/social-content";
import type { Artifact, Lead, ScrapeResults } from "@/types/database";

export const maxDuration = 180;

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Gemini is not configured" }, { status: 422 });

  const admin = createAdminClient();
  const [{ data: lead }, { data: artifact }, { data: scrape }] = await Promise.all([
    admin.from("leads").select("*").eq("id", leadId).single<Lead>(),
    admin.from("artifacts").select("*").eq("lead_id", leadId).single<Artifact>(),
    admin.from("scrape_results").select("*").eq("lead_id", leadId).single<ScrapeResults>(),
  ]);
  if (!lead || !artifact || !scrape) return NextResponse.json({ error: "Lead data is incomplete" }, { status: 404 });

  const facts = (scrape.facts ?? {}) as Record<string, unknown>;
  const businessName = lead.business_name || (facts.business_name as string) || lead.slug;
  const city = (facts.town as string) || (facts.city as string) || null;
  const industry = lead.industry || (facts.industry as string) || null;
  const services = Array.isArray(facts.derived_services) ? facts.derived_services.slice(0, 10) : [];
  const rating = typeof facts.rating === "number" ? facts.rating : null;
  const reviewCount = typeof facts.review_count === "number" ? facts.review_count : null;
  const reviews = Array.isArray(facts.reviews)
    ? facts.reviews.slice(0, 4).map((review) => {
        const item = review as Record<string, unknown>;
        return { author: item.author_name || item.author, text: String(item.text || "").slice(0, 260) };
      })
    : [];
  const isLive = lead.status === "live" || Boolean(lead.live_at);
  const stage = isLive ? "live website" : "private redesign concept";
  const extracted = (artifact.extracted_assets ?? {}) as Record<string, unknown>;
  const brandColor = (facts.brand_color_hex as string) ||
    ((extracted.branding as Record<string, unknown> | undefined)?.colors as Record<string, unknown> | undefined)?.primary ||
    "#1D4ED8";

  const ledger = {
    businessName,
    city,
    industry,
    services,
    rating,
    reviewCount,
    reviews,
    stage,
    brandColor,
    hasHeroCapture: Boolean((extracted.mockup as Record<string, unknown> | undefined)?.heroCaptureUrl),
    hasAboutCapture: Boolean((extracted.mockup as Record<string, unknown> | undefined)?.aboutCaptureUrl),
  };

  const prompt = `Create a premium social launch content kit for BarakahSoft using ONLY this fact ledger:
${JSON.stringify(ledger, null, 2)}

The audience is owners of local service businesses. The featured business is the subject of the design concept, not necessarily a paying client. Respect the exact stage: say "concept", "proposal" or "preview" unless the ledger says live website.

CAPTION STANDARD
- Write five genuinely different strategic angles, not the same caption with a new opening.
- Lead with a sharp observation or specific design decision, then show the work, then invite a relevant response.
- No emojis, fake scarcity, engagement bait, generic hype, made-up percentages, ad costs, speed claims, rankings, warranties, guarantees, pricing, credentials or outcomes.
- Never call all reviews five-star. If rating/count are present, state the exact aggregate only.
- Do not claim a redesign increased leads because no result has been measured.
- Sound like an experienced creative director, not a growth-hacking template.
- Use short paragraphs and at most four relevant hashtags. No bullet list unless the angle genuinely benefits from one.
- "authority" means thoughtful design authority, not pretending the concept is launched.
- "contrarian" should challenge a weak design convention without insulting the business.

MOTION KIT
- Create one eight-second 9:16 social reel concept that introduces the premium 3D product-film treatment; the exact Hero and About captures are specified as deterministic editor overlays so their typography stays readable.
- Voiceover must be natural, factual, around 15–20 words, and pronounce the business name clearly.
- The editor brief must give timed shots, camera movement, deterministic readable overlays, transitions, sound design and a final CTA.
- The Veo prompt must request native synchronized voiceover and subtle sound design, but no generated readable UI text; exact website screens are composited by the editor.
- Moodboard and motion direction are one coherent system based on the supplied brand colour.

Return JSON only in exactly this shape:
{
  "captions": {
    "redesign_proposed": "...", "concept_teaser": "...", "transformation": "...", "authority": "...", "contrarian": "..."
  },
  "motion": {
    "title": "...", "creativeDirection": "...", "voiceover": "...", "editorBrief": "...", "veoPrompt": "..."
  },
  "moodboard": {
    "artDirection": "...", "typography": "...", "lighting": "...", "texture": "...", "palette": ["#RRGGBB", "#RRGGBB", "#RRGGBB"]
  }
}`;

  const chain = bestGeminiChain();
  const raw = await callGemini(prompt, chain[0], undefined, {
    system: "You are a senior social creative director. Every public claim must be traceable to the supplied fact ledger.",
    temperature: 0.65,
    maxTokens: 16000,
    modelChain: chain,
  });
  if (!raw) return NextResponse.json({ error: "Gemini returned no social content" }, { status: 502 });

  const parsed = SocialContentSchema.safeParse(parseJsonResponse(raw));
  if (!parsed.success) {
    console.error("[social-content] invalid Gemini response", parsed.error.flatten());
    return NextResponse.json({ error: "Gemini returned an invalid content kit" }, { status: 502 });
  }

  const content = { ...parsed.data, generatedAt: new Date().toISOString(), model: chain[0] };
  const existingMockup = (extracted.mockup as Record<string, unknown> | undefined) ?? {};
  const { error } = await admin
    .from("artifacts")
    .update({
      extracted_assets: {
        ...extracted,
        mockup: { ...existingMockup, socialContent: content, socialMotion: { status: "needs-generation" } },
      },
      last_edited_at: new Date().toISOString(),
    })
    .eq("lead_id", leadId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, content });
}
