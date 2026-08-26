import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { CookieConsent } from "@/components/landing/CookieConsent";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

const LOGO_URL = "/icon.png";
const SITE_URL = "https://home.barakahsoft.com";
const TITLE = "Free Homepage Redesign & Local AI Search Audit | BarakahSoft";
const DESCRIPTION = "Get a free, human-reviewed homepage redesign & Queens/NYC search audit built from your real business, branding, and services. No card and no obligation.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  icons: { icon: LOGO_URL, shortcut: LOGO_URL, apple: LOGO_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "BarakahSoft",
    images: [{ url: LOGO_URL }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [LOGO_URL],
  },
};

export const viewport: Viewport = {
  themeColor: "#4338ca",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        


        
      </head>
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased">
        {/* Meta Pixel for Facebook Ads */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1777973306713413');
fbq('track', 'PageView');`}
        </Script>
        {/* Microsoft Clarity Analytics & Heatmaps (Restricted to main landing page only) */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
        try {
          var h = window.location.hostname.toLowerCase();
          var p = window.location.pathname;
          if (p.indexOf("/admin") === 0 || p.indexOf("/client-portal") === 0 || p.indexOf("/visual-qa") === 0 || p.indexOf("/api") === 0 || p.indexOf("/auth") === 0 || p.indexOf("/login") === 0) {
            return;
          }
          var isLandingHost = h === "redesign.barakahsoft.com" || h === "barakahsoft.com" || h === "www.barakahsoft.com" || h === "home.barakahsoft.com";
          var isLandingPath = p === "/";
          if (!isLandingHost || !isLandingPath) {
            return;
          }
        } catch(e) { return; }
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "y86f9mlgdd");`}
        </Script>
        {/* Meta Pixel Fallback */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1777973306713413&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
