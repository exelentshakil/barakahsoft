import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
    const businessName = body.businessName || lead.business_name || "Your Business";
    const industry = body.industry || lead.industry || "Strategic Services";
    const city = body.city || "Local Area";
    const phone = body.phone || lead.phone || "(631) 637-2772";
    const email = body.email || lead.email || "hello@example.com";
    const founder = body.founder || "Founder";
    const heroImage = body.heroImage || "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80";
    const logoUrl = body.logoUrl || null;
    const primaryColor = body.primaryColor || "#533AFD";
    const accentColor = body.accentColor || "#FFD12D";
    const servicesList: string[] = Array.isArray(body.services) && body.services.length > 0
      ? body.services
      : ["Core Service 1", "Core Service 2", "Core Service 3", "Core Service 4", "Core Service 5", "Core Service 6"];

    // 1. Build high-converting funnel sections
    const generatedSections: FunnelPageSection[] = [
      {
        slug: "hero",
        kind: "hero",
        h2: `#1 RATED ${industry.toUpperCase()} IN ${city.toUpperCase()}`,
        body_content: `We help established businesses eliminate bottlenecks, build scalable systems, and turn attention into qualified customers.`,
        media_asset_ids: [],
        cta: "Request a Free Strategy Session",
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
            price_estimate: index === 0 ? "Custom Solution" : "$1,000+",
          },
          long_body_content: `Our dedicated ${serviceName.toLowerCase()} team in ${city} provides end-to-end strategy, execution, and ongoing support to ensure maximum ROI and zero operational friction.`,
        };
      }),
      {
        slug: "differentiator",
        kind: "differentiator",
        h2: `Why Businesses Choose ${businessName}`,
        body_content: `We don't sell generic templates or billable hours. We deliver measurable outcomes: scalable systems, high-converting customer journeys, and reclaimed time.`,
        media_asset_ids: [],
        cta: "Get Started",
      },
      {
        slug: "faq-1",
        kind: "faq",
        h2: `How does the process work with ${businessName}?`,
        body_content: `We start with a diagnostic strategy conversation to identify your biggest operational bottleneck, design the custom system, and implement it with full ongoing support.`,
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
    ];

    // 2. Save extracted assets & branding
    const extractedAssets = {
      branding: {
        colors: { primary: primaryColor, secondary: "#0D1738", accent: accentColor },
        logo: logoUrl,
        typography: { primaryFont: "Outfit", secondaryFont: "Inter" },
      },
      hero_cutout: heroImage,
      services_list: servicesList,
      founder_name: founder,
      city,
      industry,
      custom_generated_at: new Date().toISOString(),
      generated_by: user.email,
    };

    // 3. Upsert artifacts
    await admin
      .from("artifacts")
      .upsert(
        {
          lead_id: leadId,
          funnel_pages: generatedSections,
          extracted_assets: extractedAssets,
          inner_pages_built: true,
          qa_status: "pending",
          last_edited_at: new Date().toISOString(),
          last_edited_by: user.id,
        },
        { onConflict: "lead_id" }
      );

    // 4. Update lead details
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
    });
  } catch (err) {
    console.error("[generate-api] failed", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
