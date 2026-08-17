import { findRelevantPage, buildRichContext } from "@/lib/facts-context";
import { draftCritiqueRevise } from "@/lib/generate-with-critique";
import type { Facts, GenerationContext } from "@/lib/ai";
import type { Playbook } from "@/lib/playbooks";
import type { GeminiImagePart } from "@/lib/gemini-client";
import { sanitizeGeneratedHtml, enforceBrandColor } from "@/lib/sanitize-generated-html";

// v8 -- replaces the section-variant-catalog enum-pick composition step.
// The AI now generates the actual homepage markup, informed directly by
// real reference screenshots for this exact trade (vision input) instead
// of picking a slug from a fixed ~30-component menu. Real safety measures
// stay in place: every claim must come from the real facts below (same
// "never invent" discipline as every other generator in this codebase),
// output is sanitized before it's ever stored (sanitize-generated-html.ts
// strips scripts/handlers/dangerous URLs), and this still routes through
// the existing human QA gate before anything goes live.

// v8 -- a trailing HTML comment ("<!-- RATIONALE: ... -->") didn't survive
// the critique/revise pass reliably (the model just dropped it when told
// to "reply with the revised text only") -- a plain-text prefix line before
// a real delimiter is a much more robust format for the model to preserve
// than an HTML comment nested inside markup it's actively rewriting.
const RATIONALE_PREFIX = /^RATIONALE:\s*(.*?)\s*\n---PAGE---\s*\n/i;

function realPhotoUrls(facts: Facts): string[] {
  const sitePhotos = (facts.site_photos as { url: string }[] | undefined) ?? [];
  const gbpPhotos = (facts.gbp_photo_urls as string[] | undefined) ?? [];
  return [...sitePhotos.map((p) => p.url), ...gbpPhotos].slice(0, 20);
}

export async function generateBespokeHomepage(
  facts: Facts,
  playbook: Playbook,
  genContext: GenerationContext,
  nicheScreenshots: GeminiImagePart[]
): Promise<{ html: string; rationale: string } | null> {
  const homepage = findRelevantPage(facts);
  const richContext = buildRichContext(facts, { relevantPage: homepage, maxChars: 4000 });
  const photos = realPhotoUrls(facts);
  const nap = facts.nap as { phones?: string[]; email?: string } | undefined;
  const phone = nap?.phones?.[0];
  const email = nap?.email;
  const town = genContext.town;

  const visionIntro = nicheScreenshots.length > 0
    ? `The ${nicheScreenshots.length} images attached are real, hand-picked, premium websites from real businesses in this exact trade. Study them closely -- pick the ONE that most closely matches this business's real photo stock, review volume, and service breadth, and mirror THAT reference's actual structure: its section order, its layout shapes, how dense or sparse its content is, how bold or restrained its color use is. Do not average across all of them into something generic -- commit to genuinely resembling the one you pick, using your own real component judgment, never literally copying its exact colors, images, or text.\n\n`
    : "";

  const prompt = `You are building a complete, real, premium homepage for a real ${playbook.industry_label} business${town ? ` in ${town}` : ""} -- a genuine, bespoke design, not a generic template. This is going straight to a human review before it ever reaches the business, so make real, confident design decisions.

ABSOLUTE COLOR RULE, read this first: this business has one real brand color, already wired into these exact Tailwind classes: bg-primary, text-primary, border-primary, bg-primary/10 (and other /opacity values), text-primary-foreground, bg-gradient-primary, text-gradient-primary, ring-primary, shadow-lift, shadow-glow, decor-blob. These are the ONLY color-bearing classes you may use anywhere in this page. You are STRICTLY FORBIDDEN from using any other color family -- no amber, blue, red, orange, yellow, green, emerald, teal, cyan, sky, indigo, violet, purple, fuchsia, pink, rose, lime, in ANY shade, ANYWHERE. Neutral grayscale classes (white, black, and any slate/gray/zinc/neutral/stone shade) are fine for body text, borders, and neutral backgrounds. Every accent, every button, every icon background, every highlighted number must use the bg-primary/text-primary family above, never a hardcoded color name.

${visionIntro}Real facts about this business -- ground every single claim, number, and detail ONLY in what's below. Never invent a price, a certification, a guarantee, a claim, or a fact not present here:
${richContext}
${phone ? `Real phone: ${phone}` : ""}
${email ? `Real email: ${email}` : ""}

Real photo URLs available to use (use ONLY these exact URLs for any <img src>, never invent or guess a URL, and never use a URL not in this list):
${photos.length > 0 ? photos.map((u) => `- ${u}`).join("\n") : "(none available -- do not include any <img> tags)"}

Build a real HTML5 body-fragment (no <html>, <head>, or <body> tags -- just the real page content, starting with a header/nav and ending with a footer) covering, in whatever order and visual treatment you judge best for this specific business: a real hero with a genuine headline/subhead grounded in the facts above, real phone/CTA; a trust-signal strip if the facts support one (real rating, real review count, real license/insurance mention); a real services section listing the business's actual real services; real social proof if real reviews exist; a real FAQ if genuinely useful facts support real answers; a final call-to-action band; and a real footer with the real phone/email/address.

Styling rules -- Tailwind utility classes only, no inline style attributes:
- Standard Tailwind layout/spacing/typography utilities (flex, grid, gap-*, p-*, rounded-*, text-*, font-*, etc.) are all available.
- Real, bold visual composition is the whole point here -- dark high-contrast bands, real photo density, confident spacing -- not a flat, timid, all-white page. Bold and colorful means using the real brand-color classes above with confidence (large bg-gradient-primary bands, bg-primary buttons, shadow-glow accents), not reaching for a different color family.

Never invent a review, a testimonial quote, or a name that isn't in the real facts above.

Your reply must start with exactly this format, on its own first two lines, before the HTML -- keep these exact two lines even if you revise the page afterward:
RATIONALE: one sentence naming which reference site you drew from and why
---PAGE---
Then the real HTML body-fragment.`;

  const raw = await draftCritiqueRevise(
    prompt,
    "",
    "real HTML5 body-fragment, Tailwind utility classes only, grounded only in the real facts provided",
    undefined,
    nicheScreenshots
  );
  if (!raw) return null;

  const trimmedRaw = raw.replace(/^```(?:html)?\s*/i, "").trim();
  const match = trimmedRaw.match(RATIONALE_PREFIX);
  const rationale = match ? match[1].trim() : "";
  const htmlOnly = match ? trimmedRaw.slice(match[0].length) : trimmedRaw;
  const cleaned = htmlOnly.replace(/```\s*$/i, "").trim();
  if (!cleaned) return null;

  return {
    html: sanitizeGeneratedHtml(enforceBrandColor(cleaned)),
    rationale: rationale || `Bespoke homepage generated from this business's real facts and ${nicheScreenshots.length} real ${playbook.industry_label.toLowerCase()} reference designs.`,
  };
}
