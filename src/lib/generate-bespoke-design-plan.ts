import { z } from "zod";
import { buildRichContext, findRelevantPage } from "@/lib/facts-context";
import type { Facts, GenerationContext } from "@/lib/ai";
import type { Playbook } from "@/lib/playbooks";
import { callGemini, type GeminiImagePart } from "@/lib/gemini-client";
import { parseJsonResponse } from "@/lib/parse-json-response";

const PlanSchema = z.object({
  rationale: z.string().max(300),
  heroTreatment: z.enum(["editorial-split", "immersive-image", "dark-utility"]),
  surface: z.enum(["light-editorial", "dark-contrast", "warm-neutral"]),
  typeMood: z.enum(["modern-sans", "editorial-sans", "editorial-serif"]),
  imageDensity: z.enum(["hero-led", "balanced", "gallery-led"]),
  serviceLayout: z.enum(["feature-grid", "editorial-list", "bento-grid"]),
  iconSet: z.enum(["line-utility", "technical", "editorial"]),
  videoPolicy: z.enum(["client-video-only", "image-only"]),
});

export type BespokeDesignPlan = z.infer<typeof PlanSchema>;

export const DEFAULT_BESPOKE_PLAN: BespokeDesignPlan = {
  rationale: "A restrained editorial service layout built around real project photography and a direct contact path.",
  heroTreatment: "editorial-split",
  surface: "light-editorial",
  typeMood: "modern-sans",
  imageDensity: "balanced",
  serviceLayout: "feature-grid",
  iconSet: "line-utility",
  videoPolicy: "client-video-only",
};

export async function generateBespokeDesignPlan(facts: Facts, playbook: Playbook, context: GenerationContext, images: GeminiImagePart[]): Promise<BespokeDesignPlan> {
  if (images.length === 0) return DEFAULT_BESPOKE_PLAN;
  const prompt = `Act as a senior creative director for a premium ${playbook.industry_label} website. Return JSON only, never HTML. The attached screenshots are curated real websites from this trade. Study their composition, image density, typography hierarchy, whitespace, section rhythm, proof presentation, and CTA placement. Do not copy their words, logos, colors, or exact layout.

REAL BUSINESS FACTS:
${buildRichContext(facts, { relevantPage: findRelevantPage(facts), maxChars: 5000 })}

Location context: ${context.town ?? "local service area"}.

Rules: use only facts above; never invent claims, certifications, prices, reviews, areas, or response times. Never use emojis, cartoon graphics, generic gradients, or raw SVG artwork. The application supplies Lucide icons. Never use a generic generated video on a customer site. Use videoPolicy client-video-only unless a real client video is explicitly present in the facts; otherwise image-only. Choose one clear, distinctive agency-grade direction, not a generic card wall.

Return exactly this shape:
{"rationale":"...","heroTreatment":"editorial-split|immersive-image|dark-utility","surface":"light-editorial|dark-contrast|warm-neutral","typeMood":"modern-sans|editorial-sans|editorial-serif","imageDensity":"hero-led|balanced|gallery-led","serviceLayout":"feature-grid|editorial-list|bento-grid","iconSet":"line-utility|technical|editorial","videoPolicy":"client-video-only|image-only"}`;
  const raw = await callGemini(prompt, undefined, images);
  const parsed = raw ? parseJsonResponse(raw) : null;
  const result = parsed ? PlanSchema.safeParse(parsed) : null;
  return result?.success ? result.data : DEFAULT_BESPOKE_PLAN;
}
