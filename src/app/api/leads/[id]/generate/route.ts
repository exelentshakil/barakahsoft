import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAccount } from "@/lib/get-or-create-account";
import { slugifyText } from "@/lib/slug";
import type { FunnelPageSection, Lead } from "@/types/database";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const admin = createAdminClient();

  const { data: lead } = await admin.from("leads").select("*").eq("id", leadId).single<Lead>();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  try {
    const accountId = await getOrCreateAccount(user.id, user.email ?? "");

    // Get valid template shell ID for foreign key constraint
    const { data: shell } = await admin
      .from("template_shells")
      .select("id")
      .limit(1)
      .single();

    if (!shell) {
      return NextResponse.json({ error: "No template shell found in database" }, { status: 500 });
    }

    const businessName = body.businessName || lead.business_name || "Your Business";
    const industry = body.industry || lead.industry || "Strategic Services";
    const city = body.city || "Local Area";
    const phone = body.phone || lead.phone || "(631) 637-2772";
    const email = body.email || lead.email || "hello@example.com";
    const founder = body.founder || "Founder";
    const heroImage = body.heroImage || "";
    const logoUrl = body.logoUrl || null;
    const primaryColor = body.primaryColor || "#533AFD";
    const accentColor = body.accentColor || "#FFD12D";

    const servicesList: string[] = Array.isArray(body.services) && body.services.length > 0
      ? body.services
      : [
          "Core Service 1",
          "Core Service 2",
          "Core Service 3",
          "Core Service 4",
          "Core Service 5",
          "Core Service 6",
        ];

    const areasList: string[] = [
      city,
      "Surrounding Metro",
      "Regional Area",
      "United States",
    ];

    // 1. Generate High-Converting Funnel Sections
    const generatedSections: FunnelPageSection[] = [
      {
        slug: "hero",
        kind: "hero",
        h2: `#1 RATED ${industry.toUpperCase()} IN ${city.toUpperCase()}`,
        body_content: `We help established businesses eliminate bottlenecks, build scalable systems, and turn attention into qualified customers.`,
        media_asset_ids: [],
        cta: "Request a Free Quote",
        variant_props: {
          image_url: heroImage,
          founder_name: founder,
          phone,
          rating: 5.0,
          review_count: 200,
        },
      },
      ...servicesList.slice(0, 6).map((serviceName, index) => {
        const slug = slugifyText(serviceName);
        return {
          slug,
          kind: "service" as const,
          h2: serviceName,
          body_content: `Comprehensive ${serviceName.toLowerCase()} solutions tailored to your exact business goals, with transparent scoping, expert execution, and guaranteed results.`,
          media_asset_ids: [],
          cta: `Explore ${serviceName}`,
          variant_props: {
            service_index: index + 1,
            price_estimate: index === 0 ? "Featured Service" : "Specialized Solution",
          },
          long_body_content: `Our dedicated team in ${city} provides end-to-end strategy, execution, and ongoing support for ${serviceName.toLowerCase()} to ensure maximum ROI.`,
        };
      }),
      ...areasList.map((areaName) => {
        const slug = slugifyText(areaName);
        return {
          slug: `area-${slug}`,
          kind: "area" as const,
          h2: areaName,
          body_content: `Serving businesses across ${areaName} with priority service dispatch and high-performance customer satisfaction.`,
          media_asset_ids: [],
          cta: `Contact in ${areaName}`,
        };
      }),
      {
        slug: "differentiator",
        kind: "differentiator",
        h2: `Why Choose ${businessName}`,
        body_content: `We don't sell generic templates or billable hours. We deliver measurable outcomes: reliable execution, clear communication, and guaranteed satisfaction.`,
        media_asset_ids: [],
        cta: "Get a Free Estimate",
      },
      {
        slug: "faq-1",
        kind: "faq",
        h2: `How does the process work with ${businessName}?`,
        body_content: `We start with a clear consultation to understand your requirements, provide upfront pricing, and complete the work with full warranty protection.`,
        media_asset_ids: [],
        cta: null,
      },
      {
        slug: "faq-2",
        kind: "faq",
        h2: `How quickly can we get started?`,
        body_content: `Our team begins discovery immediately and delivers your custom live solution within 48 to 72 hours.`,
        media_asset_ids: [],
        cta: null,
      },
      {
        slug: "faq-3",
        kind: "faq",
        h2: `Do you provide emergency or same-day service?`,
        body_content: `Yes, we maintain priority response channels for urgent inquiries across ${city}.`,
        media_asset_ids: [],
        cta: null,
      },
    ];

    // 2. Save Extracted Assets & Verified Brand Tokens
    const extractedAssets = {
      branding: {
        colors: { primary: primaryColor, secondary: "#0D1738", accent: accentColor },
        logo: logoUrl,
        typography: { primaryFont: "Outfit", secondaryFont: "Inter" },
      },
      hero_cutout: heroImage,
      services_list: servicesList,
      areas_list: areasList,
      founder_name: founder,
      city,
      industry,
      custom_generated_at: new Date().toISOString(),
      generated_by: user.email,
    };

    // 3. Upsert Artifacts (including required template_shell_id and accountId)
    const { error: artifactErr } = await admin
      .from("artifacts")
      .upsert(
        {
          lead_id: leadId,
          template_shell_id: shell.id,
          funnel_pages: generatedSections,
          extracted_assets: extractedAssets,
          inner_pages_built: true,
          qa_status: "pending",
          last_edited_at: new Date().toISOString(),
          last_edited_by: accountId,
        },
        { onConflict: "lead_id" }
      );

    if (artifactErr) {
      console.error("[generate-api] artifact upsert error:", artifactErr);
      return NextResponse.json({ error: artifactErr.message }, { status: 500 });
    }

    // 4. Update Lead Record
    await admin
      .from("leads")
      .update({
        business_name: businessName,
        industry,
        phone,
        email,
        status: "qa_pending",
      })
      .eq("id", leadId);

    return NextResponse.json({
      ok: true,
      leadId,
      slug: lead.slug,
      sectionsCount: generatedSections.length,
      areasCount: areasList.length,
    });
  } catch (err: any) {
    console.error("[generate-api] failed", err);
    return NextResponse.json({ error: err?.message || "Generation failed" }, { status: 500 });
  }
}
