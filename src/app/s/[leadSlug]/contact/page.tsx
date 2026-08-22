import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Phone, Mail, MapPin } from "lucide-react";
import { getSiteData } from "@/lib/get-site-data";
import { MegaMenu } from "@/components/site-shell/MegaMenu";
import { PremiumFooter } from "@/components/site-shell/PremiumFooter";
import { BookingForm } from "@/components/site-shell/BookingForm";
import { getShellStyle } from "@/components/site-shell/shell-style";
import { BespokePageBody } from "@/components/site-shell/BespokePage";
import { breadcrumbSchema } from "@/lib/seo/breadcrumb-schema";
import { isAdminSession } from "@/lib/is-admin-session";

// Same §6 gate as services/[slug] and areas/[slug] — a real route that
// 404s/redirects pre-payment, unlocked by the same inner_pages_built flag.
export async function generateMetadata({ params }: { params: Promise<{ leadSlug: string }> }): Promise<Metadata> {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result || !result.payload.innerPagesBuilt) return {};
  return {
    title: `Contact | ${result.payload.businessName}`,
    alternates: { canonical: `/s/${leadSlug}/contact` },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) notFound();
  if (!result.payload.innerPagesBuilt && !(await isAdminSession())) redirect(`/s/${leadSlug}#contact`);

  const { payload } = result;
  const breadcrumb = breadcrumbSchema(leadSlug, payload.businessName, [{ name: "Contact", path: "/contact" }]);

  return (
    <div style={getShellStyle(payload)}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <MegaMenu payload={payload} />

      {/* Generated contact content renders ABOVE the booking form rather
          than replacing it: <form> is stripped from generated markup by the
          sanitizer (correctly -- a model-authored form posts nowhere), so
          replacing this section would cost the page its only working
          conversion path. */}
      {payload.bespokePages["contact"] && (
        <BespokePageBody payload={payload} html={payload.bespokePages["contact"]} />
      )}

      <section className="py-16">
        <div className="mx-auto grid max-w-5xl gap-10 px-6 lg:grid-cols-2">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Get in touch</h1>
            <p className="mt-2 text-muted-foreground">Reach {payload.businessName} directly, or send a booking request.</p>

            <div className="mt-8 space-y-4">
              {payload.nap.phone && (
                <a href={`tel:${payload.nap.phone}`} className="flex items-center gap-3 text-sm font-medium hover:text-primary">
                  <Phone className="h-5 w-5 text-primary" /> {payload.nap.phone}
                </a>
              )}
              {payload.nap.email && (
                <a href={`mailto:${payload.nap.email}`} className="flex items-center gap-3 text-sm font-medium hover:text-primary">
                  <Mail className="h-5 w-5 text-primary" /> {payload.nap.email}
                </a>
              )}
              {payload.nap.address && (
                <p className="flex items-start gap-3 text-sm">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> {payload.nap.address}
                </p>
              )}
            </div>
          </div>

          <BookingForm payload={payload} />
        </div>
      </section>

      <PremiumFooter payload={payload} />
    </div>
  );
}
