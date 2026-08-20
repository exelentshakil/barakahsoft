import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid brief payload" }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    // 1. Extract and normalize brand tokens
    const branding = body.branding || {};
    const colors = branding.colors || {};
    const primaryColor = colors.primary || body.primaryColor || "#533AFD";
    const secondaryColor = colors.secondary || body.secondaryColor || "#0D1738";
    const accentColor = colors.accent || body.accentColor || "#FFD12D";
    const logoUrl = branding.images?.logo || branding.logo || body.logoUrl || null;
    const fontStack = branding.typography?.fontFamilies?.primary || "Hanken Grotesk";

    // 2. Extract services & articles
    const services = Array.isArray(body.services) ? body.services : [];
    const articles = Array.isArray(body.articles) ? body.articles : [];
    const prohibitedClaims = Array.isArray(body.prohibitedClaims) ? body.prohibitedClaims : [];

    // 3. Update artifacts with the normalized brief
    const { data: existingArtifact } = await admin
      .from("artifacts")
      .select("extracted_assets")
      .eq("lead_id", leadId)
      .maybeSingle();

    const updatedExtractedAssets = {
      ...(existingArtifact?.extracted_assets || {}),
      branding: {
        colors: { primary: primaryColor, secondary: secondaryColor, accent: accentColor },
        logo: logoUrl,
        fontStack,
      },
      services_list: services,
      articles_plan: articles,
      prohibited_claims: prohibitedClaims,
      brief_version: (existingArtifact?.extracted_assets?.brief_version || 0) + 1,
      last_brief_update: new Date().toISOString(),
    };

    await admin
      .from("artifacts")
      .update({
        extracted_assets: updatedExtractedAssets,
        last_edited_at: new Date().toISOString(),
      })
      .eq("lead_id", leadId);

    // 4. Update lead status to brief_built if it was new
    await admin
      .from("leads")
      .update({ status: "preview_ready" })
      .eq("id", leadId)
      .eq("status", "new");

    return NextResponse.json({
      ok: true,
      briefVersion: updatedExtractedAssets.brief_version,
      extractedAssets: updatedExtractedAssets,
    });
  } catch (err) {
    console.error("[brief-api] error updating brief", err);
    return NextResponse.json({ error: "Failed to update brief" }, { status: 500 });
  }
}
