// Node (Fluid Compute), not edge.
//
// This route hit the 1 MB edge bundle ceiling and the DEPLOY failed — the
// build itself was fine, which is why the error was not in the build log.
// Edge is the wrong trade here anyway: Fluid Compute runs in the same regions
// at the same price, reuses instances so cold starts are comparable, and has
// no 1 MB wall to trip over as the tenant and vertical registries grow.
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSiteData } from "@/lib/get-site-data";
import { BespokeSiteNav, BespokeSiteFooter } from "@/components/site-shell/BespokeChrome";
import { LegalPageTemplate } from "@/components/site-shell/pages/LegalPageTemplate";
import { siteRootStyle } from "@/components/site-shell/shell-style";
import { isAdminSession } from "@/lib/is-admin-session";

// Same §6 gate as every other inner page -- see privacy/page.tsx and
// LegalPageTemplate for why static boilerplate is the right call here.
export async function generateMetadata({ params }: { params: Promise<{ leadSlug: string }> }): Promise<Metadata> {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result || !result.payload.innerPagesBuilt) return {};
  return {
    title: `Terms of Service | ${result.payload.businessName}`,
    alternates: { canonical: `/s/${leadSlug}/terms` },
  };
}

export default async function TermsPage({ params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) notFound();
  if (!result.payload.innerPagesBuilt && !(await isAdminSession())) redirect(`/s/${leadSlug}`);

  const { payload } = result;

  return (
    <div style={siteRootStyle(payload)}>
      <BespokeSiteNav payload={payload} />
      <LegalPageTemplate payload={payload} kind="terms" />
      <BespokeSiteFooter payload={payload} />
    </div>
  );
}
