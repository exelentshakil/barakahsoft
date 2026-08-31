// Re-lay the current BASE_STYLESHEET under a built lead's own token block.
//
// A CSS-only change otherwise needs a full regenerate — a Gemini build, new
// copy, new photos — to reach a site that is already approved. This swaps the
// stylesheet and nothing else: the lead's compiled design tokens, its HTML and
// its copy are untouched.
//
//   npm run restyle -- saddleroofing
//   npm run restyle -- --all
import { createClient } from "@supabase/supabase-js";
import { BASE_STYLESHEET } from "@/lib/generate/v2/base-stylesheet";

// The token block the generator writes ends where the base sheet begins.
const MARKER = "/* ---------- foundation";

async function restyle(db: ReturnType<typeof createClient>, slug: string, leadId: string) {
  const { data: artifact } = await db
    .from("artifacts")
    .select("bespoke_css")
    .eq("lead_id", leadId)
    .maybeSingle<{ bespoke_css: string | null }>();

  const current = artifact?.bespoke_css ?? "";
  if (!current) {
    console.log(`${slug}: no stylesheet yet, skipped`);
    return;
  }

  const cut = current.indexOf(MARKER);
  if (cut < 0) {
    // Refuse rather than guess: getting this boundary wrong discards the
    // lead's palette and fonts, which are not recoverable from here.
    console.log(`${slug}: no foundation marker, skipped`);
    return;
  }

  const next = current.slice(0, cut) + BASE_STYLESHEET.slice(BASE_STYLESHEET.indexOf(MARKER));
  if (next === current) {
    console.log(`${slug}: already current`);
    return;
  }

  const { error } = await db.from("artifacts").update({ bespoke_css: next }).eq("lead_id", leadId);
  if (error) throw error;
  console.log(`${slug}: ${current.length} -> ${next.length} bytes`);
}

async function main() {
  const arg = process.argv[2];
  if (!arg) throw new Error("usage: restyle-lead <slug> | --all");

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const query = db.from("leads").select("id, slug");
  const { data: leads, error } = arg === "--all" ? await query : await query.eq("slug", arg);
  if (error) throw error;
  if (!leads?.length) throw new Error(`no lead matched ${arg}`);

  for (const lead of leads as { id: string; slug: string }[]) {
    await restyle(db, lead.slug, lead.id);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
