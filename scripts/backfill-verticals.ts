import { createAdminClient } from "@/lib/supabase/admin";
import { classifyIcp } from "@/lib/verticals/icp";
import { servicesForMatching } from "@/lib/build-site-brief";
import type { Lead, ScrapeResults } from "@/types/database";

// Classify leads that predate the router, or reclassify after a pattern change.
//
// Free and idempotent: no model call, and it never overwrites a vertical an
// operator chose by hand. Run it after editing lib/verticals/icp.ts to see what
// the new patterns do to the real corpus before trusting them.
//
//   npm run backfill:verticals -- --dry
//   npm run backfill:verticals

async function main() {
  const dry = process.argv.includes("--dry");
  const admin = createAdminClient();

  const { data: leads, error } = await admin
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Lead[]>();
  if (error) throw new Error(error.message);
  if (!leads?.length) return console.log("no leads");

  const { data: scrapes } = await admin
    .from("scrape_results")
    .select("*")
    .returns<ScrapeResults[]>();
  const scrapeFor = new Map((scrapes ?? []).map((row) => [row.lead_id, row]));

  let changed = 0;
  for (const lead of leads) {
    const scrape = scrapeFor.get(lead.id) ?? null;
    const facts = (scrape?.facts ?? {}) as Record<string, unknown>;
    const places = facts.places as { rating?: number | null } | undefined;
    const nap = facts.nap as { phones?: string[] } | undefined;

    const icp = classifyIcp({
      industry: lead.industry,
      businessName: lead.business_name,
      services: servicesForMatching(scrape),
      hasPhone: Boolean(nap?.phones?.length || lead.phone),
      hasReviews: Boolean(places?.rating),
    });

    const updates: Record<string, unknown> = {
      icp_category: icp.category.slug,
      icp_fit: icp.fit,
    };
    // An operator's choice is never overwritten by a classifier.
    if (!lead.vertical_slug) updates.vertical_slug = icp.category.vertical;

    const unchanged =
      lead.icp_category === updates.icp_category &&
      lead.icp_fit === updates.icp_fit &&
      (lead.vertical_slug ?? updates.vertical_slug) === (updates.vertical_slug ?? lead.vertical_slug);

    console.log(
      `${unchanged ? "  " : "→ "}${(lead.business_name ?? lead.slug).padEnd(34).slice(0, 34)}` +
        `  ${String(lead.industry ?? "—").padEnd(26).slice(0, 26)}` +
        `  ${icp.category.slug} (${icp.fit})` +
        `${lead.vertical_slug ? `  [operator: ${lead.vertical_slug}]` : ""}`
    );

    if (unchanged || dry) continue;
    const { error: writeError } = await admin.from("leads").update(updates).eq("id", lead.id);
    if (writeError) console.error(`   failed: ${writeError.message}`);
    else changed++;
  }

  console.log(dry ? `\n${leads.length} leads inspected (dry run, nothing written)` : `\n${changed} leads updated`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
