import type { Tenant } from "@/tenants/types";

/**
 * Brendan O'Hagan — Smile Creative, Belfast. Serving keygrowth.co.uk.
 *
 * The slug stays "keygrowth" because it is the database key written to
 * leads.tenant_slug and accounts.tenant_slug; the visible brand is Smile
 * Creative, which is the studio whose address, phone, portfolio and fifteen
 * years of work this page shows. Renaming the slug later would orphan rows.
 *
 * TESTING: every address below is currently hello@barakahsoft.com so this can
 * be exercised end to end without waiting on Brendan. Search for TEST-EMAIL
 * before handover — there are three, and mail leaving from the wrong domain is
 * the failure that gets noticed by a prospect rather than by us.
 *
 * REMAINING SETUP:
 *   1. Add keygrowth.co.uk and www.keygrowth.co.uk to the Vercel project, and
 *      point DNS at Vercel's records.
 *   2. Verify the sending domain in Brevo (SPF + DKIM), then replace the
 *      TEST-EMAIL addresses.
 *   3. insert into public.accounts (email, tenant_slug, role)
 *        values ('<brendan>', 'keygrowth', 'operator');
 *   4. Supply legal copy, or the terms/privacy/refund pages serve a holding
 *      page — see TenantLegal for why they are never inherited.
 */

/** Screenshots live on the studio's own CDN, hotlinked rather than copied. */
const SHOT = "https://smilecreative.agency/wp-content/uploads/2026/09";

export const keygrowth: Tenant = {
  slug: "keygrowth",
  primaryHost: "keygrowth.co.uk",
  extraHosts: [
    "www.keygrowth.co.uk",
    "redesign.keygrowth.co.uk",
    "portal.keygrowth.co.uk",
    // Testing hosts, usable before keygrowth.co.uk's DNS moves.
    //
    // keygrowth.barakahsoft.com is a subdomain we already control: add it to
    // the Vercel project, point a CNAME at Vercel, and this tenant is live and
    // reviewable without touching Brendan's domain or waiting on him. Remove
    // it once keygrowth.co.uk resolves here.
    "keygrowth.barakahsoft.com",
    // *.localhost resolves to 127.0.0.1 in every modern browser with no hosts
    // file entry, so `keygrowth.localhost:3000` renders this tenant locally.
    "keygrowth.localhost",
  ],
  siteBaseUrl: "https://redesign.keygrowth.co.uk",
  portalBaseUrl: "https://portal.keygrowth.co.uk",

  brand: {
    name: "Smile Creative",
    legalEntity: "Smile Creative",
    jurisdiction: "Northern Ireland, United Kingdom",
    logoUrl: "https://smilecreative.agency/wp-content/uploads/2026/09/smile-logo.png",
    // Belfast green, distinct from the platform's indigo at a glance.
    primaryHsl: "158 64% 34%",
    phoneDisplay: "+44 (28) 9099 7004",
    phoneE164: "+442890997004",
    supportEmail: "hello@barakahsoft.com", // TEST-EMAIL → studio@smilecreative.agency
    fromEmail: "hello@barakahsoft.com", // TEST-EMAIL → verify the domain in Brevo first
    senderName: "Smile Creative",
    emailSignature: "Smile Creative · Moat House, 54 Bloomfield Avenue, Belfast BT5 5AD · +44 (28) 9099 7004",
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
    audience:
      "Local businesses across the UK and Ireland, reached by Brendan's own outreach from Belfast.",
    heroEyebrow: "Web · Print · Brand — Belfast, since 2001",
    heroHeadline: "Websites and print, built properly.",
    heroSubhead:
      "A Belfast studio working for businesses across the UK and Ireland, and a few a good deal further — Antibes, Mauritius, Essex, Glasgow, Liverpool. First website built in 2001. You deal with the person doing the work, and you own everything at the end of it.",

    team: [
      {
        name: "Brendan O'Hagan",
        role: "Founder · Design and build",
        bio: "Smile Creative is me and three specialists I have worked with for years. A small collective rather than a company with departments, which means no account managers, no juniors learning on your job, and the person who answers the phone is the person doing the work.",
      },
    ],

    // Fifteen years of delivered work, hotlinked from the studio's own CDN.
    // This is his proof, and it is not proof this platform generated — hence
    // config rather than the lead-derived before/after showcase.
    portfolio: [
      {
        name: "Logan's Removals & Storage",
        kind: "Website design & build",
        who: "Family removals firm, Ahoghill",
        href: "https://logansremovals.co.uk/",
        imageUrl: `${SHOT}/smile-work-logansremovals-co-uk.jpg`,
      },
      {
        name: "Belfast House Removals",
        kind: "Website & instant quote tool",
        who: "Removals matching service, Belfast",
        href: "https://belfasthouseremovals.co.uk/",
        imageUrl: `${SHOT}/smile-work-belfasthouseremovals-co-uk.jpg`,
      },
      {
        name: "Volumove",
        kind: "Product site & lead system",
        who: "Quote software for removal firms",
        href: "https://volumove.co.uk/",
        imageUrl: `${SHOT}/smile-work-volumove-co-uk.jpg`,
      },
      {
        name: "Contact Local",
        kind: "Product site & digital contact pages",
        who: "One-tap contact page, £45",
        href: "https://contactlocal.co.uk/",
        imageUrl: `${SHOT}/smile-work-contactlocal-co-uk.jpg`,
      },
      {
        name: "QSA Self Storage",
        kind: "Website design & build",
        who: "Self storage, Newtownabbey",
        href: "https://qsaselfstorage.co.uk/",
        imageUrl: `${SHOT}/smile-work-qsaselfstorage-co-uk.jpg`,
      },
      {
        name: "FMK Architecture",
        kind: "Website design & build",
        who: "Architecture practice, Ballymena",
        href: "https://fmkni.com/",
        imageUrl: `${SHOT}/smile-work-fmkni-com.jpg`,
      },
      {
        name: "FMK ECOHomes",
        kind: "Website & product site",
        who: "Low energy home builder, NI",
        href: "https://www.ecohomesni.com/",
        imageUrl: `${SHOT}/smile-work-ecohomesni-com.jpg`,
      },
      {
        name: "Stylistic Landscapes",
        kind: "Website design & build",
        who: "Grounds maintenance, Co. Antrim",
        href: "https://stylisticlandscapes.co.uk/",
        imageUrl: `${SHOT}/smile-work-stylisticlandscapes-co-uk.jpg`,
      },
      {
        name: "Harry Coates",
        kind: "Website & gallery",
        who: "Contemporary Irish artist",
        href: "https://harrycoatesart.com/",
        imageUrl: `${SHOT}/smile-work-harrycoatesart-com.jpg`,
      },
      {
        name: "K Neeson Removals",
        kind: "Website design & build",
        who: "Removals & storage, Belfast, est. 1978",
        href: "https://neesonremovals.co.uk/",
        imageUrl: `${SHOT}/smile-work-neesonremovals-co-uk.jpg`,
      },
      {
        name: "The Printing Press",
        kind: "Online shop & print ordering",
        who: "Trade print, UK wide",
        href: "https://theprintingpress.co.uk/",
        imageUrl: `${SHOT}/smile-work-theprintingpress-co-uk.jpg`,
      },
      {
        name: "Smile Colour Printing",
        kind: "Online shop & print ordering",
        who: "Our own print business",
        href: "https://smileprinting.co.uk/",
        imageUrl: `${SHOT}/smile-work-smileprinting-co-uk.jpg`,
      },
    ],

    alsoWorkedOn: [
      { name: "Letters Plumbing & Heating", kind: "Website design & build" },
      { name: "Paul McKay Building & Plastering", kind: "Website design & build" },
      { name: "Canavan Construction", kind: "Website design & build" },
      { name: "Floors Restored", kind: "Website design & build" },
      { name: "Inner Beauty", kind: "Website design & build" },
      { name: "Heating & Energy Solutions", kind: "Website & online shop" },
      { name: "Fitter Finances", kind: "Website & lead capture quiz" },
      { name: "Taylor Farm Supplies", kind: "Website design & build" },
      { name: "He Hath Done", kind: "Website design & build" },
      { name: "Hope2Families", kind: "Website design & build" },
      { name: "The Joy Foundation", kind: "Website design & build" },
      { name: "Omagh Free Presbyterian Church", kind: "Website design & build" },
      { name: "Brookside Presbyterian Church", kind: "Website design & build" },
      { name: "FPC Mainland Commission", kind: "Website & donations" },
      { name: "Ramoan & Culfeightrin Parishes", kind: "Website design & build" },
      { name: "Ahoghill Community Playgroup", kind: "Website design & build" },
      { name: "Martin Donnelly", kind: "Website design & build" },
      { name: "ECOHomes Store", kind: "Online shop" },
      { name: "Shellfield Builders", kind: "Website design & build" },
      { name: "Moollan & Moollan", kind: "Website design & build" },
      { name: "WPKlenze", kind: "Product site" },
      { name: "Hello Housekeeping", kind: "Website design & build" },
      { name: "Make Learning Easy", kind: "Website design & build" },
    ],

    services: [
      {
        title: "Website design & build",
        body: "Built to be quick, to work on a phone, and to be edited by you afterwards.",
        href: "https://smilecreative.agency/website-design/",
      },
      {
        title: "Logo & brand identity",
        body: "A mark you own outright, supplied in every format you will ever be asked for.",
        href: "https://smilecreative.agency/logo-design/",
      },
      {
        title: "Print",
        body: "Brochures, signage, vehicle graphics, stationery. Still a third of what we do, and some of these clients have been with us since before the websites.",
        href: "https://smilecreative.agency/print-marketing/",
      },
      {
        title: "Search marketing",
        body: "Getting found for the things people actually type. No lock-in, no jargon.",
        href: "https://smilecreative.agency/search-marketing/",
      },
      {
        title: "Video production",
        body: "Filmed, edited and captioned here. Useful on a website, not just on Instagram.",
        href: "https://smilecreative.agency/video-production/",
      },
    ],

    pricing: [
      {
        figure: "£45",
        title: "A digital contact page",
        body: "One page, one tap to ring, message or find you. Through Contact Local, which is ours.",
      },
      {
        figure: "£395",
        title: "A website, from",
        body: "Designed and built properly, yours outright. Fixed price once we have talked.",
      },
      {
        figure: "£9.97",
        title: "Hosting and backups, a month",
        body: "Domain, hosting, backups. No support included at this level.",
      },
      {
        figure: "£87",
        title: "Looked after, a month",
        body: "The same, plus updates, monitoring, security and someone at the end of the phone.",
      },
    ],

    process: [
      {
        when: "Takes 2 minutes",
        title: "Send us your address",
        body: "Your current web address and a line about what you would like to be better.",
      },
      {
        when: "Usually within 24 hours",
        title: "We design your homepage",
        body: "A real concept, desktop and mobile, with copy written for the new layout. Not a wireframe.",
      },
      {
        when: "No strings",
        title: "You keep it either way",
        body: "Like it and we can talk about building it. Do not, and the concept is still yours.",
      },
    ],

    // Brendan's own words, left as he wrote them — contractions and all. The
    // rest of the page avoids contractions; this section does not, and that is
    // the point. Smoothing a man's own sentences in the section about honesty
    // is the same mistake as tidying a review.
    promise: {
      eyebrow: "How we sell",
      headline: "We would rather lose the job.",
      paragraphs: [
        "We would sooner walk away than wear you down into buying something so we can hit target.",
        "We don't sustain our business at the expense of yours. You know the type — persistent, always has a comeback, keeps calling until you sign just to get some peace. Then the work that turns up is a shadow of what got promised, and suddenly they're hard to reach. That's not us.",
        "We'd rather be boring. Not the finished website — that should turn heads — but everything behind it: no fuss, no chasing, just get the job done, not get the job at any cost. A quote is a fixed price for a described piece of work, not an opening position.",
        "When we do get something wrong, we put it right — sometimes at our own expense, sometimes long after the invoice was paid. That's cost us real money over the years. We'd rather that than leave a client with something we're not proud of.",
      ],
    },

    contact: {
      addressLines: ["Moat House, 54 Bloomfield Avenue", "Belfast BT5 5AD"],
      hours: "Monday to Friday, 9am – 5pm",
    },

    faq: [
      {
        q: "Do I own the website?",
        a: "Yes, outright — the domain, the hosting account and the files. If you ever want to move it elsewhere we will help you do that rather than make it difficult.",
      },
      {
        q: "What does it cost?",
        a: "Websites start at £395, and a one-page digital contact page is £45 through Contact Local. A quote is free and it is a fixed price, not an estimate that grows. If your budget will not stretch to what you have described, we will say so at the first conversation rather than three weeks in.",
      },
      {
        q: "Who actually does the work?",
        a: "The people you meet. No work is passed to an agency you have never heard of.",
      },
      {
        q: "Do you do social media?",
        a: "No, and we will not pretend otherwise. We do not believe an outside agency posting on your behalf actually works — it never sounds like you, because it is not you. If you want your own accounts set up properly so your own people can run them, that we are happy to do.",
      },
      {
        q: "Who are you not right for?",
        a: "If you need a large e-commerce platform, an app, or a team of ten on retainer, we are not the right fit and we will tell you who is. We are good at websites for local businesses that need to look serious and bring in work.",
      },
    ],
  },
};
