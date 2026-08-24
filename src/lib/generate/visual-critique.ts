import { bestGeminiChain, callGemini, type GeminiImagePart } from "@/lib/gemini-client";
import { parseJsonResponse } from "@/lib/parse-json-response";
import { VisualCritiqueSchema, type VisualCritique, type VisualFinding } from "@/lib/visual-qa";

export async function critiqueRenderedHomepage(
  images: GeminiImagePart[],
  context: Record<string, unknown>,
  deterministicFindings: VisualFinding[]
): Promise<VisualCritique | null> {
  const prompt = `You are the final visual release gate for a premium business homepage. You are looking at real Chromium screenshots, not source code.

The first image is a contact sheet: desktop, tablet and mobile first screens across the top, with their complete full pages below. The remaining images are larger first-screen captures for accurate typography and hierarchy review.

BUSINESS AND INTENDED DIRECTION
${JSON.stringify(context, null, 2).slice(0, 16000)}

DETERMINISTIC BROWSER FINDINGS
${deterministicFindings.length ? deterministicFindings.map((finding) => `- [${finding.severity}] ${finding.check}: ${finding.detail}`).join("\n") : "None."}

Judge the rendered result, not whether you would personally choose another style. A release-quality page must have:
1. A decisive first screen with one dominant promise and primary action.
2. Strong hierarchy, readable typography, controlled line lengths and deliberate whitespace.
3. Balanced visual mass and image crops at all three viewport sizes.
4. Varied section composition with a coherent recurring graphic principle.
5. Premium colour cadence rather than mechanical alternating bands or endless cards.
6. A distinctive, balanced About treatment rather than a universal image-and-copy split.
7. Mobile recomposition, not merely a compressed desktop page.
8. Credible niche fit and conversion emphasis for this specific business.
9. No obvious overlap, clipping, empty bands, weak crops, illegible text or visual debris.
10. A coherent full-page journey whose quality does not collapse below the hero.

Scoring:
- 90-100: exceptional and immediately sellable.
- 82-89: strong enough to release, with only minor warnings.
- 70-81: credible but visibly below the premium reference bar; reject.
- Below 70: substantial redesign required.

Every blocker must describe an observable visual defect and a concrete correction. Do not create blockers from unsupported assumptions. passes may be true only when score >= 82 and blockers is empty.

Return JSON only:
{
  "passes": false,
  "score": 0,
  "scores": {"firstScreen":0,"hierarchy":0,"balance":0,"typography":0,"imagery":0,"cohesion":0,"mobile":0,"nicheFit":0},
  "blockers": ["observable defect and concrete correction"],
  "warnings": [],
  "strengths": [],
  "summary": "concise release rationale"
}`;

  const chain = bestGeminiChain();
  const raw = await callGemini(prompt, chain[0], images, {
    modelChain: chain,
    maxTokens: 12000,
    temperature: 0.15,
    system: "You are a strict, practical visual creative director. Pixel evidence decides the release.",
  });
  if (!raw) return null;

  const parsed = VisualCritiqueSchema.safeParse(parseJsonResponse(raw));
  if (!parsed.success) {
    console.error("[visual-critique] invalid response", parsed.error.flatten());
    return null;
  }

  return {
    ...parsed.data,
    passes: parsed.data.passes && parsed.data.score >= 82 && parsed.data.blockers.length === 0,
  };
}
