import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

const LOGO_URL = "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png";
const SITE_URL = "https://home.barakahsoft.com";
const TITLE = "BarakahSoft — free AI-redesigned homepage for your business";
const DESCRIPTION = "Paste your URL. In 48 hours you get a studio-quality homepage redesign built from your own photos and real business info — free to look at, no card required.";

// Product-Hunt-ready metadata: real OG/Twitter card image + description
// (previously just a bare title/description, no icons block at all) so a
// shared link or a PH submission card renders the real logo, not a blank
// preview.
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
      <body className="min-h-screen bg-white font-sans text-slate-900 antialiased">{children}</body>
    </html>
  );
}
