import { NextResponse } from "next/server";
import { getSiteData } from "@/lib/get-site-data";

// Defense-in-depth alongside the route-level 404 gate in
// services/[slug]/page.tsx and areas/[slug]/page.tsx (plan §6): even if a
// crawler somehow finds a leaked pre-payment link, it's told not to index it.
export async function GET(req: Request, { params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);

  // v4 Phase P1 — same custom-domain-aware path logic as sitemap.xml: on
  // the lead's own domain, paths are already rooted at "/" (middleware
  // rewrite is transparent to the crawler), not "/s/[leadSlug]/...".
  const host = req.headers.get("host")?.split(":")[0] ?? "";
  const onCustomDomain = !!result?.lead.custom_domain && host === result.lead.custom_domain;
  const pathBase = onCustomDomain ? "" : `/s/${leadSlug}`;
  const sitemapOrigin = onCustomDomain
    ? `https://${result!.lead.custom_domain}`
    : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const lines = ["User-agent: *", "Allow: /"];
  if (!result?.payload.innerPagesBuilt) {
    lines.push(`Disallow: ${pathBase}/services/`, `Disallow: ${pathBase}/areas/`);
  }
  lines.push(`Sitemap: ${sitemapOrigin}${pathBase}/sitemap.xml`);

  return new NextResponse(lines.join("\n"), { headers: { "Content-Type": "text/plain" } });
}
