import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";

// Persists the operator's brief.
//
// Confirmed data loss: the Studio's fields were only ever sent along with a
// generate request, and nothing wrote them back. "Exact Industry" and "Core
// Services" therefore came back empty on every reload -- the operator typed
// them, generated, and lost them. The brief is the most valuable human input
// in the whole pipeline and it was the only thing not being saved.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid brief payload" }, { status: 400 });

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("artifacts")
    .select("extracted_assets")
    .eq("lead_id", leadId)
    .maybeSingle<{ extracted_assets: Record<string, unknown> }>();

  // Only overwrite what was actually sent. The Studio autosaves individual
  // fields as they change, so a partial payload must not blank the rest.
  const brief: Record<string, unknown> = { ...(existing?.extracted_assets ?? {}) };

  const assign = (key: string, value: unknown) => {
    if (value !== undefined && value !== null) brief[key] = value;
  };

  assign("business_name", typeof body.businessName === "string" ? body.businessName : undefined);
  assign("founder_name", typeof body.founder === "string" ? body.founder : undefined);
  assign("city", typeof body.city === "string" ? body.city : undefined);
  assign("industry", typeof body.industry === "string" ? body.industry : undefined);
  assign("hero_cutout", typeof body.heroImage === "string" ? body.heroImage : undefined);
  assign("logo_url", typeof body.logoUrl === "string" ? body.logoUrl : undefined);
  assign("footer_logo_url", typeof body.footerLogoUrl === "string" ? body.footerLogoUrl : undefined);
  assign("about_content", typeof body.aboutContent === "string" ? body.aboutContent : undefined);
  assign("services_list", Array.isArray(body.services) ? body.services.filter(Boolean) : undefined);
  assign("areas_list", Array.isArray(body.areas) ? body.areas.filter(Boolean) : undefined);
  assign("brand_hex", typeof body.brandHex === "string" ? body.brandHex : undefined);

  // The same values in the shape the generator actually reads.
  //
  // A second confirmed loss, and the same species as the four-key logo bug
  // above: this route wrote snake_case keys at the top of extracted_assets,
  // while buildSiteBrief only ever reads extracted_assets.brief_overrides in
  // camelCase. So an operator could correct the services, the town, the founder
  // or the brand colour, watch it save, and have every one of those corrections
  // ignored by the next build unless they happened to be re-typed into the
  // generate request itself. One writer, both readers.
  const overrides = { ...((brief.brief_overrides ?? {}) as Record<string, unknown>) };
  const carry = (key: string, value: unknown) => {
    if (value !== undefined && value !== null) overrides[key] = value;
  };
  carry("businessName", typeof body.businessName === "string" ? body.businessName : undefined);
  carry("founder", typeof body.founder === "string" ? body.founder : undefined);
  carry("city", typeof body.city === "string" ? body.city : undefined);
  carry("industry", typeof body.industry === "string" ? body.industry : undefined);
  carry("heroImage", typeof body.heroImage === "string" ? body.heroImage : undefined);
  carry("logoUrl", typeof body.logoUrl === "string" ? body.logoUrl : undefined);
  carry("footerLogoUrl", typeof body.footerLogoUrl === "string" ? body.footerLogoUrl : undefined);
  carry("aboutContent", typeof body.aboutContent === "string" ? body.aboutContent : undefined);
  carry("brandHex", typeof body.brandHex === "string" ? body.brandHex : undefined);
  carry("services", Array.isArray(body.services) ? body.services.filter(Boolean) : undefined);
  carry("areas", Array.isArray(body.areas) ? body.areas.filter(Boolean) : undefined);
  brief.brief_overrides = overrides;

  brief.brief_updated_at = new Date().toISOString();

  const { error } = await admin
    .from("artifacts")
    .update({ extracted_assets: brief, last_edited_at: new Date().toISOString() })
    .eq("lead_id", leadId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update derived areas on scrape results so renderShell and location templates get the full list
  if (Array.isArray(body.areas) && body.areas.length > 0) {
    const { data: scrapeRow } = await admin
      .from("scrape_results")
      .select("facts")
      .eq("lead_id", leadId)
      .maybeSingle<{ facts: Record<string, unknown> }>();
    if (scrapeRow?.facts) {
      const updatedFacts = {
        ...scrapeRow.facts,
        derived_areas: body.areas.filter(Boolean),
      };
      await admin.from("scrape_results").update({ facts: updatedFacts }).eq("lead_id", leadId);
    }
  }

  // Industry lives on the lead too — the leads table is what the pipeline
  // list and the persona classifier read.
  if (typeof body.industry === "string" && body.industry.trim()) {
    await admin.from("leads").update({ industry: body.industry.trim() }).eq("id", leadId);
  }

  return NextResponse.json({ ok: true, brief });
}
