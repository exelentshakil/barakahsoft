import { profileForLead } from "@/lib/verticals/resolve";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { buildSiteBrief, buildKnownPaths } from "@/lib/build-site-brief";
import { compileDesignTokens } from "@/lib/design-tokens";
import { DesignDnaSchema, DEFAULT_DESIGN_DNA } from "@/lib/design-dna";
import { verifyHomepage } from "@/lib/audit/quality-gate";
import type { MediaPlan } from "@/lib/media/plan-media";
import type { Artifact, Lead, ScrapeResults } from "@/types/database";
import { DESIGN_LAW, TOKEN_CONTRACT, MECHANISM_CONTRACT } from "@/lib/design/law";

// One self-contained build prompt for one lead.
//
// The sell-this-site skill works by calling /api/site, which needs an admin
// session — so it works from Claude Code and nowhere else. Every other tool an
// operator might reach for (OpenCode, a plain chat window) fails at the first
// step and then invents the business rather than admitting it cannot see it.
// This route hydrates the whole thing instead: the same standard the generator
// works to, with this lead's real facts, palette, imagery and gate findings
// already in it, as plain text to paste anywhere.
//
// The current markup is NOT included by default. Handing a model the flat page
// it is meant to replace anchors it to that page — the same reason a rejected
// build is regenerated fresh rather than patched. ?includeCurrent=1 when the
// job really is a targeted fix.

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const includeCurrent = new URL(req.url).searchParams.get("includeCurrent") === "1";
  const admin = createAdminClient();

  const { data: lead } = await admin.from("leads").select("*").eq("id", leadId).maybeSingle<Lead>();
  if (!lead) return NextResponse.json({ error: "No such lead" }, { status: 404 });

  const [{ data: artifact }, { data: scrape }] = await Promise.all([
    admin.from("artifacts").select("*").eq("lead_id", leadId).maybeSingle<Artifact>(),
    admin.from("scrape_results").select("*").eq("lead_id", leadId).maybeSingle<ScrapeResults>(),
  ]);
  if (!scrape) {
    return NextResponse.json({ error: "Analyse this lead first — there are no facts to build from yet." }, { status: 409 });
  }

  const brief = buildSiteBrief(lead, scrape, profileForLead(lead, artifact ?? null), {});
  const parsedDna = DesignDnaSchema.safeParse(artifact?.inspiration_branding);
  const dna = parsedDna.success ? parsedDna.data : DEFAULT_DESIGN_DNA;
  const facts = (scrape.facts ?? {}) as Record<string, unknown>;

  const tokens = compileDesignTokens(dna, {
    colourSource: artifact?.colour_source,
    clientBrandHex: facts.brand_color_hex as string | null,
  });
  const knownPaths = buildKnownPaths(brief.services.slice(0, 8), brief.areas.slice(0, 8), brief.vertical.nouns);
  const media = (Array.isArray(artifact?.media_plan) ? artifact.media_plan : []) as MediaPlan;

  // Measured findings, so the agent starts from what is actually wrong rather
  // than from an impression of the page.
  const gate = artifact?.bespoke_homepage_html
    ? verifyHomepage(artifact.bespoke_homepage_html, brief, tokens, artifact.bespoke_css)
    : null;

  const factLines = [
    `Business: ${brief.businessName}`,
    `Trade: ${brief.industry}`,
    `Serves: ${brief.city}${brief.areas.length > 0 ? ` — ${brief.areas.slice(0, 10).join(", ")}` : ""}`,
    brief.founder ? `Owner: ${brief.founder}` : null,
    brief.phone ? `Phone (verbatim, in tel: links): ${brief.phone}` : null,
    brief.email ? `Email: ${brief.email}` : null,
    brief.rating && brief.reviewCount
      ? `Google: ${brief.rating} stars from ${brief.reviewCount} reviews — verified, lead with it`
      : `NO verified rating exists. Never mention ratings, stars or review counts.`,
    brief.licensedInsured
      ? `They state on their own site that they are licensed and insured — you may say so.`
      : `No licensing or insurance claim exists. Never claim licensed, insured, bonded or certified.`,
    `Their real services:\n${brief.services.map((s) => `  - ${s}`).join("\n")}`,
    brief.reviews.length > 0
      ? `Real reviews — quote verbatim or not at all:\n${brief.reviews.map((r) => `  "${r.text.slice(0, 260)}" — ${r.author}`).join("\n")}`
      : `No review text available. Include no testimonials of any kind.`,
    `\nScraped from their current site:\n${brief.factsDigest.slice(0, 5000)}`,
  ].filter(Boolean);

  const tokenList = Object.entries(tokens.vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");

  const prompt = `${DESIGN_LAW}

Write the complete homepage for a real ${brief.industry} business in ${brief.city}, and the
stylesheet that goes with it. The owner opens this page and decides in about four seconds
whether you are better than whoever built their current site. Make committed decisions — a
timid page of evenly-spaced identical cards is the failure to avoid.

Markup and stylesheet move together. There is no fallback stylesheet: a class you name in the
HTML with no rule in the CSS renders bare.

═══ THE BUSINESS — every claim comes from here and nowhere else ═══
${factLines.join("\n")}

═══ WHAT THIS PAGE IS FOR ═══
Primary action: ${brief.intent.primaryLabel}
${brief.intent.guidance}
${brief.intent.secondaryLabel ? `Secondary action: ${brief.intent.secondaryLabel}` : ""}
${
  brief.painInstructions.length > 0
    ? `\n═══ WHAT THE OWNER SAID IS WRONG — the page must visibly fix each ═══\n${brief.painInstructions.map((p) => `- ${p}`).join("\n")}`
    : ""
}
═══ DESIGN DIRECTION — researched from a best-in-class site in this trade ═══
Reference: ${dna.sourceName}${artifact?.inspiration_url ? ` (${artifact.inspiration_url})` : ""}
Mood: ${dna.mood} · Rhythm: ${dna.layout.sectionRhythm} · Hero: ${dna.layout.heroTreatment}
Services as: ${dna.layout.serviceLayout} · Proof as: ${dna.layout.proofStyle}
Geometry: ${dna.geometry.radius} corners, ${dna.geometry.elevation} elevation
Type: ${dna.typography.displayFamily} display, ${dna.typography.bodyFamily} body, ${dna.typography.scale} scale
Build these motifs rather than gesturing at them: ${dna.motifs.join("; ") || "none specified"}
Why the reference reads premium: ${dna.rationale}

═══ THE TOKENS — already defined on the page root. Use var() and never a literal colour ═══
${tokenList}

═══ IMAGES — only these URLs. Any other src is deleted on save ═══
${
  media.length > 0
    ? media.map((m) => `[${m.slot}] ${m.url}\n    shows: ${m.caption}`).join("\n")
    : "None planned. Build with type, colour and layout alone, and make that a deliberate editorial choice rather than a page with holes in it. Output no <img> tags."
}

═══ LINKS THAT EXIST ═══
${knownPaths.map((p) => `  ${p}`).join("\n")}
Anything else becomes an on-page anchor. Give each service block an id of its slug.
${brief.phone ? `Phone links: tel:${brief.phone.replace(/[^\d+]/g, "")}` : ""}

═══ HOW TO WRITE THE MARKUP ═══

Name classes descriptively and consistently, block-then-element:
  hero, hero__inner, hero__title, hero__actions
  services, services__grid, service-card, service-card__title

ABOUT DIRECTION FOR THIS LEAD

═══ HOW TO WRITE THE STYLESHEET ═══

- Modern CSS: grid and flex with gap. No floats, no margin hacks.
- Content sits in a centred container, max-width around 1200px, with a horizontal gutter that
  scales: 1.25rem on mobile, 2.5rem from desktop. Content must never touch the viewport edge.
- Mobile first. Every grid collapses to one column and every layout works from 360px up.
- Hover states on anything clickable, and a visible :focus-visible ring on every interactive
  element — keyboard users are real users.
- Wrap every transition and animation in @media (prefers-reduced-motion: no-preference).
- Style the reveal states: [data-reveal-armed] starts translated down and transparent,
  [data-revealed] returns to normal. Elements must be VISIBLE by default so the page reads
  with script disabled.
- Never write @import or url() — both are stripped on save.

${MECHANISM_CONTRACT}

${TOKEN_CONTRACT}

═══ WHAT THE PAGE MUST DO ═══

${
  gate && gate.findings.length > 0
    ? `\n═══ WHAT IS MEASURABLY WRONG WITH THE CURRENT BUILD ═══\nThese are measured, not opinions. Yours must not repeat them.\n${gate.findings.map((f) => `- [${f.severity}] ${f.detail}`).join("\n")}\n`
    : ""
}${
    includeCurrent && artifact?.bespoke_homepage_html
      ? `\n═══ THE CURRENT PAGE — for reference only, do not patch it ═══\n${artifact.bespoke_homepage_html.slice(0, 40000)}\n\n═══ ITS CURRENT STYLESHEET ═══\n${(artifact.bespoke_css ?? "").slice(0, 30000)}\n`
      : ""
  }
═══ HOW TO DELIVER ═══
Reply with the HTML body fragment in one fenced block, then the CSS in a second fenced block.
Nothing else. No commentary between them.

Then paste both into the lead's admin page, Hand-written page → Save. They are sanitised and
saved as a new version, so nothing is lost.`;

  return new NextResponse(prompt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
