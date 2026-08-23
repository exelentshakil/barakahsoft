import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { getSiteData } from "@/lib/get-site-data";
import { buildSiteZip } from "@/lib/export/build-site-zip";
import type { Lead } from "@/types/database";

// The handover: the client's real site, as a folder they own.
//
// Admin-only. The previous version had no session check at all, so anyone
// who knew a lead id could download that lead's site and contact details.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const admin = createAdminClient();
  const { data: lead } = await admin.from("leads").select("*").eq("id", leadId).single<Lead>();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const siteData = await getSiteData(lead.slug);
  if (!siteData?.payload) {
    return NextResponse.json({ error: "This lead has no site data yet." }, { status: 409 });
  }

  // Exporting before a page exists produced a zip containing chrome around
  // an empty middle — a folder that builds and shows nothing. Refusing says
  // what to do instead.
  if (!siteData.payload.bespokeHomepageHtml) {
    return NextResponse.json(
      { error: "No homepage has been generated for this lead yet — build it first, then export." },
      { status: 409 }
    );
  }

  const zip = await buildSiteZip(lead, siteData.payload);

  return new NextResponse(new Uint8Array(zip), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${lead.slug}-website.zip"`,
    },
  });
}
