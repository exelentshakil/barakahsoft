import type { Tenant } from "@/tenants/types";

/**
 * KeyGrowth — Brendan's white-label. keygrowth.co.uk
 *
 * TO FINISH SETUP, edit the values marked TODO below, then commit and push.
 * Nothing else in the codebase needs touching to bring a partner live.
 *
 *   1. Add keygrowth.co.uk and www.keygrowth.co.uk to the Vercel project and
 *      point DNS at Vercel's records.
 *   2. Verify keygrowth.co.uk as a sending domain in Brevo (SPF + DKIM) and put
 *      the verified address in brand.fromEmail. Skip this and every email
 *      Brendan sends leaves from hello@barakahsoft.com.
 *   3. insert into accounts (email, tenant_slug, role)
 *        values ('brendan@keygrowth.co.uk', 'keygrowth', 'operator');
 */
export const keygrowth: Tenant = {
  slug: "keygrowth",
  primaryHost: "keygrowth.co.uk",
  extraHosts: ["www.keygrowth.co.uk"],
  siteBaseUrl: "https://keygrowth.co.uk",
  portalBaseUrl: "https://keygrowth.co.uk",

  brand: {
    name: "KeyGrowth",
    legalEntity: "KeyGrowth", // TODO: registered company name, e.g. "KeyGrowth Ltd"
    jurisdiction: "United Kingdom",
    logoUrl: "https://keygrowth.co.uk/logo.png", // TODO
    primaryHsl: "158 64% 38%",
    phoneDisplay: "+44 20 0000 0000", // TODO
    phoneE164: "+442000000000", // TODO
    supportEmail: "hello@keygrowth.co.uk", // TODO
    fromEmail: "hello@keygrowth.co.uk", // TODO: must be verified in Brevo first
    senderName: "KeyGrowth",
    emailSignature: "KeyGrowth · hello@keygrowth.co.uk",
    // Brendan's own analytics, when he has them. Omitted means no tag fires —
    // BarakahSoft's pixel must never load on a partner's domain.
    analytics: {},
  },

  // Enquiry, not Stripe. Brendan closes his own clients at his own price, so
  // the lead has to reach his inbox — a button that charges a Wyoming LLC and
  // pays BarakahSoft is worse than useless to him, and routing a UK client's
  // payment through a US entity is a VAT problem on top of the branding one.
  commerce: {
    mode: "enquiry",
    enquiryEmail: "hello@keygrowth.co.uk", // TODO
    primaryActionLabel: "Request my build",
  },

  landing: {
    audience: "UK home-services businesses, reached by Brendan's own outreach.",
    heroEyebrow: "KeyGrowth",
    heroHeadline: "Get your homepage redesigned for free",
    heroSubhead:
      "We rebuild your homepage first and show you the result. If you like it, we put it live. If you do not, it costs you nothing.",
    team: [],
    sampleSites: [],
    faq: [],
  },
};
