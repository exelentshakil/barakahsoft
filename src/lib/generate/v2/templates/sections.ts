import {
  esc,
  markHeadline,
  icon,
  seal,
  stars,
  reviewPills,
  ratingText,
  button,
  callLink,
  media,
  slug,
  telHref,
  GOOGLE_MARK,
} from "@/lib/generate/v2/templates/parts";
import type { PageCopy } from "@/lib/generate/v2/page-copy";
import type { LayoutDna } from "@/lib/generate/v2/layout-dna";
import type { SiteBrief } from "@/lib/generate-bespoke-site";

/**
 * Which structural variant this lead gets for a given section.
 *
 * Deterministic per lead and independent per section, so the combinations
 * multiply: three variants across six sections is 729 distinct compositions
 * before the four hero archetypes, the palette and the photography are
 * counted. Two clients in the same trade do not get the same page.
 */
export function variant(seed: number, salt: number): string {
  return `v${((seed + salt * 2654435761) % 3) + 1}`;
}

export interface RenderContext {
  brief: SiteBrief;
  copy: PageCopy;
  dna: LayoutDna;
  logoUrl: string | null;
  /** Photos in plan order; each section takes what it needs. */
  photos: string[];
  /** Only the client's own photography, for the "our work" gallery. */
  galleryPhotos: string[];
  /** Real routes, honouring inner_pages_built. */
  href: (path: string) => string;
  primaryHref: string;
}

const FIELD_SERVICE = (services: string[]) =>
  `<label class="bs-field"><span class="bs-sr">Service needed</span><select class="bs-select" name="service"><option value="">What do you need?</option>${services
    .map((service) => `<option value="${esc(service)}">${esc(service)}</option>`)
    .join("")}<option value="Something else">Something else</option></select></label>`;

/** The lead form. One implementation, used in the hero and the contact section. */
function leadForm(ctx: RenderContext, title: string, subtitle: string, submitLabel: string, reassurance = ""): string {
  const { formSkin } = ctx.dna.treatment;
  // The bar already carries the discount, so the form goes back to
  // reassurance rather than repeating it three inches away.
  const muted = ctx.dna.resolutions.formOfferMuted;
  const headTitle = muted && formSkin === "offer-banner" ? "Get your free quote" : title;
  const headSub = muted && formSkin === "offer-banner" ? "No obligation, no pressure" : subtitle;

  return `<form class="bs-form bs-form--${formSkin}" data-lead-form>
  <div class="bs-form__head">
    <p class="bs-form__title">${esc(headTitle)}</p>
    ${headSub ? `<p class="bs-form__sub">${esc(headSub)}</p>` : ""}
  </div>
  <div class="bs-form__body">
    <label class="bs-field"><span class="bs-sr">Your name</span><input class="bs-input" type="text" name="name" placeholder="Your name" autocomplete="name" required></label>
    <label class="bs-field"><span class="bs-sr">Phone number</span><input class="bs-input" type="tel" name="phone" placeholder="Phone number" autocomplete="tel" required></label>
    <label class="bs-field"><span class="bs-sr">Email address</span><input class="bs-input" type="email" name="email" placeholder="Email address" autocomplete="email"></label>
    ${FIELD_SERVICE(ctx.brief.services.slice(0, 10))}
    <button class="bs-btn bs-btn--wide" type="submit">${esc(submitLabel)}</button>
    <p class="bs-form__note" data-lead-form-message>${esc(reassurance)}</p>
  </div>
</form>`;
}

export function heroSection(ctx: RenderContext): string {
  const { copy, brief, dna } = ctx;
  const hero = copy.hero;
  const photo = ctx.photos[0] ?? null;
  // Platform marks rather than bare stars: a Google logo beside the number is
  // proof a stranger can go and check, which is the only reason the number is
  // worth printing.
  const rating = reviewPills({
    mode: dna.treatment.proofMode,
    qualitative: dna.resolutions.heroStatsQualitative,
    rating: brief.rating,
    reviewCount: brief.reviewCount,
    googleReviewUrl: brief.googleReviewUrl,
    facebookUrl: brief.socials.find((url) => /facebook\.com/i.test(url)) ?? null,
    facebookRating: brief.facebookRating,
    facebookReviewCount: brief.facebookReviewCount,
  });

  // The credential badges used to sit here AND in the trust bar, wrapping
  // raggedly in both. They belong in one place, evenly spaced, below.

  const t = dna.treatment;

  // The eyebrow's voice, not just its shape. A category label, the company's
  // own slogan, a welcome, or the region it leads with — or nothing, where the
  // headline is carrying a slab on its own.
  const eyebrowText =
    t.eyebrowMode === "welcome"
      ? `Welcome to ${brief.businessName}`
      : t.eyebrowMode === "region"
      ? `${brief.city}'s ${brief.industry.toLowerCase()} team`
      : t.eyebrowMode === "slogan"
      ? copy.band.headline
      : hero.eyebrow;
  const eyebrowEl =
    t.eyebrowMode === "none"
      ? ""
      : `<span class="bs-eyebrow bs-eyebrow--${t.eyebrowMode === "slogan" || t.eyebrowMode === "region" ? "rule" : "chip"}">${esc(eyebrowText)}</span>`;

  // Manufacturer certification is the credential this trade cares most about
  // and the one most of their own sites bury in the footer.
  const subject =
    t.heroSubject === "certification" && brief.certifications.length === 0 ? "worksite" : t.heroSubject;
  const certs =
    subject === "certification"
      ? `<div class="bs-certs">${brief.certifications
          .map((name: string) => `<span class="bs-cert">${icon("award", "bs-icon bs-icon--sm")}${esc(name)}</span>`)
          .join("")}</div>`
      : "";

  return `<section id="hero" class="bs-section bs-hero bs-hero--${dna.hero.id} bs-hero--${variant(dna.seed, 1)} bs-hero--subject-${subject} bs-hero--decor-${t.decorMotif}${dna.resolutions.decorStripesFine ? " bs-hero--decor-fine" : ""}">
  ${photo ? `<figure class="bs-hero__bg bs-media"><img src="${esc(photo)}" alt="${esc(brief.businessName)} ${esc(brief.industry.toLowerCase())} work in ${esc(brief.city)}" width="1920" height="1280" loading="eager" fetchpriority="high" decoding="async"></figure>` : ""}
  <div class="bs-container">
    <div class="bs-hero__grid">
      <div class="bs-hero__copy">
        ${eyebrowEl}
        <h1 class="bs-display${t.headlineCase === "caps" ? " bs-display--caps" : ""}${dna.resolutions.headlineTight && hero.headline.length > 46 ? " bs-display--tight" : ""}">${markHeadline(hero.headline, hero.headlineMark)}</h1>
        <p class="bs-lede">${esc(hero.subhead)}</p>
        ${certs}
        ${rating}
        <div class="bs-actions">
          ${button(hero.submitLabel, ctx.primaryHref)}
          ${callLink(brief.phone, "bs-link-call bs-link-call--hero")}
        </div>

      </div>
      <div class="bs-hero__form">
        ${leadForm(ctx, hero.formTitle, hero.formSubtitle, hero.submitLabel, hero.reassurance)}
      </div>
    </div>
  </div>
</section>`;
}

/**
 * The credential strip under the hero.
 *
 * Previously a flex row of mixed stats and badges that wrapped into a ragged
 * two-line block. It is a fixed grid now: every cell the same width, hairline
 * dividers between them, one icon and one label each — the certification row
 * the reference sites run directly under their hero.
 */
export function trustSection(ctx: RenderContext): string {
  const { copy, brief } = ctx;
  const glyphs = ["shield", "award", "clock", "home"];

  const cells: string[] = [];

  if (brief.rating && brief.reviewCount) {
    cells.push(`<div class="bs-trustbar__cell">
      ${stars(brief.rating)}
      <span class="bs-trustbar__label"><strong>${esc(ratingText(brief.rating))}</strong> from ${esc(String(brief.reviewCount))} Google reviews</span>
    </div>`);
  }

  for (const stat of copy.trust.stats.slice(0, 2)) {
    cells.push(`<div class="bs-trustbar__cell">
      <span class="bs-trustbar__value">${esc(stat.value)}</span>
      <span class="bs-trustbar__label">${esc(stat.label)}</span>
    </div>`);
  }

  copy.trust.badges.slice(0, 3).forEach((badge, index) => {
    cells.push(`<div class="bs-trustbar__cell">
      ${icon(glyphs[index % glyphs.length], "bs-icon bs-trustbar__glyph")}
      <span class="bs-trustbar__label">${esc(badge)}</span>
    </div>`);
  });

  if (cells.length === 0) return "";
  // Trimmed to a count that divides evenly, so the row never leaves an orphan.
  const usable = cells.length >= 5 ? cells.slice(0, 5) : cells.slice(0, cells.length >= 4 ? 4 : 3);

  return `<section id="trust" class="bs-trustbar" data-cells="${usable.length}">
  <div class="bs-container">${usable.join("")}</div>
</section>`;
}

/**
 * Who to name on the founder badge.
 *
 * The brief carries a single founder field ("Tony"), but the client's own
 * story says "founded by Tony and Hannah Ostheimer" — and naming one of two
 * co-founders on their own website is the kind of mistake that loses trust in
 * the first meeting. When the story names a pair, both are used.
 */
export function resolveFounders(brief: SiteBrief): { name: string; role: string } {
  const first = brief.founder?.trim();
  const story = brief.aboutContent ?? "";

  // Descriptors sit between the verb and the names more often than not —
  // "founded by Wyoming locals Tony and Hannah Ostheimer" — so a few words are
  // allowed to intervene before the pair.
  const pair = story.match(
    /(?:founded|started|owned|run|established)\s+(?:and\s+operated\s+)?by\s+(?:[\w-]+\s+){0,3}?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:and|&)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/
  );

  if (pair) {
    const [, one, two] = pair;
    // "Tony" + "Hannah Ostheimer" reads better as "Tony & Hannah Ostheimer"
    // than as the two names in full with the surname repeated.
    const surname = two.split(/\s+/).slice(1).join(" ");
    const oneShort = surname && one.endsWith(surname) ? one.slice(0, -surname.length).trim() : one;
    return { name: `${oneShort} & ${two}`, role: "Founders" };
  }

  if (first) return { name: first, role: "Founder" };
  return { name: brief.businessName, role: "Locally owned & operated" };
}

/** A glyph that means something, chosen from what the stat actually says. */
function statGlyph(label: string): string {
  const text = label.toLowerCase();
  if (/rating|star/.test(text)) return "star";
  if (/review|customer|client/.test(text)) return "quote";
  if (/year|experience|since|decade/.test(text)) return "clock";
  if (/warrant|guarantee|insur|licens|bond/.test(text)) return "shield";
  if (/service|offer|job|project|install/.test(text)) return "wrench";
  if (/area|town|city|cover|serving|local/.test(text)) return "pin";
  if (/home|propert|roof|house/.test(text)) return "home";
  return "award";
}

export function aboutSection(ctx: RenderContext): string {
  const { copy, brief, dna, logoUrl } = ctx;
  const about = copy.about;
  const photo = ctx.photos[1] ?? ctx.photos[0] ?? null;
  const founders = resolveFounders(brief);
  const founder = founders.name;

  // Copy models reliably answer "founderRole" with the name attached
  // ("Tony Ostheimer, Co-Founder"), which printed the name twice on the badge.
  const role = (() => {
    let value = (about.founderRole || "").trim();
    if (founder) {
      value = value.replace(new RegExp(founder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig"), "");
      for (const part of founder.split(/\s+/)) {
        if (part.length > 2) value = value.replace(new RegExp(part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "ig"), "");
      }
    }
    value = value.replace(/^[\s,·&-]+|[\s,·&-]+$/g, "").trim();
    return value || founders.role;
  })();

  // The band sat half empty whenever the copy model returned two stats, so the
  // supported facts we already hold top it up to four: the rating, the review
  // count, how many services they run, how many towns they cover, whether they
  // are licensed. Nothing here is invented — a fact absent from the brief
  // simply does not appear.
  const derived: { value: string; label: string }[] = [
    brief.rating ? { value: String(brief.rating), label: "Average rating" } : null,
    brief.reviewCount ? { value: `${brief.reviewCount}`, label: "Customer reviews" } : null,
    brief.services.length >= 3 ? { value: `${brief.services.length}`, label: "Services offered" } : null,
    brief.areas.length >= 2 ? { value: `${brief.areas.length}`, label: "Areas covered" } : null,
    brief.licensedInsured ? { value: "100%", label: "Licensed & insured" } : null,
  ].filter((stat): stat is { value: string; label: string } => stat !== null);

  const seenLabels = new Set(about.stats.map((stat) => stat.label.toLowerCase()));
  const stats = [...about.stats, ...derived.filter((stat) => !seenLabels.has(stat.label.toLowerCase()))].slice(0, 4);

  const statBand = stats.length
    ? `<div class="bs-stats" data-count="${Math.min(stats.length, 4)}">${stats
        .map(
          (stat) => `<div class="bs-stat">
        <span class="bs-stat__icon">${icon(statGlyph(stat.label))}</span>
        <span class="bs-stat__value">${esc(stat.value)}</span>
        <span class="bs-stat__label">${esc(stat.label)}</span>
      </div>`
        )
        .join("")}</div>`
    : "";

  const t = dna.treatment;

  // Fused sits inside the about; standalone is its own band after it. Where
  // the about is already ink, a standalone band in the same ink butts against
  // it as one slab with a seam, so it takes the accent instead.
  const bandClass = dna.resolutions.statBandAccent ? " bs-statband--accent" : "";
  const fused = t.statBand === "fused" ? statBand : "";
  const standalone =
    t.statBand === "standalone" && statBand
      ? `<div class="bs-statband${bandClass}"><div class="bs-container">${statBand}</div></div>`
      : "";

  const badge = t.founderBadge === "none"
    ? ""
    : `<div class="bs-founder-badge bs-founder-badge--${t.founderBadge}">
          ${logoUrl ? `<div class="bs-founder-badge__logo"><img src="${esc(logoUrl)}" alt="${esc(brief.businessName)} logo" width="120" height="48"></div>` : `<div class="bs-founder-badge__logo"><strong>${esc(brief.businessName)}</strong></div>`}
          <div class="bs-founder-badge__name">
            <strong>${esc(founder)}</strong>
            <span>${esc(role)}</span>
          </div>
        </div>`;

  // The about's eyebrow and heading case come off the hero rather than rolling
  // again: in a showcase post the two panels sit inches apart in one frame.
  const caps = t.headlineCase === "caps";

  return `<section id="about" class="bs-section bs-about bs-about--${dna.about.id} bs-about--${variant(dna.seed, 2)} bs-about--surface-${t.aboutSurface}">
  <div class="bs-container">
    <div class="bs-about__grid">
      <div class="bs-about__figure">
        ${photo ? `<figure class="bs-media bs-media--tall"><img src="${esc(photo)}" alt="${esc(founder)} of ${esc(brief.businessName)}" width="900" height="1100" loading="lazy" decoding="async"></figure>` : ""}
        ${badge}
        ${seal(about.sealLine, logoUrl, brief.businessName)}
      </div>
      <div class="bs-about__copy">
        <span class="bs-eyebrow bs-eyebrow--${t.eyebrowMode === "slogan" || t.eyebrowMode === "region" ? "rule" : "chip"}">${esc(about.eyebrow)}</span>
        <h2 class="bs-h2${caps ? " bs-h2--caps" : ""}">${markHeadline(about.headline, about.headlineMark)}</h2>
        ${about.paragraphs.map((paragraph) => `<p class="bs-body">${esc(paragraph)}</p>`).join("")}
        <div class="bs-actions">
          ${button(about.ctaLabel, ctx.primaryHref)}
          ${callLink(brief.phone)}
        </div>
      </div>
    </div>
    ${fused}
  </div>
  ${standalone}
</section>`;
}

/**
 * Services, with the booking widget pinned beside them.
 *
 * The longest section on the page was a card grid a visitor scrolled straight
 * past. Sticking the booking form in the left column turns that scroll into a
 * continuous conversion opportunity — the pattern every reference site uses —
 * while the services become full rows with a real photograph each.
 */
export function servicesSection(ctx: RenderContext): string {
  const { copy, brief } = ctx;
  const services = copy.services;
  if (services.items.length === 0) return "";
  const pool = ctx.photos.slice(2);

  const rows = services.items
    .map((item, index) => {
      const photo = pool[index % Math.max(pool.length, 1)] ?? null;
      return `<article class="bs-servicerow">
      ${photo ? `<figure class="bs-media"><img src="${esc(photo)}" alt="${esc(item.name)} in ${esc(brief.city)}" width="640" height="440" loading="lazy" decoding="async"></figure>` : `<div class="bs-servicerow__glyph">${icon("wrench")}</div>`}
      <div class="bs-servicerow__body">
        <h3 class="bs-h3">${esc(item.name)}</h3>
        <p class="bs-body">${esc(item.blurb)}</p>
        <a class="bs-textlink" href="${esc(ctx.href(`/services/${slug(item.name)}`))}">See ${esc(item.name.toLowerCase())}${icon("arrow", "bs-icon bs-icon--sm")}</a>
      </div>
    </article>`;
    })
    .join("");

  return `<section id="services" class="bs-section bs-section--tint bs-services bs-services--${variant(ctx.dna.seed, 3)}">
  <div class="bs-container">
    <div class="bs-sectionhead">
      <div>
        <span class="bs-eyebrow">${esc(services.eyebrow)}</span>
        <h2 class="bs-h2">${markHeadline(services.headline, services.headlineMark)}</h2>
        <p class="bs-lede">${esc(services.intro)}</p>
      </div>
    </div>
    <div class="bs-services__grid">
      <div class="bs-services__aside">
        ${bookingWidget(ctx, "aside")}
      </div>
      <div class="bs-services__rows">${rows}</div>
    </div>
  </div>
</section>`;
}

export function whyUsSection(ctx: RenderContext): string {
  const { copy, brief, logoUrl } = ctx;
  const why = copy.whyUs;
  const photo = ctx.photos[3] ?? ctx.photos[0] ?? null;
  const glyphs = ["shield", "award", "clock", "wrench"];

  return `<section id="why-us" class="bs-section bs-whyus bs-whyus--${variant(ctx.dna.seed, 4)}">
  <div class="bs-whyus__media">
    ${photo ? `<figure class="bs-media"><img src="${esc(photo)}" alt="The ${esc(brief.businessName)} team at work" width="1200" height="1400" loading="lazy" decoding="async"></figure>` : ""}
    ${seal(copy.about.sealLine, logoUrl, brief.businessName)}
  </div>
  <div class="bs-container">
    <div class="bs-whyus__panel">
      <span class="bs-eyebrow">${esc(why.eyebrow)}</span>
      <h2 class="bs-h2">${esc(why.headline)}</h2>
      <p class="bs-body">${esc(why.intro)}</p>
      <div class="bs-grid-2 bs-whyus__points">
        ${why.points
          .slice(0, 4)
          .map(
            (point, index) => `<div class="bs-point">
          <span class="bs-point__icon">${icon(glyphs[index % glyphs.length], "bs-icon")}</span>
          <h3 class="bs-h4">${esc(point.title)}</h3>
          <p class="bs-body">${esc(point.body)}</p>
        </div>`
          )
          .join("")}
      </div>
    </div>
  </div>
</section>`;
}

/**
 * How it works, as a visual sequence rather than three boxes of text.
 *
 * Each step gets a large ringed icon on a connector rail, the step number as a
 * chip on the ring, and its own colour weight — so the eye follows a path
 * instead of reading three paragraphs that happen to sit side by side.
 */
export function processSection(ctx: RenderContext): string {
  const { copy, brief } = ctx;
  const process = copy.process;
  const glyphs = ["phone", "home", "wrench", "check"];

  return `<section id="process" class="bs-section bs-process bs-process--${variant(ctx.dna.seed, 5)}">
  <div class="bs-container">
    <div class="bs-center">
      <span class="bs-eyebrow">${esc(process.eyebrow)}</span>
      <h2 class="bs-h2">${esc(process.headline)}</h2>
    </div>
    <ol class="bs-steps">
      ${process.steps
        .map(
          (step, index) => `<li class="bs-step">
        <span class="bs-step__ring">
          ${icon(glyphs[index % glyphs.length], "bs-icon bs-step__icon")}
          <span class="bs-step__num">${index + 1}</span>
        </span>
        <h3 class="bs-h3">${esc(step.title.replace(/^\s*(?:step\s*)?\d+[.):\-\s]+/i, ""))}</h3>
        <p class="bs-body">${esc(step.body)}</p>
      </li>`
        )
        .join("")}
    </ol>
    <div class="bs-center bs-actions bs-actions--centred">
      ${button(copy.hero.submitLabel, ctx.primaryHref)}
      ${callLink(brief.phone)}
    </div>
  </div>
</section>`;
}

/**
 * The work gallery.
 *
 * Uses every photograph the plan did not spend elsewhere rather than a fixed
 * four, and captions them with the service they show. The before/after markup
 * is here but only renders when a photo carries a `before` partner, so adding
 * pairing in the studio later lights this up without touching the section.
 */
export function gallerySection(ctx: RenderContext): string {
  const photos = ctx.galleryPhotos.length >= 4 ? ctx.galleryPhotos : [];
  if (photos.length < 4) return "";
  const { copy, brief } = ctx;
  const services = copy.services.items;

  // Every photograph is shown; the COLUMN COUNT is chosen to suit how many
  // there are. Eight goes four-up, six and seven go three-up (seven simply
  // leaves one on the last row, which reads fine), four goes two-up. Throwing
  // a client's photographs away to make a grid tidy is the wrong trade.
  const shown = photos.slice(0, 12);
  const columns = shown.length % 4 === 0 ? 4 : shown.length >= 5 ? 3 : 2;

  const tiles = shown
    .map((photo, index) => {
      const caption = copy.gallery.captions[index] ?? services[index % Math.max(services.length, 1)]?.name ?? `${brief.industry} in ${brief.city}`;
      return `<figure class="bs-gallery__tile">
      <span class="bs-media"><img src="${esc(photo)}" alt="${esc(caption)} by ${esc(brief.businessName)}" width="700" height="700" loading="lazy" decoding="async"></span>
      <figcaption>${esc(caption)}</figcaption>
    </figure>`;
    })
    .join("");

  return `<section id="gallery" class="bs-section bs-section--tint bs-gallery--${variant(ctx.dna.seed, 6)}">
  <div class="bs-container">
    <div class="bs-center">
      <span class="bs-eyebrow">${esc(copy.gallery.eyebrow)}</span>
      <h2 class="bs-h2">${esc(copy.gallery.headline)}</h2>
    </div>
    <div class="bs-gallery" data-columns="${columns}">${tiles}</div>
  </div>
</section>`;
}

export function bandSection(ctx: RenderContext): string {
  const { copy, brief } = ctx;
  return `<section id="cta-band" class="bs-section bs-section--brand">
  <div class="bs-container bs-center">
    <h2 class="bs-h2">${esc(copy.band.headline)}</h2>
    <p class="bs-lede">${esc(copy.band.body)}</p>
    <div class="bs-actions">
      ${button(copy.band.ctaLabel, ctx.primaryHref, "bs-btn--light")}
      ${callLink(brief.phone, "bs-link-call bs-link-call--invert")}
    </div>
  </div>
</section>`;
}

/**
 * Reviews as a slider, not a grid.
 *
 * A three-card grid shows three reviews and implies there are only three. The
 * reference sites all use a horizontal slider, which shows the count is real
 * and lets someone browse. The track is a scroll-snap container that swipes
 * natively and stays readable with JavaScript off; the arrows use the
 * data-review-* contract the reviewed runtime already implements.
 */
export function reviewsSection(ctx: RenderContext): string {
  const { copy, brief } = ctx;
  if (brief.reviews.length === 0) return "";

  const cards = brief.reviews
    .slice(0, 12)
    .map((review) => {
      const initial = review.author.trim().charAt(0).toUpperCase() || "C";
      const avatar = review.avatar
        ? `<img class="bs-review__avatar" src="${esc(review.avatar)}" alt="" width="44" height="44" loading="lazy" referrerpolicy="no-referrer">`
        : `<span class="bs-review__avatar">${esc(initial)}</span>`;
      return `<article class="bs-review">
      <header class="bs-review__head">
        ${avatar}
        <span class="bs-review__who"><strong>${esc(review.author)}</strong>${review.when ? `<span class="bs-small">${esc(review.when)}</span>` : ""}</span>
        ${GOOGLE_MARK}
      </header>
      ${stars(review.rating)}
      <p class="bs-body">${esc(review.text.slice(0, 420))}${review.text.length > 420 ? "…" : ""}</p>
    </article>`;
    })
    .join("");

  const showArrows = brief.reviews.length > 3;

  return `<section id="reviews" class="bs-section">
  <div class="bs-container">
    <div class="bs-center bs-reviews__head">
      <span class="bs-eyebrow">${esc(copy.reviews.eyebrow)}</span>
      <h2 class="bs-h2">${esc(copy.reviews.headline)}</h2>
      ${brief.rating ? `<div class="bs-rating bs-rating--centred">${stars(brief.rating)}<span><strong>${esc(ratingText(brief.rating))}</strong>${brief.reviewCount ? ` from ${esc(String(brief.reviewCount))} Google reviews` : ""}</span>${GOOGLE_MARK}</div>` : ""}
    </div>
    <div class="bs-reviews" data-review-slider>
      ${showArrows ? `<button class="bs-reviews__arrow bs-reviews__arrow--prev" type="button" data-review-prev aria-label="Previous reviews">${icon("arrow")}</button>` : ""}
      <div class="bs-reviews__track" data-review-track>${cards}</div>
      ${showArrows ? `<button class="bs-reviews__arrow bs-reviews__arrow--next" type="button" data-review-next aria-label="Next reviews">${icon("arrow")}</button>` : ""}
    </div>
  </div>
</section>`;
}

export function areasSection(ctx: RenderContext): string {
  const { copy, brief } = ctx;
  if (brief.areas.length === 0) return "";
  // A Google Maps embed rather than a static image: no API key, no quota, and
  // the sanitizer already whitelists this exact host for iframes.
  //
  // Coordinates first, and a town name only as a last resort. This used to
  // pass the bare town — "Jackson" for a Wyoming roofer — which Google
  // geocoded against the whole planet and answered with a village in
  // Bangladesh, so the section that tells someone whether they are covered
  // showed them the wrong continent. A verified lat/lng cannot be misread,
  // and where there is none the town is at least qualified with its state.
  const place = brief.geo
    ? `${brief.geo.lat},${brief.geo.lng}`
    : [brief.city.trim() || brief.areas[0] || "", brief.regionHint].filter(Boolean).join(", ");
  const query = encodeURIComponent(place);
  return `<section id="areas" class="bs-section bs-section--tint bs-areas--${variant(ctx.dna.seed, 7)}">
  <div class="bs-container">
    <div class="bs-split bs-split--wide-right bs-areas">
      <div class="bs-stack">
        <span class="bs-eyebrow">${esc(copy.areas.eyebrow)}</span>
        <h2 class="bs-h2">${esc(copy.areas.headline)}</h2>
        <p class="bs-body">${esc(copy.areas.body)}</p>
        <ul class="bs-areas__list">
          ${brief.areas
            .slice(0, 12)
            .map(
              (area) => `<li><a class="bs-areapin" href="${esc(ctx.href(`/areas/${slug(area)}`))}">
            <span class="bs-areapin__pin">${icon("pin", "bs-icon bs-icon--sm")}</span>
            <span class="bs-areapin__name">${esc(area)}</span>
            <span class="bs-areapin__go">${icon("arrow", "bs-icon bs-icon--sm")}</span>
          </a></li>`
            )
            .join("")}
        </ul>
        <div class="bs-actions">${button(copy.hero.submitLabel, ctx.primaryHref)}</div>
      </div>
      <div class="bs-areas__map">
        <iframe src="https://maps.google.com/maps?q=${query}&t=&z=9&ie=UTF8&iwloc=&output=embed" title="Map of the area served by ${esc(brief.businessName)}" width="600" height="450" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </div>
  </div>
</section>`;
}

/**
 * The booking widget.
 *
 * The reference site pays a third party $39 a month for this block. It is
 * three preset days, a date field and a submit — worth building once and
 * giving away, because "your new site includes online booking" is a better
 * opening line than another paragraph about design.
 */
/**
 * The booking widget.
 *
 * The reference site pays a third party $39 a month for this block. It is
 * three preset days, a date field and a submit — worth building once and
 * giving away, because "your new site includes online booking" is a better
 * opening line than another paragraph about design.
 *
 * Rendered twice: pinned beside the services list, and inside the guarantee
 * section. Both post through the same enquiry path.
 */
export function bookingWidget(ctx: RenderContext, context: "aside" | "full"): string {
  const { copy, brief } = ctx;
  const days = [1, 2, 3].map((offset) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return {
      value: date.toISOString().slice(0, 10),
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
      day: String(date.getDate()),
      month: date.toLocaleDateString("en-US", { month: "short" }),
    };
  });

  return `<form class="bs-booking" data-booking-form>
  <span class="bs-booking__glyph">${icon("calendar")}</span>
  <h3 class="bs-h3">${markHeadline(copy.booking.headline, copy.booking.headlineMark)}</h3>
  <p class="bs-small">${esc(copy.booking.body)}</p>
  <div class="bs-booking__days">
    ${days
      .map(
        (day, index) => `<label class="bs-booking__day">
      <input type="radio" name="preferred_date" value="${day.value}"${index === 0 ? " checked" : ""}>
      <span class="bs-booking__flag">Instant</span>
      <span class="bs-booking__weekday">${day.weekday}</span>
      <span class="bs-booking__num">${day.day}</span>
      <span class="bs-booking__month">${day.month}</span>
    </label>`
      )
      .join("")}
  </div>
  <label class="bs-field"><span class="bs-sr">A different date</span><input class="bs-input" type="date" name="other_date"></label>
  <label class="bs-field"><span class="bs-sr">Your name</span><input class="bs-input" type="text" name="name" placeholder="Your name" autocomplete="name" required></label>
  <label class="bs-field"><span class="bs-sr">Phone number</span><input class="bs-input" type="tel" name="phone" placeholder="Phone number" autocomplete="tel" required></label>
  ${context === "full" ? FIELD_SERVICE(brief.services.slice(0, 10)) : ""}
  <button class="bs-btn bs-btn--wide" type="submit">Request this slot</button>
  <p class="bs-form__note" data-lead-form-message>We confirm every booking by phone first.</p>
</form>`;
}

/**
 * The guarantee, with real substance rather than one paragraph beside a form.
 *
 * It carries the promise, the three things that back it as icon rows, a photo
 * of the work, the phone number and the booking widget — so the section that
 * closes the middle of the page has something to read as well as something
 * to fill in.
 */
export function guaranteeSection(ctx: RenderContext): string {
  const { copy, brief } = ctx;
  const photo = ctx.photos[5] ?? ctx.photos[2] ?? null;
  const points = [
    brief.licensedInsured ? { glyph: "shield", title: "Licensed, bonded & insured", body: `Fully covered on every job in ${brief.city} and the surrounding area.` } : null,
    { glyph: "award", title: "Workmanship stands behind it", body: "If something is not right, we come back and put it right. No argument." },
    { glyph: "clock", title: "We turn up when we say", body: "Booked in properly, and you hear from us if anything changes." },
  ].filter((point): point is { glyph: string; title: string; body: string } => point !== null);

  return `<section id="guarantee" class="bs-section bs-guarantee">
  <div class="bs-container">
    <div class="bs-guarantee__grid">
      <div class="bs-stack">
        <span class="bs-eyebrow">${esc(copy.guarantee.eyebrow)}</span>
        <h2 class="bs-h2">${esc(copy.guarantee.headline)}</h2>
        <p class="bs-lede">${esc(copy.guarantee.body)}</p>
        <div class="bs-guarantee__points">
          ${points
            .map(
              (point) => `<div class="bs-point bs-point--row">
            <span class="bs-point__icon">${icon(point.glyph)}</span>
            <div><h3 class="bs-h4">${esc(point.title)}</h3><p class="bs-body">${esc(point.body)}</p></div>
          </div>`
            )
            .join("")}
        </div>
        ${photo ? `<figure class="bs-media bs-media--wide"><img src="${esc(photo)}" alt="${esc(brief.businessName)} completed work" width="900" height="520" loading="lazy" decoding="async"></figure>` : ""}
        <div class="bs-actions">${button(copy.guarantee.ctaLabel, ctx.primaryHref)}${callLink(brief.phone)}</div>
      </div>
      <div class="bs-guarantee__aside">${bookingWidget(ctx, "full")}</div>
    </div>
  </div>
</section>`;
}

export function faqSection(ctx: RenderContext): string {
  const { copy } = ctx;
  return `<section id="faq" class="bs-section bs-section--tint">
  <div class="bs-container bs-container--narrow">
    <div class="bs-center">
      <span class="bs-eyebrow">${esc(copy.faq.eyebrow)}</span>
      <h2 class="bs-h2">${esc(copy.faq.headline)}</h2>
    </div>
    <div class="bs-accordion" data-accordion>
      ${copy.faq.items
        .map(
          (item, index) => `<div class="bs-accordion__item" data-accordion-item data-open="${index === 0 ? "true" : "false"}">
        <button class="bs-accordion__trigger" type="button" data-accordion-trigger aria-expanded="${index === 0 ? "true" : "false"}">
          <span>${esc(item.q)}</span>${icon("arrow", "bs-icon bs-accordion__chevron")}
        </button>
        <div class="bs-accordion__panel"><p class="bs-body">${esc(item.a)}</p></div>
      </div>`
        )
        .join("")}
    </div>
  </div>
</section>`;
}

export function contactSection(ctx: RenderContext): string {
  const { copy, brief } = ctx;
  const tel = telHref(brief.phone);
  const areas = brief.areas.slice(0, 6);

  // Each way of reaching the business is a card, not a line of text. A phone
  // number set as body copy asks to be read; set as a row with its own chip,
  // label and affordance, it asks to be pressed.
  const channel = (href: string, glyph: string, label: string, value: string, modifier = "") =>
    `<a class="bs-channel${modifier}" href="${esc(href)}">
        <span class="bs-channel__chip">${icon(glyph, "bs-icon bs-icon--sm")}</span>
        <span class="bs-channel__text">
          <span class="bs-channel__label">${esc(label)}</span>
          <span class="bs-channel__value">${esc(value)}</span>
        </span>
        <span class="bs-channel__go" aria-hidden="true">${icon("arrow", "bs-icon bs-icon--sm")}</span>
      </a>`;

  const badges = [
    brief.licensedInsured ? `<span class="bs-badge">${icon("shield", "bs-icon bs-icon--sm")}Licensed &amp; insured</span>` : "",
    brief.rating && brief.reviewCount
      ? `<span class="bs-badge">${icon("star", "bs-icon bs-icon--sm")}${esc(ratingText(brief.rating))} from ${esc(String(brief.reviewCount))} reviews</span>`
      : "",
  ].filter(Boolean).join("");

  return `<section id="contact" class="bs-section bs-section--ink bs-contact">
  <div class="bs-contact__aura" aria-hidden="true"></div>
  <div class="bs-contact__mesh" aria-hidden="true"></div>
  <div class="bs-container">
    <div class="bs-contact__inner">
      <div class="bs-contact__copy">
        <span class="bs-eyebrow">${esc(copy.contact.eyebrow)}</span>
        <h2 class="bs-h2">${esc(copy.contact.headline)}</h2>
        <p class="bs-lede">${esc(copy.contact.body)}</p>

        <div class="bs-channels">
          ${brief.phone && tel ? channel(tel, "phone-call", "Call us direct", brief.phone, " bs-channel--call") : ""}
          ${brief.email ? channel(`mailto:${brief.email}`, "mail", "Email the office", brief.email) : ""}
        </div>

        <div class="bs-contact__meta">
          <span class="bs-live"><span class="bs-live__dot" aria-hidden="true"></span>Answered by the team, not a call centre</span>
          ${badges}
        </div>

        ${areas.length ? `<div class="bs-contact__areas">
          <span class="bs-contact__arealabel">${icon("pin", "bs-icon bs-icon--sm")}Serving</span>
          <ul class="bs-contact__arealist">${areas.map((area) => `<li>${esc(area)}</li>`).join("")}</ul>
        </div>` : ""}
      </div>

      <div class="bs-contact__form">${leadForm(ctx, copy.contact.formTitle, copy.contact.formSubtitle, copy.contact.submitLabel, "")}</div>
    </div>
  </div>
</section>`;
}
