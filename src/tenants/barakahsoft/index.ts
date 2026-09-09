import type { Tenant } from "@/tenants/types";

/**
 * The platform tenant, and the fallback for any host that resolves to nothing.
 *
 * Every value here is the constant it replaces — the same logo URL, phone,
 * addresses and analytics ids that were compiled into a dozen components — so
 * barakahsoft.com renders exactly as it did before tenants existed.
 */
export const barakahsoft: Tenant = {
  slug: "barakahsoft",
  primaryHost: "barakahsoft.com",
  extraHosts: [
    "www.barakahsoft.com",
    "home.barakahsoft.com",
    "redesign.barakahsoft.com",
    "portal.barakahsoft.com",
    "localhost",
  ],
  siteBaseUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://redesign.barakahsoft.com",
  portalBaseUrl: process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.barakahsoft.com",
  isDefault: true,

  brand: {
    name: "BarakahSoft",
    legalEntity: "BarakahSoft LLC",
    jurisdiction: "Wyoming, USA",
    logoUrl: "https://barakahsoft.com/wp-content/uploads/2026/01/Logo1.png",
    // Served from public/, so it stays fast and needs no remote host allowance.
    iconUrl: "/icon.png",
    // The indigo the app theme is built around. The landing CTA was a
    // separate hardcoded yellow; the nav now follows this, which is the
    // colour the rest of the platform UI already uses.
    primaryHsl: "249 97% 61%",
    phoneDisplay: "+1 (307) 533-6678",
    phoneE164: "+13075336678",
    supportEmail: "hello@barakahsoft.com",
    fromEmail: process.env.BREVO_SENDER_EMAIL || process.env.RESEND_FROM_EMAIL || "hello@barakahsoft.com",
    senderName: process.env.SENDER_NAME || "BarakahSoft",
    emailSignature: "BarakahSoft LLC · Direct Line: +1 (307) 533-6678 · hello@barakahsoft.com",
    analytics: {
      crispId: "28d857ed-70f3-4edf-bba4-e23a1e627d00",
      metaPixelId: "1777973306713413",
      clarityId: "y86f9mlgdd",
    },
  },

  // The only tenant that may charge through the platform Stripe account: it
  // owns it. The descriptor, the balance and the legal entity named at
  // checkout are all this one's.
  commerce: {
    mode: "stripe",
    statementDescriptor: "BARAKAHSOFT",
    primaryActionLabel: "Start my selected plan",
  },

  landing: {
    audience: "Home-services businesses in the US and UK, reached by cold outreach and paid social.",
    contact: {
      addressLines: ["30 N. Gould St. Ste R", "Sheridan, WY 82801"],
    },
    heroVideoUrl:
      "https://liepxeeugfrxmidcmbxo.supabase.co/storage/v1/object/public/landing/barakahsoft-hero.mp4",
    team: [
      {
        name: "Shakil Ahmed",
        role: "Founder · Research and design direction",
        photoUrl: "https://barakahsoft.com/wp-content/uploads/2026/07/Shak-Headshot-Medium.jpeg",
        bio: "I own the audit, category research, redesign direction, and final quality of what reaches your business.",
      },
      {
        name: "Jim Sabellico",
        role: "Client relations · Communication & support",
        photoUrl: "https://barakahsoft.com/wp-content/uploads/2026/07/Jim-Headshot-Medium.jpeg",
        bio: "I keep communication clear, make sure the concept reaches you, and help you understand the simplest next step.",
      },
    ],
    examples: [],
    faq: [],
  },
};
