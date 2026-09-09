import type { Tenant } from "@/tenants/types";

/**
 * Smile Creative — Brendan O'Hagan's Belfast studio.
 *
 * A lead-generation landing page and nothing more. The studio's full site
 * lives at smilecreative.agency and is not ours; this exists to collect a URL
 * and hand back a free homepage redesign, which is the one thing this platform
 * does for him.
 *
 * TESTING: every address below is hello@barakahsoft.com, marked TEST-EMAIL, so
 * this can be exercised end to end without waiting on Brendan. There are three.
 * Mail leaving from the wrong domain is the failure a prospect notices rather
 * than we do.
 *
 * REMAINING SETUP:
 *   1. Add start.smilecreative.agency to the Vercel project and point DNS at
 *      Vercel. (redesign.smilecreative.agency is reserved for the agency
 *      running his enrichment flow — do not claim it here.)
 *   2. Verify the sending domain in Brevo (SPF + DKIM), then replace the
 *      TEST-EMAIL addresses.
 *   3. insert into public.accounts (email, tenant_slug, role)
 *        values ('<brendan>', 'smilecreative', 'operator');
 *   4. Supply legal copy, or terms/privacy/refund serve a holding page — see
 *      TenantLegal for why they are never inherited.
 */

/**
 * Screenshots, hotlinked from where they already live.
 *
 * One constant so moving them is a single edit. If this host ever changes,
 * next.config.mjs's remotePatterns needs the new one too or next/image refuses
 * it and the whole proof section renders empty.
 */
const EX = "https://redesign.smilecreative.agency/tenants/smile/examples";

export const smilecreative: Tenant = {
  slug: "smilecreative",
  primaryHost: "start.smilecreative.agency",
  extraHosts: [
    // A subdomain we already control, so this tenant is reviewable before
    // Brendan moves any DNS. Remove once start.smilecreative.agency resolves.
    "smile.barakahsoft.com",
    // *.localhost resolves to 127.0.0.1 with no hosts-file entry, so
    // smile.localhost:3000 renders this tenant locally.
    "smile.localhost",
  ],
  siteBaseUrl: "https://start.smilecreative.agency",
  portalBaseUrl: "https://start.smilecreative.agency",

  brand: {
    name: "Smile Creative",
    legalEntity: "Smile Creative",
    jurisdiction: "Northern Ireland, United Kingdom",
    logoUrl: "https://redesign.smilecreative.agency/tenants/smile/logo.png",
    // Smile's pink, so a glance at either dashboard says which one it is.
    primaryHsl: "340 82% 52%",
    phoneDisplay: "+44 (28) 9099 7004",
    phoneE164: "+442890997004",
    supportEmail: "hello@barakahsoft.com", // TEST-EMAIL → studio@smilecreative.agency
    fromEmail: "hello@barakahsoft.com", // TEST-EMAIL → verify the domain in Brevo first
    senderName: "Smile Creative",
    emailSignature: "Smile Creative · Belfast · +44 (28) 9099 7004",
    // Brendan's own tags when he has them. Empty means nothing fires — the
    // platform's pixel must never load on a partner's domain.
    analytics: {},
  },

  // Enquiry, not Stripe. Brendan quotes a fixed price after a conversation and
  // collects it himself; a button that charges a Wyoming LLC and pays the
  // platform is worse than useless to him, and routing a UK client's payment
  // through a US entity is a VAT problem on top of the branding one.
  commerce: {
    mode: "enquiry",
    enquiryEmail: "hello@barakahsoft.com", // TEST-EMAIL → studio@smilecreative.agency
    primaryActionLabel: "Get my free redesign",
  },

  landing: {
    audience: "Local businesses across the UK and Ireland, reached by Brendan's own outreach.",
    heroEyebrow: "Free homepage redesign",
    heroHeadline: "Get your homepage redesigned for free",
    heroSubhead:
      "See exactly how your homepage could look. A custom concept, delivered in 48 hours. Free, no strings attached.",
    trustLine:
      "A Belfast full-service agency — 47 client projects in our portfolio, from logos and websites to hosting.",

    examples: [
      {
        name: "QSA Self Storage",
        category: "Self storage",
        desktopUrl: `${EX}/qsaselfstorage-desktop.jpg`,
        mobileUrl: `${EX}/qsaselfstorage-mobile.jpg`,
      },
      {
        name: "K Neeson Removals",
        category: "Removals & storage",
        desktopUrl: `${EX}/neesonremovals-desktop.jpg`,
        mobileUrl: `${EX}/neesonremovals-mobile.jpg`,
      },
      {
        name: "BME Electrical",
        category: "Electrical contractors",
        desktopUrl: `${EX}/bme-electrical-desktop.jpg`,
        mobileUrl: `${EX}/bme-electrical-mobile.jpg`,
      },
      {
        name: "Fitter Finances",
        category: "Financial services",
        desktopUrl: `${EX}/fitterfinances-desktop.jpg`,
        mobileUrl: `${EX}/fitterfinances-mobile.jpg`,
      },
      {
        name: "Canavan Construction",
        category: "Construction",
        desktopUrl: `${EX}/canavanconstruction-desktop.jpg`,
      },
      {
        name: "Harry Coates",
        category: "Artist & gallery",
        desktopUrl: `${EX}/harrycoatesart-desktop.jpg`,
      },
    ],
    moreExamplesHref: "https://smilecreative.agency/portfolio/",

    process: [
      {
        when: "Takes 2 minutes",
        title: "Fill out the form",
        body: "Share your current URL and tell us what you want to improve. Answer a few quick questions about your preferences.",
      },
      {
        when: "Within 48 hours",
        title: "We design your homepage",
        body: "Our team creates a professional redesign concept for your homepage — complete with desktop and mobile views.",
      },
      {
        when: "Straight to your inbox",
        title: "Check your inbox",
        body: "You'll receive an email with your new design mockup so you can see exactly how it looks and where the improvements are.",
      },
      {
        when: "No strings attached",
        title: "Decide what's next",
        body: "Love the design? We can help you build the full website. Not ready? Keep the concept — it's yours, free of charge.",
      },
    ],

    included: [
      "Homepage redesign mockup",
      "Desktop and mobile views",
      "Copy written for the new layout",
      "Delivered to your inbox in 48 hours",
      "Yours to keep forever",
    ],

    team: [
      { name: "Brendan", role: "Director" },
      { name: "Olly", role: "Web developer" },
      { name: "Lisa", role: "Graphic designer" },
    ],

    faq: [
      {
        q: "Why is this free?",
        a: "We'd rather prove value than pitch it. You get a full concept, and if you like it we can talk about building the site. If not, the design is still yours.",
      },
      {
        q: "What exactly do I get?",
        a: "A homepage redesign mockup in desktop and mobile views, with copy written for the new layout. It's a finished visual concept, not a wireframe.",
      },
      {
        q: "How long does a full build take?",
        a: "The free concept lands within 48 hours. A full build typically runs 2–4 weeks depending on scope, and we keep you posted at every stage.",
      },
      {
        q: "Is this a template?",
        a: "No. We look at your actual homepage, your competitors and your market first, then design something specific to your business.",
      },
      {
        q: "Will my website be optimised for search?",
        a: "Yes. Clean structure, fast loading and proper metadata are built in from the start rather than bolted on later.",
      },
      {
        q: "Do I need to provide the content?",
        a: "Either way works. We can design around your existing copy, or write new copy as part of the build.",
      },
      {
        q: "What if I'm not happy with the design?",
        a: "Then you've lost nothing. Tell us what missed and we'll usually take another pass, or you can walk away at no cost.",
      },
    ],

    contact: { hours: "Monday to Friday, 9am – 5pm" },
  },
};
