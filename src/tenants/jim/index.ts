import type { Tenant } from "@/tenants/types";

/**
 * Jim — white-label partner. Placeholder until his domain is decided.
 *
 * Not yet in the registry (src/tenants/index.ts): a tenant with no real host
 * would claim a hostname nobody owns. Fill in the TODOs, add the domain to
 * Vercel, add the registry line, insert his accounts row, push.
 *
 * If Jim wants a genuinely DIFFERENT product rather than his own branding,
 * fork the repo instead and delete the other tenant folders — the main line
 * keeps working for BarakahSoft and KeyGrowth.
 */
export const jim: Tenant = {
  slug: "jim",
  primaryHost: "jim.example.com", // TODO
  extraHosts: [],
  siteBaseUrl: "https://jim.example.com", // TODO
  portalBaseUrl: "https://jim.example.com", // TODO

  brand: {
    name: "Jim",
    legalEntity: "Jim", // TODO
    jurisdiction: "TODO",
    logoUrl: "", // TODO: wordmark, for the nav and footer
    iconUrl: "", // TODO: square mark, for the browser tab and social cards
    primaryHsl: "222 84% 55%",
    phoneDisplay: "", // TODO
    phoneE164: "", // TODO
    supportEmail: "", // TODO
    fromEmail: "", // TODO: verify the sending domain in Brevo first
    senderName: "Jim",
    emailSignature: "Jim",
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
    examples: [],
    faq: [],
  },
};
