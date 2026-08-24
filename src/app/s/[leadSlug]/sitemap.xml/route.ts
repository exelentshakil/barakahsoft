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
    for (const service of result.payload.navigation.services) urls.push(`${base}${service.path}`);
    for (const area of result.payload.navigation.areas) urls.push(`${base}${area.path}`);
    for (const page of ["about", "faq", "contact"]) {
      if (result.payload.bespokePages[page]) urls.push(`${base}/${page}`);
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;

  return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } });
}
