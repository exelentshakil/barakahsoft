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
  logoUrl: string;
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
   * Work this tenant has already delivered, as their own proof.
   *
   * Distinct from the before/after showcase, which is built from leads in this
   * database. A partner arriving with fifteen years of portfolio and zero leads
   * here has proof; it is just not proof we generated, so it lives in config
   * rather than being manufactured.
   */
  portfolio: {
    name: string;
    /** What the work was. "Website design & build". */
    kind: string;
    /** Who they are. "Family removals firm, Ahoghill". */
    who?: string;
    /** Live site, opened in a new tab. */
    href: string;
    /** Screenshot. Hotlinked from wherever the tenant already hosts it. */
    imageUrl?: string;
  }[];

  /** Named work with no screenshot — a credibility list, not a gallery. */
  alsoWorkedOn?: { name: string; kind: string }[];

  services?: { title: string; body: string; href?: string }[];

  /** Headline prices. Starting figures, labelled as such by the section copy. */
  pricing?: { figure: string; title: string; body: string }[];

  /** How working with this tenant goes, numbered. */
  process?: { title: string; body: string; when?: string }[];

  /** Prose the tenant wants said in their own voice, rendered as paragraphs. */
  promise?: { eyebrow: string; headline: string; paragraphs: string[] };

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
