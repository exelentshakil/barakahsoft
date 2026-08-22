import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { extractDesignDna, DesignDnaSchema } from "@/lib/design-dna";
import { compileDesignTokens } from "@/lib/design-tokens";
import { saveToLibrary, listLibrary, autoSelectDna } from "@/lib/inspiration-library";

export const maxDuration = 120;

// Step 2 of the Studio: the operator researches the best site in this
// lead's industry and drops its URL here. It is scraped and distilled into
// a design spec, which becomes the "how it looks" half of generation.
// The lead's own scraped facts remain the only "what it says" half.
/** Current direction plus the curated library, for the Studio panel. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from("artifacts")
    .select("inspiration_url, inspiration_branding")
    .eq("lead_id", leadId)
    .maybeSingle<{ inspiration_url: string | null; inspiration_branding: unknown }>();

  return NextResponse.json({
    url: data?.inspiration_url ?? null,
    branding: data?.inspiration_branding ?? null,
    library: await listLibrary(),
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const admin = createAdminClient();

  // Two ways in: extract from a URL, or save a hand-edited spec the
  // operator has already tuned. Both land in the same column.
  if (body.branding) {
    const parsed = DesignDnaSchema.safeParse(body.branding);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "That branding JSON does not match the expected shape", issues: parsed.error.issues.slice(0, 8) },
        { status: 400 }
      );
    }
    const { error } = await admin
      .from("artifacts")
      .update({
        inspiration_branding: parsed.data,
        inspiration_url: typeof body.url === "string" ? body.url : null,
        design_tokens: compileDesignTokens(parsed.data),
      })
      .eq("lead_id", leadId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, branding: parsed.data, warnings: [] });
  }

  // Curating a reference is the highest-leverage thing an operator can do:
  // it applies to every future lead in that industry automatically, with no
  // re-scrape, so the direction stays good even if the reference site later
  // changes or disappears.
  if (body.saveToLibrary) {
    const admin2 = createAdminClient();
    const { data: artifact } = await admin2
      .from("artifacts")
      .select("inspiration_branding, inspiration_url")
      .eq("lead_id", leadId)
      .maybeSingle<{ inspiration_branding: unknown; inspiration_url: string | null }>();

    const parsed = artifact?.inspiration_branding ? DesignDnaSchema.safeParse(artifact.inspiration_branding) : null;
    if (!parsed?.success) {
      return NextResponse.json({ error: "Extract a design direction before saving it to the library" }, { status: 409 });
    }

    const industry = typeof body.industry === "string" ? body.industry.trim() : "";
    if (!industry) return NextResponse.json({ error: "Set the lead's industry first" }, { status: 400 });

    await saveToLibrary(industry, parsed.data.sourceName || industry, parsed.data, artifact?.inspiration_url ?? null);
    return NextResponse.json({ ok: true, savedTo: industry, library: await listLibrary() });
  }

  // Re-run automatic selection, for when the operator has since saved a
  // better reference for this industry.
  if (body.auto) {
    const { dna, label, sourceUrl, from } = await autoSelectDna(
      typeof body.industry === "string" ? body.industry : null
    );
    const { error } = await admin
      .from("artifacts")
      .update({ inspiration_branding: dna, inspiration_url: sourceUrl, design_tokens: compileDesignTokens(dna) })
      .eq("lead_id", leadId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, branding: dna, label, from, warnings: [] });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) return NextResponse.json({ error: "Provide an inspiration URL" }, { status: 400 });

  const { dna, sourceUrl, warnings } = await extractDesignDna(url);

  const { error } = await admin
    .from("artifacts")
    .update({
      inspiration_url: sourceUrl,
      inspiration_branding: dna,
      design_tokens: compileDesignTokens(dna),
    })
    .eq("lead_id", leadId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, branding: dna, sourceUrl, warnings });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await admin
    .from("artifacts")
    .update({ inspiration_url: null, inspiration_branding: null, design_tokens: null })
    .eq("lead_id", leadId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
