import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { compileDesignTokens, type ColourSource } from "@/lib/design-tokens";
import { DesignDnaSchema, DEFAULT_DESIGN_DNA } from "@/lib/design-dna";

// Switching whose colours the site uses.
//
// Instant, because it only recompiles tokens — the generated markup contains
// no colours of its own, so the entire site rebrands without regenerating a
// single word. That property is the payoff of the token contract.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const source = body.source as ColourSource;
  if (!["reference", "client", "hybrid"].includes(source)) {
    return NextResponse.json({ error: "Choose reference, client or hybrid" }, { status: 400 });
  }

  const admin = createAdminClient();
  const [{ data: artifact }, { data: scrape }] = await Promise.all([
    admin
      .from("artifacts")
      .select("inspiration_branding")
      .eq("lead_id", leadId)
      .single<{ inspiration_branding: unknown }>(),
    admin
      .from("scrape_results")
      .select("facts")
      .eq("lead_id", leadId)
      .maybeSingle<{ facts: Record<string, unknown> }>(),
  ]);

  const parsed = artifact?.inspiration_branding ? DesignDnaSchema.safeParse(artifact.inspiration_branding) : null;
  const dna = parsed?.success ? parsed.data : DEFAULT_DESIGN_DNA;
  const clientBrandHex = (scrape?.facts?.brand_color_hex as string | undefined) ?? null;

  if (source !== "reference" && !clientBrandHex) {
    return NextResponse.json(
      { error: "No brand colour was detected on the client's current site, so there is nothing to revert to." },
      { status: 409 }
    );
  }

  const { error } = await admin
    .from("artifacts")
    .update({
      colour_source: source,
      design_tokens: compileDesignTokens(dna, { colourSource: source, clientBrandHex }),
    })
    .eq("lead_id", leadId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    source,
    referenceColour: dna.palette.primary,
    clientColour: clientBrandHex,
  });
}
