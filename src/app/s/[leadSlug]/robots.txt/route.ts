import { NextResponse } from "next/server";
import { getSiteData } from "@/lib/get-site-data";

// Defense-in-depth alongside the route-level 404 gate in
// services/[slug]/page.tsx and areas/[slug]/page.tsx (plan §6): even if a
// crawler somehow finds a leaked pre-payment link, it's told not to index it.
export async function GET(_req: Request, { params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  const base = `/s/${leadSlug}`;

  const lines = ["User-agent: *", "Allow: /"];
  if (!result?.payload.innerPagesBuilt) {
    lines.push(`Disallow: ${base}/services/`, `Disallow: ${base}/areas/`);
  }
  lines.push(`Sitemap: ${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${base}/sitemap.xml`);

  return new NextResponse(lines.join("\n"), { headers: { "Content-Type": "text/plain" } });
}
