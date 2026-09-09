import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { CookieConsent } from "@/components/landing/CookieConsent";
import "./globals.css";
import { getTenant } from "@/lib/tenant";
import { brandChannels, brandStyle } from "@/lib/brand-style";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

const LOGO_URL = "/icon.png";
const DESCRIPTION =
  "Get a free, human-reviewed homepage redesign and local search audit built from your real business, branding and services. No card and no obligation.";

/**
 * Metadata is generated per request rather than exported as a static object,
 * because the title, canonical origin and site name all belong to whichever
 * brand's domain this request arrived on. A static object cannot read
 * headers(), so a partner's domain would have served BarakahSoft's title and
 * OG tags to every crawler that visited it.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { brand, siteBaseUrl } = await getTenant();
  const title = `Free Homepage Redesign & Local Search Audit | ${brand.name}`;

  return {
    metadataBase: new URL(siteBaseUrl),
    title,
    description: DESCRIPTION,
    icons: { icon: LOGO_URL, shortcut: LOGO_URL, apple: LOGO_URL },
    openGraph: {
      title,
      description: DESCRIPTION,
      url: siteBaseUrl,
      siteName: brand.name,
      images: [{ url: LOGO_URL }],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description: DESCRIPTION, images: [LOGO_URL] },
  };
}

/**
 * The browser chrome colour on mobile.
 *
 * Generated per request for the same reason the metadata is: on a partner's
 * domain, the address bar tinting itself the platform's indigo is a small
 * detail that reads as a mistake.
 */
export async function generateViewport(): Promise<Viewport> {
  const { brand } = await getTenant();
  return { themeColor: `hsl(${brandChannels(brand.primaryHsl).h} ${brandChannels(brand.primaryHsl).s} ${brandChannels(brand.primaryHsl).l})` };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getTenant();
  const { analytics } = tenant.brand;

  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`} style={brandStyle(tenant.brand.primaryHsl)}>
      <head>
        


        
        {/*
          Analytics belong to whichever brand's domain this is.
          
          These were two hardcoded ids guarded by a hardcoded list of
          barakahsoft.com hostnames. That happened to keep the platform's pixel
          off a partner's domain, but by coincidence rather than by design — the
          moment a host was added to one list and not the other, a partner's
          visitors would have been reported into the platform's ad account.
          
          Now nothing renders unless THIS tenant has configured an id, and the
          only runtime check left is the one that is genuinely about the page
          rather than the brand: operator and internal routes are not measured.
        */}
        {analytics?.metaPixelId && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`(function() {
  try {
    var p = window.location.pathname;
    if (p !== "/") throw new Error('skip_pixel');
  } catch(e) { window.fbq = function(){}; return; }

!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${JSON.stringify(analytics.metaPixelId)});
fbq('track', 'PageView');
})();`}
          </Script>
        )}
      </head>
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased">
        {analytics?.metaPixelId && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${encodeURIComponent(analytics.metaPixelId)}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}

        {analytics?.clarityId && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){
        if (window.location.pathname !== "/") return;
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", ${JSON.stringify(analytics.clarityId)});`}
          </Script>
        )}
        
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
