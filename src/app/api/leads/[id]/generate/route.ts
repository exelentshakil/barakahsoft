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
    const businessName = body.businessName || lead.business_name || "HeartCore Growth";
    const industry = body.industry || lead.industry || "AI Integration & Strategic Marketing";
    const city = body.city || "Farmingdale, NY";
    const phone = body.phone || lead.phone || "(631) 637-2772";
    const email = body.email || lead.email || "jim@heartcoregrowth.com";
    const founder = body.founder || "Jim Sabellico";
    const heroImage = body.heroImage || "https://heartcoregrowth.com/public/images/photos/jim-headshot.jpeg";
    const logoUrl = body.logoUrl || "https://heartcoregrowth.com/public/images/logos/hcg-logo.png";
    const primaryColor = body.primaryColor || "#533AFD";
    const accentColor = body.accentColor || "#FFD12D";

    const servicesList: string[] = Array.isArray(body.services) && body.services.length > 0
      ? body.services
      : [
          "Buy Back Your Week",
          "AI Integration",
          "Custom Web Design",
          "SEO Strategy That Works",
          "Business Automation",
          "Growth Coaching",
        ];

    const areasList: string[] = [
      city,
      "Long Island, NY",
      "Nassau County, NY",
      "Suffolk County, NY",
      "New York Metro",
      "United States (Remote)",
    ];

    // 1. Generate High-Converting Funnel Sections
    const generatedSections: FunnelPageSection[] = [
      {
        slug: "hero",
        kind: "hero",
        h2: `TAKE THE BUSY OUT OF BUSYNESS WITH ${businessName.toUpperCase()}`,
        body_content: `We help established business owners eliminate bottlenecks, integrate custom AI systems, and reclaim 8 to 10 hours a week without learning new software.`,
        media_asset_ids: [],
        cta: "Book a Free Strategy Call",
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
          body_content: `Fully managed ${serviceName.toLowerCase()} solutions engineered to remove operational friction, automate client acquisition, and deliver measurable growth.`,
          media_asset_ids: [],
          cta: `Explore ${serviceName}`,
          variant_props: {
            service_index: index + 1,
            price_estimate: index === 0 ? "$1,000 Package" : index === 1 ? "$2,500/mo" : "Custom Solution",
          },
          long_body_content: `Our dedicated team provides end-to-end strategy, technical buildout, and a full month of tuning for ${serviceName.toLowerCase()} so your business runs smoothly without you as the bottleneck.`,
        };
      }),
      ...areasList.map((areaName) => {
        const slug = slugifyText(areaName);
        return {
          slug: `area-${slug}`,
          kind: "area" as const,
          h2: areaName,
          body_content: `Serving businesses across ${areaName} with priority strategy consultations, custom AI integrations, and high-performance marketing systems.`,
          media_asset_ids: [],
          cta: `Contact in ${areaName}`,
        };
      }),
      {
        slug: "differentiator",
        kind: "differentiator",
        h2: `Why Established Businesses Choose ${businessName}`,
        body_content: `Relationships first. We don't sell hours or software tools you have to figure out yourself. We build custom operational systems, train your team, and stick around to guarantee they run clean.`,
        media_asset_ids: [],
        cta: "Start with a Free Strategy Call",
      },
      {
        slug: "faq-1",
        kind: "faq",
        h2: `Do I need to understand AI or technology?`,
        body_content: `Not at all. We handle the entire build and integration behind the scenes. You just tell us where you are stuck, and we build the system that fixes it.`,
        media_asset_ids: [],
        cta: null,
      },
      {
        slug: "faq-2",
        kind: "faq",
        h2: `How long does the implementation take?`,
        body_content: `Most custom systems and websites are delivered and live within 2 to 4 weeks. You see operational time savings and lead follow-up improvements immediately.`,
        media_asset_ids: [],
        cta: null,
      },
      {
        slug: "faq-3",
        kind: "faq",
        h2: `What happens during the initial Strategy Call?`,
        body_content: `A 30-minute diagnostic session with no sales pitch. We look at your business model, find where you are the bottleneck, and outline the fastest way to automate it.`,
        media_asset_ids: [],
        cta: null,
      },
      {
        slug: "faq-4",
        kind: "faq",
        h2: `Can I cancel or adjust services anytime?`,
        body_content: `Yes. All ongoing maintenance and retainer plans are flexible month-to-month with zero long-term hostage contracts.`,
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

    // 3. Upsert Artifacts
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
  } catch (err) {
    console.error("[generate-api] failed", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
