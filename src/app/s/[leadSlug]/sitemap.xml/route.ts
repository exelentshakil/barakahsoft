import { NextResponse } from "next/server";
import { getSiteData } from "@/lib/get-site-data";

// A plain route handler rather than Next's sitemap.ts metadata-file
// convention — that convention's support for per-lead dynamic segments is
// ambiguous across Next.js versions, and a route handler is guaranteed to
// receive params correctly regardless. Homepage-only pre-payment; full
// route set once inner_pages_built flips (plan §6).
export async function GET(_req: Request, { params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) return new NextResponse("Not found", { status: 404 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const base = `${siteUrl}/s/${leadSlug}`;
  const urls = [base];

  if (result.payload.innerPagesBuilt) {
    for (const service of result.payload.services) urls.push(`${base}/services/${service.slug}`);
    for (const area of result.payload.areas) urls.push(`${base}/areas/${area.slug}`);
    urls.push(`${base}/contact`, `${base}/booking`, `${base}/about`, `${base}/faq`, `${base}/privacy`, `${base}/terms`);

    // v3 (Phase L) -- only real once enrich-expand.ts has actually run and
    // found real extractable area names, same gate the route itself uses.
    if (result.payload.fullSiteBuilt) {
      for (const section of result.payload.locationServices) urls.push(`${base}/locations/${section.slug}`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;

  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
}
