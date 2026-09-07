// Contrast and readability check for a site that is already built.
//
//   npm run check -- saddleroofing
//   npm run check -- --all
//   npm run check -- saddleroofing --verbose
//
// This is the deterministic half of the release gate, pointed at a lead that
// already exists. It resolves every colour pair in the compiled stylesheet to
// real hex and measures the WCAG ratio, so it answers "can a person read this
// page" rather than "did a model think it looked fine". No browser, no model
// call, no cost — it runs in about a second per site.
//
// A BLOCKER is measured: two colours that genuinely render too close together.
// A WARNING is inferred from token names and can be a false positive, because
// a token whose value is computed cannot be resolved by name alone.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { verifyHomepage } from "@/lib/audit/quality-gate";
import { compileDesignTokens } from "@/lib/design-tokens";
import { DEFAULT_DESIGN_DNA } from "@/lib/design-dna";
import type { DesignTokens } from "@/lib/design-tokens";

interface Row {
  id: string;
  slug: string;
}

interface Outcome {
  slug: string;
  blockers: number;
  warnings: number;
  skipped?: string;
}

const verbose = process.argv.includes("--verbose");

async function checkOne(db: SupabaseClient, row: Row): Promise<Outcome> {
  const { data: artifact } = await db
    .from("artifacts")
    .select("bespoke_css, bespoke_homepage_html, design_tokens")
    .eq("lead_id", row.id)
    .maybeSingle<{
      bespoke_css: string | null;
      bespoke_homepage_html: string | null;
      design_tokens: unknown;
    }>();

  if (!artifact?.bespoke_css) {
    return { slug: row.slug, blockers: 0, warnings: 0, skipped: "not built yet" };
  }

  // A site built before design_tokens was persisted still has a usable
  // stylesheet; the house defaults let the rule pairs resolve rather than
  // silently reporting a clean pass on colours nothing could look up.
  const tokens = (artifact.design_tokens as DesignTokens | null) ?? compileDesignTokens(DEFAULT_DESIGN_DNA);

  const report = verifyHomepage(
    artifact.bespoke_homepage_html ?? "",
    {} as never,
    tokens,
    artifact.bespoke_css
  );

  const warnings = report.findings.filter((finding) => finding.severity === "warning");
  const mark = report.blockers.length ? "FAIL" : "ok  ";
  console.log(`${mark} ${row.slug}  blockers=${report.blockers.length} warnings=${warnings.length}`);

  for (const blocker of report.blockers) console.log(`       ! ${blocker.detail}`);
  if (verbose) for (const warning of warnings) console.log(`       ~ ${warning.detail}`);

  return { slug: row.slug, blockers: report.blockers.length, warnings: warnings.length };
}

async function main() {
  const target = process.argv[2];
  if (!target || target.startsWith("--")) {
    throw new Error("usage: npm run check -- <slug> | --all [--verbose]");
  }

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const query = db.from("leads").select("id, slug");
  const { data, error } = target === "--all" ? await query : await query.eq("slug", target);
  if (error) throw error;

  const rows = (data ?? []) as Row[];
  if (!rows.length) throw new Error(`no lead matched ${target}`);

  const outcomes: Outcome[] = [];
  for (const row of rows) outcomes.push(await checkOne(db, row));

  const built = outcomes.filter((outcome) => !outcome.skipped);
  const failing = built.filter((outcome) => outcome.blockers > 0);
  const skipped = outcomes.filter((outcome) => outcome.skipped);

  console.log(
    `\n${built.length} built, ${failing.length} with contrast blockers` +
      (skipped.length ? `, ${skipped.length} not built yet` : "")
  );
  if (failing.length) {
    console.log(`fix the stylesheet, then: npm run restyle -- --all`);
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
