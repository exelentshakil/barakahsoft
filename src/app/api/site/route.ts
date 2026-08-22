import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { criticiseDesign, issuesAsInstructions } from "@/lib/audit/design-critic";
import { compileDesignTokens } from "@/lib/design-tokens";
import { DesignDnaSchema, DEFAULT_DESIGN_DNA } from "@/lib/design-dna";
import { conversionIntentFor } from "@/lib/conversion-intent";
import type { Artifact, Lead, ScrapeResults } from "@/types/database";

// Everything an outside tool needs to work on a site, from its URL alone.
//
// Built so that fixing a page from Claude Code is one instruction rather than
// a research exercise. Point it at a preview URL and it gets the sections it
// can edit, the design tokens it must stay inside, the vocabulary it may use,
// the facts it may not contradict, and the critic's current findings —
// without having to be told any of it.
export async function GET(req: Request) {
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const url = new URL(req.url);
  const raw = url.searchParams.get("url") ?? url.searchParams.get("slug") ?? "";
  if (!raw) return NextResponse.json({ error: "Pass ?url= a site URL, or ?slug=" }, { status: 400 });

  // Accept a full preview URL, with or without query and hash, or a bare slug.
  const slug = raw.includes("/s/")
    ? raw.split("/s/")[1].split(/[/?#]/)[0]
    : raw.replace(/^https?:\/\/[^/]+\/?/, "").split(/[/?#]/)[0] || raw;

  const admin = createAdminClient();
  const { data: lead } = await admin.from("leads").select("*").eq("slug", slug).maybeSingle<Lead>();
  if (!lead) return NextResponse.json({ error: `No lead with slug "${slug}"` }, { status: 404 });

  const [{ data: artifact }, { data: scrape }] = await Promise.all([
    admin.from("artifacts").select("*").eq("lead_id", lead.id).maybeSingle<Artifact>(),
    admin.from("scrape_results").select("*").eq("lead_id", lead.id).maybeSingle<ScrapeResults>(),
  ]);

  if (!artifact?.bespoke_homepage_html) {
    return NextResponse.json({ error: "This lead has no generated homepage yet" }, { status: 409 });
  }

  const parsedDna = DesignDnaSchema.safeParse(artifact.inspiration_branding);
  const dna = parsedDna.success ? parsedDna.data : DEFAULT_DESIGN_DNA;
  const facts = (scrape?.facts ?? {}) as Record<string, unknown>;
  const nap = facts.nap as { phones?: string[]; emails?: string[]; address?: string } | undefined;
  const phone = nap?.phones?.[0] ?? lead.phone ?? null;

  const tokens = compileDesignTokens(dna, {
    colourSource: artifact.colour_source,
    clientBrandHex: facts.brand_color_hex as string | null,
  });

  const intent = conversionIntentFor(lead.industry, !!phone);
  // Run the critic so the caller starts from measured problems rather than
  // its own impression of the page.
  const verdict = await criticiseDesign(artifact.bespoke_homepage_html, tokens, intent, !!phone);

  return NextResponse.json({
    leadId: lead.id,
    slug: lead.slug,
    previewUrl: `${process.env.NEXT_PUBLIC_PORTAL_URL ?? ""}/s/${lead.slug}?view=preview`,
    business: {
      name: lead.business_name,
      industry: lead.industry,
      city: facts.town ?? null,
      phone,
      email: nap?.emails?.[0] ?? lead.email ?? null,
      rating: facts.rating ?? null,
      reviewCount: facts.review_count ?? null,
      services: facts.derived_services ?? [],
      painPoints: lead.pain_points ?? [],
    },
    design: {
      reference: dna.sourceName,
      referenceUrl: artifact.inspiration_url,
      mood: dna.mood,
      motifs: dna.motifs,
      colourSource: artifact.colour_source,
      tokens: tokens.vars,
    },
    conversion: intent,
    // The page as it stands. Rewrite whichever parts need it and send the
    // whole body back — there is no section-level API any more, because
    // splitting a page into editable blocks produced a worse result than
    // rewriting it against the full design standard.
    html: artifact.bespoke_homepage_html,
    css: artifact.bespoke_css,
    critic: {
      passes: verdict.passes,
      issues: verdict.issues,
      instructions: verdict.issues.length > 0 ? issuesAsInstructions(verdict.issues) : null,
    },
    howToEdit: {
      writeMarkup: `POST /api/leads/${lead.id}/bespoke with {"page_key":"home","html":"<section>...","css":"...","note":"why"}`,
      rebuildAll: `POST /api/leads/${lead.id}/generate with {"phase":1}`,
      rules: [
        "Write semantic HTML and a matching stylesheet. Class names are yours to choose; you write their rules.",
        "Never write a literal colour, font or shadow — every visual value comes from the tokens above.",
        "Only image URLs already present in the page may be used; others are deleted at sanitise.",
        "Never state a fact, price, rating or testimonial that is not in `business` above.",
        "No <script> tags. Motion comes from data attributes: data-reveal, data-count-to, data-accordion, data-bar.",
      ],
    },
  });
}
