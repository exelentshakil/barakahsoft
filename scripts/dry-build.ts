import { createAdminClient } from "@/lib/supabase/admin";
import { extractEntities } from "@/lib/extract-entities";
import { extractDesignDna, type DesignDna } from "@/lib/design-dna";
import { composePage } from "@/lib/generate/v2/compose";
import { buildSiteBrief } from "@/lib/build-site-brief";
import { resolveVerticalAsync } from "@/lib/verticals/resolve";
import type { Lead, ScrapeResults, Artifact } from "@/types/database";

// What would this lead's page actually be made of?
//
// The whole composition — the reference's blueprint, the client's verified
// entities, which sections survive and which are dropped and why — decided and
// printed without generating anything, without a build, and without writing a
// row. The expensive half of a build is the copy and the images; none of that
// is needed to answer the question this script exists for, which is whether
// the page is going to be about the right things.
//
//   npm run dry -- <lead slug or id> [--reference https://…]
//
// --reference re-reads a reference site and shows the blueprint it yields,
// which is the only way to see one for a lead whose stored design direction
// predates blueprints.

async function main() {
  const [target, ...rest] = process.argv.slice(2);
  if (!target) {
    console.error("usage: npm run dry -- <lead slug or id> [--reference <url>]");
    process.exit(1);
  }
  const referenceFlag = rest.indexOf("--reference");
  const reference = referenceFlag >= 0 ? rest[referenceFlag + 1] : null;

  const admin = createAdminClient();
  const column = /^[0-9a-f-]{36}$/i.test(target) ? "id" : "slug";
  const { data: lead } = await admin.from("leads").select("*").eq(column, target).maybeSingle<Lead>();
  if (!lead) {
    console.error(`no lead with ${column} "${target}"`);
    process.exit(1);
  }

  const [{ data: scrape }, { data: artifact }] = await Promise.all([
    admin.from("scrape_results").select("*").eq("lead_id", lead.id).maybeSingle<ScrapeResults>(),
    admin.from("artifacts").select("*").eq("lead_id", lead.id).maybeSingle<Artifact>(),
  ]);
  if (!scrape) {
    console.error(`lead "${lead.slug}" has not been scraped`);
    process.exit(1);
  }

  console.log(`\n${lead.business_name ?? lead.slug}  ·  ${lead.industry ?? "no industry"}  ·  ${lead.source_url}`);
  console.log("=".repeat(78));

  // 1. Entities. Re-read rather than trusting the stored copy, so the script
  //    also serves as a way to see what a change to the extractor does.
  let entities = scrape.entities ?? [];
  if (entities.length === 0) {
    console.log("\nno stored entities — extracting now");
    const result = await extractEntities(scrape.facts as Record<string, unknown>);
    entities = result.entities;
    for (const line of result.dropped.slice(0, 10)) console.log(`  dropped: ${line}`);
  }

  console.log(`\nENTITIES (${entities.length})`);
  const byKind = new Map<string, typeof entities>();
  for (const entity of entities) byKind.set(entity.kind, [...(byKind.get(entity.kind) ?? []), entity]);
  if (byKind.size === 0) console.log("  none — this page will be built from the vertical's section list alone");
  for (const [kind, list] of byKind) {
    console.log(`  ${kind} (${list.length})`);
    for (const item of list.slice(0, 6)) {
      const price = item.price ? ` — ${item.price}${item.period ? `/${item.period}` : ""}` : "";
      console.log(`    · ${item.label}${price}${item.detail ? `  (${item.detail})` : ""}`);
    }
    if (list.length > 6) console.log(`    · …${list.length - 6} more`);
  }

  // 2. Blueprint.
  let dna = (artifact?.inspiration_branding as DesignDna | null) ?? null;
  if (reference) {
    console.log(`\nreading reference ${reference}`);
    const result = await extractDesignDna(reference);
    for (const warning of result.warnings) console.log(`  warning: ${warning}`);
    dna = result.dna;
  }

  console.log(`\nBLUEPRINT  ${dna?.sourceName ?? "none"}`);
  if (!dna?.blueprint) {
    console.log("  none stored — pass --reference <url> to extract one, or re-run design research");
  } else {
    for (const section of dna.blueprint.sections) {
      console.log(
        `  ${section.kind.padEnd(22)} → ${(section.nearest ?? "—").padEnd(12)} needs: ${section.needs.join(", ") || "—"}`
      );
    }
    if (dna.blueprint.rationale) console.log(`  ${dna.blueprint.rationale}`);
  }

  // 3. The page that would be built.
  const vertical = await resolveVerticalAsync(lead, artifact ?? null, (scrape.facts as { derived_services?: string[] })?.derived_services ?? []);
  const brief = buildSiteBrief(lead, { ...scrape, entities }, vertical.profile, {});
  const composition = composePage({
    vertical: vertical.profile,
    design: dna,
    capability: {
      entities,
      hasReviews: Boolean(brief.rating || brief.reviewCount),
      hasPhotos: brief.photos.length > 0,
      areaCount: brief.areas.length,
      serviceCount: brief.services.length,
    },
  });

  console.log(`\nTHE PAGE  (${composition.sections.length} sections, from the ${composition.source})`);
  composition.sections.forEach((section, index) => {
    console.log(`  ${String(index + 1).padStart(2)}. ${section.id.padEnd(12)} ${section.kind === section.id ? "" : `← ${section.kind}`}`);
  });
  if (composition.notes.length) {
    console.log("\nDROPPED");
    for (const note of composition.notes) console.log(`  ${note.replace("[blueprint] ", "")}`);
  }
  console.log("");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
