import { NextResponse } from "next/server";
import { getSiteData } from "@/lib/get-site-data";

// A plain route handler rather than Next's sitemap.ts metadata-file
// convention — that convention's support for per-lead dynamic segments is
// ambiguous across Next.js versions, and a route handler is guaranteed to
// receive params correctly regardless. Homepage-only pre-payment; full
// route set once inner_pages_built flips (plan §6).
export async function GET(req: Request, { params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) return new NextResponse("Not found", { status: 404 });

  // v4 Phase P1 — a Search-Console-valid sitemap has to list URLs on the
  // lead's own real domain once it's live, not the shared /s/[leadSlug]
  // path under BarakahSoft's own domain (defeats the whole point of a
  // custom domain otherwise). The incoming host tells us which case this
  // request actually is — middleware only ever forwards a custom-domain
  // request here with the real host header intact.
  const host = req.headers.get("host")?.split(":")[0] ?? "";
  const onCustomDomain = !!result.lead.custom_domain && host === result.lead.custom_domain;
  const base = onCustomDomain
    ? `https://${result.lead.custom_domain}`
    : `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/s/${leadSlug}`;
  const urls = [base];

  if (result.payload.innerPagesBuilt) {
    for (const service of result.payload.services) urls.push(`${base}/services/${service.slug}`);
    urls.push(`${base}/contact`, `${base}/booking`, `${base}/about`, `${base}/faq`, `${base}/privacy`, `${base}/terms`);

    // v3 (Phase L) -- only real once enrich-expand.ts has actually run and
    // found real extractable area names, same gate the route itself uses.
    // v4 -- areas/[slug] moved here too: it now aggregates location-service
    // pages for real content, so it needs the same fullSiteBuilt gate the
    // page itself checks (the area *name* is visible on the homepage from
    // the fast pass, but its own page has nothing real to show until
    // expansion has run).
    if (result.payload.fullSiteBuilt) {
      for (const area of result.payload.areas) urls.push(`${base}/areas/${area.slug}`);
      for (const section of result.payload.locationServices) urls.push(`${base}/locations/${section.slug}`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;

  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
}
