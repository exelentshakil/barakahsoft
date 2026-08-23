import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminSession } from "@/lib/is-admin-session";
import { getSiteData } from "@/lib/get-site-data";
import { buildSiteFiles } from "@/lib/export/build-site-zip";
import { pushSiteToGitHub } from "@/lib/export/push-to-github";
import type { Lead } from "@/types/database";

// Hand the site over as a repository the client can host anywhere.
//
// Same files as the zip download — see buildSiteFiles — so whichever way a
// client takes delivery they get the same site.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  if (!(await isAdminSession())) return NextResponse.json({ error: "Not authorised" }, { status: 401 });

  const admin = createAdminClient();
  const { data: lead } = await admin.from("leads").select("*").eq("id", leadId).single<Lead>();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const siteData = await getSiteData(lead.slug);
  if (!siteData?.payload?.bespokeHomepageHtml) {
    return NextResponse.json(
      { error: "No homepage has been generated for this lead yet — build it first." },
      { status: 409 }
    );
  }

  try {
    const files = await buildSiteFiles(lead, siteData.payload);
    const result = await pushSiteToGitHub(files, {
      repo: `${lead.slug}-website`,
      description: `${siteData.payload.businessName || lead.business_name || lead.slug} — website`,
    });

    // Recorded so the operator can find the repository again without
    // going looking for it on GitHub.
    await admin
      .from("artifacts")
      .update({ extracted_assets: { ...(siteData.artifact?.extracted_assets ?? {}), github_repo_url: result.repoUrl } })
      .eq("lead_id", leadId);

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not push to GitHub";
    console.error("[github] push failed", err);
    // A name collision is the common case and the operator can fix it, so
    // it is reported as a conflict rather than a server fault.
    const status = /already exists|name already/i.test(message) ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
