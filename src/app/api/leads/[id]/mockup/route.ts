import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid mockup configuration" }, { status: 400 });

  const admin = createAdminClient();

  try {
    const [{ data: artifact }, { data: scrapeResults }] = await Promise.all([
      admin.from("artifacts").select("extracted_assets").eq("lead_id", leadId).maybeSingle(),
      admin.from("scrape_results").select("facts").eq("lead_id", leadId).maybeSingle(),
    ]);

    const existingAssets = (artifact?.extracted_assets ?? {}) as Record<string, unknown>;
    const existingMockup = (existingAssets.mockup ?? {}) as Record<string, unknown>;

    const mockupConfig = {
      ...existingMockup,
      ...(typeof body.themeId === "string" ? { themeId: body.themeId } : {}),
      ...(typeof body.headlineMode === "string" ? { headlineMode: body.headlineMode } : {}),
      ...(typeof body.featuredPhotoUrl === "string" ? { featuredPhotoUrl: body.featuredPhotoUrl } : {}),
      updated_at: new Date().toISOString(),
      updated_by: user.email,
    };

    const updatedExtractedAssets = {
      ...existingAssets,
      mockup: mockupConfig,
    };

    const { error: artifactError } = await admin
      .from("artifacts")
      .update({
        extracted_assets: updatedExtractedAssets,
        last_edited_at: new Date().toISOString(),
      })
      .eq("lead_id", leadId);

    if (artifactError) throw artifactError;

    if (body.featuredPhotoUrl && scrapeResults) {
      const existingFacts = (scrapeResults.facts ?? {}) as Record<string, unknown>;
      const { error: factsError } = await admin
        .from("scrape_results")
        .update({
          facts: {
            ...existingFacts,
            founder_photo_url: body.featuredPhotoUrl,
          },
        })
        .eq("lead_id", leadId);

      if (factsError) throw factsError;
    }

    return NextResponse.json({ ok: true, mockup: mockupConfig });
  } catch (err) {
    console.error("[mockup-api] failed to update mockup configuration", err);
    return NextResponse.json({ error: "Failed to update mockup configuration" }, { status: 500 });
  }
}
