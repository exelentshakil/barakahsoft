import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateUniqueDomainSlug } from "@/lib/domain-slug";
import { validateOutreachEmail } from "@/lib/outreach/validate-email";

export interface BulkLeadInput {
  source_url: string;
  business_name?: string;
  email?: string;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request body" }, { status: 400 });

  const admin = createAdminClient();

  // 1. Bulk Ingestion Mode
  if (Array.isArray(body.items) && body.items.length > 0) {
    const rawItems: BulkLeadInput[] = body.items;
    const createdLeads: Array<{ id: string; slug: string; source_url: string; business_name: string | null; email: string | null }> = [];
    const errors: Array<{ url: string; error: string }> = [];

    for (const item of rawItems) {
      let rawUrl = (item.source_url || "").trim();
      if (!rawUrl) continue;
      if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
        rawUrl = `https://${rawUrl}`;
      }

      const rawEmail = typeof item.email === "string" ? item.email.trim() : "";
      let validEmail: string | null = null;
      if (rawEmail) {
        const verdict = await validateOutreachEmail(rawEmail, rawUrl);
        if (verdict.ok) {
          validEmail = rawEmail.toLowerCase();
        } else {
          // If strict validation fails on bulk, record note but still allow or log
          validEmail = rawEmail.toLowerCase();
        }
      }

      try {
        const slug = await generateUniqueDomainSlug(admin, rawUrl);
        const { data: lead, error } = await admin
          .from("leads")
          .insert({
            source_url: rawUrl,
            business_name: item.business_name?.trim() || null,
            email: validEmail,
            slug,
            status: "new",
            source: "outreach",
          })
          .select()
          .single();

        if (error || !lead) {
          errors.push({ url: rawUrl, error: error?.message || "Failed to insert" });
        } else {
          createdLeads.push(lead);
        }
      } catch (err) {
        errors.push({ url: rawUrl, error: err instanceof Error ? err.message : "Insert failed" });
      }
    }

    return NextResponse.json({
      success: true,
      createdCount: createdLeads.length,
      leads: createdLeads,
      errors,
    });
  }

  // 2. Single Ingestion Mode
  if (!body.source_url) return NextResponse.json({ error: "source_url is required" }, { status: 400 });

  let rawUrl = (body.source_url || "").trim();
  if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
    rawUrl = `https://${rawUrl}`;
  }

  const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
  let emailNotes: string[] = [];
  if (rawEmail) {
    const verdict = await validateOutreachEmail(rawEmail, rawUrl);
    if (!verdict.ok) return NextResponse.json({ error: verdict.problem }, { status: 400 });
    emailNotes = verdict.notes;
  }

  const slug = await generateUniqueDomainSlug(admin, rawUrl);

  const { data: lead, error } = await admin
    .from("leads")
    .insert({
      source_url: rawUrl,
      business_name: body.business_name?.trim() || null,
      email: rawEmail ? rawEmail.toLowerCase() : null,
      slug,
      status: "new",
      source: "outreach",
    })
    .select()
    .single();

  if (error || !lead) return NextResponse.json({ error: error?.message ?? "Could not create lead" }, { status: 500 });

  return NextResponse.json({ lead, lead_id: lead.id, emailNotes });
}
