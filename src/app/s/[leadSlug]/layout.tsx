import Script from "next/script";
import { createAdminClient } from "@/lib/supabase/admin";

// Injects the CLIENT's own Facebook Pixel (leads.facebook_pixel_id) on
// every delivered-site page under this segment — explicitly separate from
// BarakahSoft's own pixel (src/lib/meta-pixel.ts, which tracks the lead-gen
// intake funnel on the marketing site, never here). Nothing renders when
// unset, which is true for most leads until the client provides one.
// A lightweight query (just the pixel ID column), not the full
// getSiteData() each page already does independently.
export default async function LeadSiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ leadSlug: string }>;
}) {
  const { leadSlug } = await params;
  const admin = createAdminClient();
  const { data: lead } = await admin.from("leads").select("facebook_pixel_id").eq("slug", leadSlug).single();
  const pixelId = lead?.facebook_pixel_id;

  return (
    <>
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
      {children}
    </>
  );
}
