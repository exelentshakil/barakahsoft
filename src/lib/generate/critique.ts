import { z } from "zod";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { callBestModel, type GenerationProvider } from "@/lib/generate/model";
import type { SiteBrief } from "@/lib/generate-bespoke-site";
import type { DesignDna } from "@/lib/design-dna";

const CritiqueSchema = z.object({
  passes: z.boolean(),
  blockers: z.array(z.string().min(8).max(300)).max(10),
  warnings: z.array(z.string().min(8).max(300)).max(10),
});

export type PremiumCritique = z.infer<typeof CritiqueSchema>;

export async function critiqueHomepage(
  html: string,
  css: string,
  brief: SiteBrief,
  dna: DesignDna,
  provider: GenerationProvider
): Promise<PremiumCritique | null> {
  const prompt = `Act as the final creative director and conversion QA gate for a premium local-business homepage.

This is a release decision, not a request for optional polish. Reject only defects that keep the page from being convincingly sellable. Do not reject because you personally prefer another style.

BUSINESS
- Name: ${brief.businessName}
- Trade: ${brief.industry}
- Location: ${brief.city}
- Primary action: ${brief.intent.primaryLabel}
- Available images: ${brief.photos.length}
- Verified review proof: ${brief.rating && brief.reviewCount ? `${brief.rating} from ${brief.reviewCount} reviews` : "none"}

INTENDED VISUAL SYSTEM
- Mood: ${dna.mood}
- Hero: ${dna.layout.heroTreatment}
- Rhythm: ${dna.layout.sectionRhythm}
- Services: ${dna.layout.serviceLayout}
- Image density: ${dna.layout.imageDensity}
- Motifs: ${dna.motifs.join("; ") || "none specified"}
- Rationale: ${dna.rationale}

ASSESS THE COMPLETE HTML AND CSS AS ONE RENDERED PAGE. A passing page must have:
1. A decisive first screen with one dominant promise and action.
2. A coherent page-wide visual story, not disconnected cards.
3. Deliberately varied section archetypes; no repeated adjacent skeletons.
4. Premium colour cadence: quiet neutral space, intentional focal bands, and resets rather than mechanical zebra striping.
5. A recurring graphic principle used consistently, not random decorations.
6. An About section whose image and copy have balanced visual mass and whose treatment fits this lead rather than a universal template.
7. Clear typography hierarchy, controlled line lengths, whitespace, alignment, proximity, repetition and contrast.
8. Evidence and calls to action placed where objections arise, using only supplied facts.
9. Credible mobile behavior based on the media queries and fluid sizing in the CSS.
10. No obvious clipping, overlap, tiny text, empty bands, unsupported claims, or generic AI filler.

Blockers must name an observable defect and a concrete correction. Keep subjective preferences as warnings. Set passes=true only when blockers is empty.

HTML
${html.slice(0, 42000)}

CSS
${css.slice(0, 36000)}

Return JSON only:
{"passes":true,"blockers":[],"warnings":["optional observation"]}`;

  const raw = await callBestModel(
    prompt,
    {
      maxTokens: 12000,
      temperature: 0.2,
      system: "You are a strict but practical creative director. You approve strong varied work and reject concrete conversion, hierarchy, balance, responsiveness and cohesion defects.",
    },
    provider
  );
  if (!raw) return null;

  const parsed = parseJsonResponse(raw);
  const result = CritiqueSchema.safeParse(parsed);
  if (!result.success) {
    console.error("[premium-critique] invalid response", result.error.flatten());
    return null;
  }

  return {
    ...result.data,
    passes: result.data.blockers.length === 0 && result.data.passes,
  };
}
