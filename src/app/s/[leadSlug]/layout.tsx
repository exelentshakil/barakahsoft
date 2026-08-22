import Script from "next/script";
import "@/app/bespoke.css";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteData } from "@/lib/get-site-data";
import { QuoteModalProvider } from "@/components/site-shell/QuoteModalProvider";
import { TrackPhoneClicks } from "@/components/site-shell/TrackPhoneClicks";

// Injects the CLIENT's own Facebook Pixel (leads.facebook_pixel_id) on
// every delivered-site page under this segment — explicitly separate from
// BarakahSoft's own pixel (src/lib/meta-pixel.ts, which tracks the lead-gen
// intake funnel on the marketing site, never here). Nothing renders when
// unset, which is true for most leads until the client provides one.
// A lightweight query (just the pixel ID column), not the full
// getSiteData() each page already does independently.
//
// Also mounts QuoteModalProvider here (needs the full payload, so a second
// getSiteData call) so every "Get a free quote" CTA across every page
// under this segment shares one modal instance instead of each page
// managing its own dialog state.
export default async function LeadSiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ leadSlug: string }>;
}) {
  const { leadSlug } = await params;
  const admin = createAdminClient();
  const [{ data: lead }, siteData] = await Promise.all([
    admin.from("leads").select("facebook_pixel_id, google_site_verification").eq("slug", leadSlug).single(),
    getSiteData(leadSlug),
  ]);
  const pixelId = lead?.facebook_pixel_id;
  const gscToken = lead?.google_site_verification;

  // The display/body faces come from this lead's design DNA, so the
  // stylesheet is per-lead and belongs here rather than in the root layout.
  const fontHref = siteData?.payload.designTokens?.fontHref ?? null;

  const body = (
    <>
      {fontHref && <link rel="stylesheet" href={fontHref} precedence="default" />}
      {gscToken && <meta name="google-site-verification" content={gscToken} />}
      {pixelId && (
        <Script id="client-facebook-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`}
        </Script>
      )}
      <TrackPhoneClicks leadSlug={leadSlug} />
      {children}
    </>
  );

  return siteData ? <QuoteModalProvider payload={siteData.payload}>{body}</QuoteModalProvider> : body;
}
