// Who is selling this, and under whose name.
//
// One deployment serves several brands: BarakahSoft on barakahsoft.com, a
// partner on their own domain. They share the generator, the dashboard and the
// database, and share nothing else — a partner's prospect must never see
// BarakahSoft's logo, phone number, legal entity or card descriptor, and a
// partner must never see BarakahSoft's leads.
//
// Tenants live in code rather than in a database table, deliberately:
//
//   - Updating a partner's landing page is a file edit, a commit and a push.
//     No CMS, no admin screen, no migration to add a partner.
//   - Middleware resolves the host against a static map, so there is no DB
//     round-trip, no cache and no TTL on the path every page view takes.
//   - A fork for a partner who wants a different product deletes the other
//     tenant folders and one registry line. Nothing to migrate.
//   - A missing logo is a compile error rather than a runtime null.

/** How this tenant takes money for a build. */
export type CommerceMode = "stripe" | "enquiry";

export interface TenantCommerce {
  /**
   * "stripe"  — Stripe Checkout against the platform account. Only correct for
   *             the tenant that OWNS that account: the card statement carries
   *             its descriptor, the funds land in its balance, and its legal
   *             entity is named at the point of payment.
   *
   * "enquiry" — the proposal's primary action opens a form instead, and the
   *             submission is emailed to `enquiryEmail`. The default for every
   *             partner. A partner closing on their own terms needs the lead in
   *             their own inbox far more than they need a button that pays
   *             somebody else, and routing a UK partner's UK client through a
   *             US entity is a tax problem before it is a branding one.
   */
  mode: CommerceMode;
  /** Where an enquiry goes. Required when mode is "enquiry". */
  enquiryEmail?: string;
  /** Shown on the card statement. Stripe allows 22 characters. */
  statementDescriptor?: string;
  /** Wording for the primary action, so a partner can say "Request my build". */
  primaryActionLabel?: string;
}

export interface TenantBrand {
  /** Trading name, as it appears everywhere a visitor reads it. */
  name: string;
  /** The entity that contracts and invoices. Named in legal copy and at checkout. */
  legalEntity: string;
  /** Where that entity is registered, for the legal pages. */
  jurisdiction: string;
  /** Wordmark, shown in the nav, the footer and the proposal header. */
  logoUrl: string;
  /**
   * Square mark for the browser tab, the app icon and social cards.
   *
   * Distinct from logoUrl because a wordmark is unreadable at 32px and wrong as
   * an OG thumbnail. Omitted falls back to the app's own /icon.png, which is
   * only ever right for the platform — a partner without this has BarakahSoft's
   * favicon in their prospect's tab, which is small and completely wrong.
   */
  iconUrl?: string;
  /** Brand hue as "H S% L%", fed through the same channel split as a client site. */
  primaryHsl: string;
  phoneDisplay: string;
  /** E.164, for tel: links. */
  phoneE164: string;
  supportEmail: string;
  /** Verified sending address. Without SPF/DKIM on this domain, mail is spam. */
  fromEmail: string;
  senderName: string;
  /** Plain-text sign-off appended to outbound mail. */
  emailSignature: string;
  analytics?: {
    crispId?: string;
    metaPixelId?: string;
    clarityId?: string;
  };
}

/** Everything on a tenant's own marketing page that differs from the next one's. */
export interface TenantLanding {
  /** Owner-facing note about who this page is for. Never rendered. */
  audience: string;
  heroEyebrow?: string;
  heroHeadline?: string;
  heroSubhead?: string;
  /** Background footage for the hero. Omitted renders the poster image alone. */
  heroVideoUrl?: string;

  team: { name: string; role: string; photoUrl?: string; bio?: string }[];

  /**
   * Real redesigns, shown as desktop and mobile pairs.
   *
   * This is the whole proof section of a lead-generation landing page: a
   * prospect deciding whether to hand over their URL is asking one question,
   * "what will mine look like", and six real screenshots answer it better than
   * any amount of copy. Mobile is a separate image rather than a CSS crop
   * because the mobile design is a different design, and showing it is the
   * claim being made.
   */
  examples: {
    name: string;
    /** One or two words under the name. "Self storage". */
    category: string;
    desktopUrl: string;
    /** Optional: not every example needs a phone shot. */
    mobileUrl?: string;
  }[];

  /** "Show more examples" — the tenant's own portfolio page. */
  moreExamplesHref?: string;

  /** A single line of credibility under the hero form. */
  trustLine?: string;

  /** How the free redesign works, numbered. */
  process?: { title: string; body: string; when?: string }[];

  /** What the prospect gets for nothing, as a plain list. */
  included?: string[];

  /** Where they actually are. Brand carries the phone and email. */
  contact?: { addressLines?: string[]; hours?: string };

  faq: { q: string; a: string }[];
}

/**
 * A tenant's own legal copy.
 *
 * Deliberately NOT inheritable. The platform's terms name a Wyoming LLC, a
 * specific management fee and a specific refund remedy; rendering those under
 * a partner's name with the entity swapped would not be a branding slip, it
 * would be publishing a false legal document that a customer could rely on.
 *
 * A tenant without these gets a short holding page pointing at their support
 * address, which is honest, rather than someone else's contract.
 */
export interface TenantLegal {
  /** Rendered as trusted HTML — authored by us, per tenant, never user input. */
  termsHtml?: string;
  privacyHtml?: string;
  refundHtml?: string;
}

export interface Tenant {
  /** Stable key. Written to leads.tenant_slug; never rename one in use. */
  slug: string;
  /** Canonical host. Everything else 301s or aliases to this. */
  primaryHost: string;
  /** www, staging, localhost — anything that is this tenant but not canonical. */
  extraHosts: string[];
  /** Origin for the public marketing site. Replaces NEXT_PUBLIC_SITE_URL. */
  siteBaseUrl: string;
  /** Origin for client proposals and delivered sites. Replaces NEXT_PUBLIC_PORTAL_URL. */
  portalBaseUrl: string;
  /** The tenant an unrecognised host falls back to. Exactly one may set this. */
  isDefault?: boolean;
  brand: TenantBrand;
  commerce: TenantCommerce;
  /** Own legal copy. Never inherited from another tenant — see TenantLegal. */
  legal?: TenantLegal;
  landing: TenantLanding;
}
