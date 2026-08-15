import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getSiteData } from "@/lib/get-site-data";
import { MegaMenu } from "@/components/site-shell/MegaMenu";
import { PremiumFooter } from "@/components/site-shell/PremiumFooter";
import { BookingForm } from "@/components/site-shell/BookingForm";
import { getShellStyle } from "@/components/site-shell/shell-style";

export async function generateMetadata({ params }: { params: Promise<{ leadSlug: string }> }): Promise<Metadata> {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result || !result.payload.innerPagesBuilt) return {};
  return {
    title: `Book now | ${result.payload.businessName}`,
    alternates: { canonical: `/s/${leadSlug}/booking` },
  };
}

// A dedicated booking route (also embedded on /contact) — a real, working
// email-handoff flow with zero scheduling backend, explicitly a
// placeholder for a real booking tool (Calendly etc.) once the client has
// one, per the plan.
export default async function BookingPage({ params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  const result = await getSiteData(leadSlug);
  if (!result) notFound();
  if (!result.payload.innerPagesBuilt) redirect(`/s/${leadSlug}#contact`);

  const { payload } = result;

  return (
    <div style={getShellStyle(payload)}>
      <MegaMenu payload={payload} />

      <section className="py-16">
        <div className="mx-auto max-w-lg px-6">
          <h1 className="text-center font-display text-3xl font-bold tracking-tight">Book with {payload.businessName}</h1>
          <p className="mt-2 text-center text-muted-foreground">Tell us what you need and when — we'll get back to you.</p>
          <div className="mt-8">
            <BookingForm payload={payload} />
          </div>
        </div>
      </section>

      <PremiumFooter payload={payload} />
    </div>
  );
}
