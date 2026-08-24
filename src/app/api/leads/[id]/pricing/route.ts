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
  if (!body) return NextResponse.json({ error: "Invalid pricing body" }, { status: 400 });

  const admin = createAdminClient();

  try {
    const { data: artifact } = await admin
      .from("artifacts")
      .select("extracted_assets")
      .eq("lead_id", leadId)
      .maybeSingle();

    const existingAssets = (artifact?.extracted_assets ?? {}) as Record<string, unknown>;

    const existingPricing = (existingAssets.pricing as Record<string, unknown> | undefined) ?? {};
    const pricingConfig = {
      ...existingPricing,
      model: body.model || "hybrid", // "flat" | "monthly" | "hybrid"
      setupPrice: typeof body.setupPrice === "number" ? body.setupPrice : 779,
      monthlyPrice: typeof body.monthlyPrice === "number" ? body.monthlyPrice : 99,
      standardValue: typeof body.standardValue === "number" ? body.standardValue : 1897,
      discountLabel: body.discountLabel || "Save $1,000 Today",
      ...(Array.isArray(body.scopeItems)
        ? { scopeItems: body.scopeItems.filter((item: unknown): item is string => typeof item === "string").map((item: string) => item.trim()).filter(Boolean).slice(0, 10) }
        : {}),
      updated_at: new Date().toISOString(),
      updated_by: user.email,
    };

    const updatedExtractedAssets = {
      ...existingAssets,
      pricing: pricingConfig,
    };

    const { error } = await admin
      .from("artifacts")
      .update({
        extracted_assets: updatedExtractedAssets,
        last_edited_at: new Date().toISOString(),
      })
      .eq("lead_id", leadId);

    if (error) throw error;

    return NextResponse.json({ ok: true, pricing: pricingConfig });
  } catch (err) {
    console.error("[pricing-api] failed to update pricing", err);
    return NextResponse.json({ error: "Failed to update pricing" }, { status: 500 });
  }
}
