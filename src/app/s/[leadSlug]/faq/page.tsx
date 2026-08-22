import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSiteData } from "@/lib/get-site-data";
import { BespokeNav } from "@/components/site-shell/BespokeNav";
import { BespokeFooter } from "@/components/site-shell/BespokeFooter";
import { FaqTemplate } from "@/components/site-shell/pages/FaqTemplate";
import { siteRootStyle } from "@/components/site-shell/shell-style";
import { BespokePageBody } from "@/components/site-shell/BespokePage";
import { breadcrumbSchema } from "@/lib/seo/breadcrumb-schema";
import { isAdminSession } from "@/lib/is-admin-session";

// Same §6 gate as contact/services/areas -- the same real FAQ content
// already generated for the homepage anchor section, as its own page.
export async function generateMetadata({ params }: { params: Promise<{ leadSlug: string }> }): Promise<Metadata> {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result || !result.payload.innerPagesBuilt) return {};
  return {
    title: `FAQ | ${result.payload.businessName}`,
    alternates: { canonical: `/s/${leadSlug}/faq` },
  };
}

export default async function FaqPage({ params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) notFound();
  if (!result.payload.innerPagesBuilt && !(await isAdminSession())) redirect(`/s/${leadSlug}#faq`);

  const { payload } = result;
  const breadcrumb = breadcrumbSchema(leadSlug, payload.businessName, [{ name: "FAQ", path: "/faq" }]);

  return (
    <div style={siteRootStyle(payload)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <BespokeNav payload={payload} spec={payload.chromeSpec} />
      {payload.bespokePages["faq"] ? (
        <BespokePageBody html={payload.bespokePages["faq"]} />
      ) : (
        <FaqTemplate payload={payload} />
      )}
      <BespokeFooter payload={payload} spec={payload.chromeSpec} />
    </div>
  );
}
