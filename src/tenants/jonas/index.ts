import type { Tenant } from "@/tenants/types";

/**
 * Jonas — white-label partner. Placeholder until his domain is decided.
 *
 * Not yet in the registry (src/tenants/index.ts): a tenant with no real host
 * would claim a hostname nobody owns. Fill in the TODOs, add the domain to
 * Vercel, add the registry line, insert his accounts row, push.
 *
 * If Jonas wants a genuinely DIFFERENT product rather than his own branding,
 * fork the repo instead and delete the other tenant folders — the main line
 * keeps working for BarakahSoft and KeyGrowth.
 */
export const jonas: Tenant = {
  slug: "jonas",
  primaryHost: "jonas.example.com", // TODO
  extraHosts: [],
  siteBaseUrl: "https://jonas.example.com", // TODO
  portalBaseUrl: "https://jonas.example.com", // TODO

  brand: {
    name: "Jonas",
    legalEntity: "Jonas", // TODO
    jurisdiction: "TODO",
    logoUrl: "", // TODO
    primaryHsl: "222 84% 55%",
    phoneDisplay: "", // TODO
    phoneE164: "", // TODO
    supportEmail: "", // TODO
    fromEmail: "", // TODO: verify the sending domain in Brevo first
    senderName: "Jonas",
    emailSignature: "Jonas",
    analytics: {},
  },

  // Partners default to enquiry. See src/tenants/types.ts for why.
  commerce: {
    mode: "enquiry",
    enquiryEmail: "", // TODO
    primaryActionLabel: "Request my build",
  },

  landing: {
    audience: "TODO",
    team: [],
    sampleSites: [],
    faq: [],
  },
};
