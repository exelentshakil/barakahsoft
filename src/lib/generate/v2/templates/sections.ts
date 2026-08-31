import { esc, markHeadline, icon, seal, stars, button, callLink, media, slug, telHref, GOOGLE_MARK } from "@/lib/generate/v2/templates/parts";
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
  return `<form class="bs-form" data-lead-form>
  <div class="bs-form__head">
    <p class="bs-form__title">${esc(title)}</p>
    ${subtitle ? `<p class="bs-form__sub">${esc(subtitle)}</p>` : ""}
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
  const rating =
    brief.rating && brief.reviewCount
      ? `<div class="bs-rating">${stars(brief.rating)}<span><strong>${esc(String(brief.rating))}</strong> from ${esc(String(brief.reviewCount))} reviews</span></div>`
      : "";

  const badges = copy.trust.badges
    .slice(0, 3)
    .map((badge) => `<span class="bs-badge">${icon("check")}${esc(badge)}</span>`)
    .join("");

  return `<section id="hero" class="bs-section bs-hero bs-hero--${dna.hero.id} bs-hero--${variant(dna.seed, 1)}">
  ${photo ? `<figure class="bs-hero__bg bs-media"><img src="${esc(photo)}" alt="${esc(brief.businessName)} ${esc(brief.industry.toLowerCase())} work in ${esc(brief.city)}" width="1920" height="1280" loading="eager" fetchpriority="high" decoding="async"></figure>` : ""}
  <div class="bs-container">
    <div class="bs-hero__grid">
      <div class="bs-hero__copy">
        <span class="bs-eyebrow bs-eyebrow--chip">${esc(hero.eyebrow)}</span>
        <h1 class="bs-display">${markHeadline(hero.headline, hero.headlineMark)}</h1>
        <p class="bs-lede">${esc(hero.subhead)}</p>
        ${rating}
        <div class="bs-actions">
          ${button(hero.submitLabel, ctx.primaryHref)}
          ${callLink(brief.phone, "bs-link-call bs-link-call--hero")}
        </div>
        ${badges ? `<div class="bs-row bs-row--badges">${badges}</div>` : ""}
      </div>
      <div class="bs-hero__form">
        ${leadForm(ctx, hero.formTitle, hero.formSubtitle, hero.submitLabel, hero.reassurance)}
      </div>
    </div>
  </div>
</section>`;
}

export function trustSection(ctx: RenderContext): string {
  const { copy, brief } = ctx;
  const items: string[] = [];

  if (brief.rating && brief.reviewCount) {
    items.push(`<div class="bs-trustbar__item">${stars(brief.rating)}<span><strong>${esc(String(brief.rating))}</strong> · ${esc(String(brief.reviewCount))} reviews</span></div>`);
  }
  for (const stat of copy.trust.stats.slice(0, 3)) {
    items.push(`<div class="bs-trustbar__item bs-stat"><span class="bs-stat__value">${esc(stat.value)}</span><span class="bs-stat__label">${esc(stat.label)}</span></div>`);
  }
  for (const badge of copy.trust.badges.slice(0, 3)) {
    items.push(`<div class="bs-trustbar__item"><span class="bs-badge">${icon("shield")}${esc(badge)}</span></div>`);
  }
  if (items.length === 0) return "";

  return `<section id="trust" class="bs-trustbar"><div class="bs-container">${items.join("")}</div></section>`;
}

export function aboutSection(ctx: RenderContext): string {
  const { copy, brief, dna, logoUrl } = ctx;
  const about = copy.about;
  const photo = ctx.photos[1] ?? ctx.photos[0] ?? null;
  const founder = brief.founder?.trim();

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
    return value || (founder ? "Founder" : "Locally owned & operated");
  })();

  const statBand = about.stats.length
    ? `<div class="bs-stats">${about.stats
        .slice(0, 4)
        .map((stat) => `<div class="bs-stat"><span class="bs-stat__value">${esc(stat.value)}</span><span class="bs-stat__label">${esc(stat.label)}</span></div>`)
        .join("")}</div>`
    : "";

  return `<section id="about" class="bs-section bs-about bs-about--${dna.about.id} bs-about--${variant(dna.seed, 2)}">
  <div class="bs-container">
    <div class="bs-about__grid">
      <div class="bs-about__figure">
        ${photo ? `<figure class="bs-media bs-media--tall"><img src="${esc(photo)}" alt="${esc(founder ?? brief.businessName)} of ${esc(brief.businessName)}" width="900" height="1100" loading="lazy" decoding="async"></figure>` : ""}
        <div class="bs-founder-badge">
          ${logoUrl ? `<div class="bs-founder-badge__logo"><img src="${esc(logoUrl)}" alt="${esc(brief.businessName)} logo" width="120" height="48"></div>` : `<div class="bs-founder-badge__logo"><strong>${esc(brief.businessName)}</strong></div>`}
          <div class="bs-founder-badge__name">
            <strong>${esc(founder ?? brief.businessName)}</strong>
            <span>${esc(role)}</span>
          </div>
        </div>
        ${seal(about.sealLine, logoUrl, brief.businessName)}
      </div>
      <div class="bs-about__copy">
        <span class="bs-eyebrow">${esc(about.eyebrow)}</span>
        <h2 class="bs-h2">${markHeadline(about.headline, about.headlineMark)}</h2>
        ${about.paragraphs.map((paragraph) => `<p class="bs-body">${esc(paragraph)}</p>`).join("")}
        <div class="bs-actions">
          ${button(about.ctaLabel, ctx.primaryHref)}
          ${callLink(brief.phone)}
        </div>
      </div>
    </div>
    ${statBand}
  </div>
</section>`;
}

export function servicesSection(ctx: RenderContext): string {
  const { copy, brief } = ctx;
  const services = copy.services;
  if (services.items.length === 0) return "";
  const pool = ctx.photos.slice(2);

  const cards = services.items
    .map((item, index) => {
      const photo = pool[index % Math.max(pool.length, 1)] ?? null;
      return `<article class="bs-card bs-card--photo">
      ${photo ? `<figure class="bs-media"><img src="${esc(photo)}" alt="${esc(item.name)} in ${esc(brief.city)}" width="800" height="500" loading="lazy" decoding="async"></figure>` : ""}
      <div class="bs-card__body">
        <h3 class="bs-h3">${esc(item.name)}</h3>
        <p class="bs-body">${esc(item.blurb)}</p>
        <a class="bs-textlink" href="${esc(ctx.href(`/services/${slug(item.name)}`))}">Learn more${icon("arrow", "bs-icon bs-icon--sm")}</a>
      </div>
    </article>`;
    })
    .join("");

  return `<section id="services" class="bs-section bs-section--tint bs-services--${variant(ctx.dna.seed, 3)}">
  <div class="bs-container">
    <div class="bs-sectionhead">
      <div>
        <span class="bs-eyebrow">${esc(services.eyebrow)}</span>
        <h2 class="bs-h2">${markHeadline(services.headline, services.headlineMark)}</h2>
        <p class="bs-lede">${esc(services.intro)}</p>
      </div>
      ${button(copy.hero.submitLabel, ctx.primaryHref)}
    </div>
    <div class="bs-grid-3">${cards}</div>
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

export function processSection(ctx: RenderContext): string {
  const { copy } = ctx;
  const process = copy.process;
  return `<section id="process" class="bs-section bs-process--${variant(ctx.dna.seed, 5)}">
  <div class="bs-container bs-center">
    <span class="bs-eyebrow">${esc(process.eyebrow)}</span>
    <h2 class="bs-h2">${esc(process.headline)}</h2>
    <div class="bs-grid-3 bs-steps">
      ${process.steps
        .map(
          (step, index) => `<div class="bs-card bs-card--flat bs-step">
        <span class="bs-marker">${String(index + 1).padStart(2, "0")}</span>
        <h3 class="bs-h3">${esc(step.title)}</h3>
        <p class="bs-body">${esc(step.body)}</p>
      </div>`
        )
        .join("")}
    </div>
    ${button(copy.hero.submitLabel, ctx.primaryHref)}
  </div>
</section>`;
}

export function gallerySection(ctx: RenderContext): string {
  const photos = ctx.photos.slice(4, 12);
  if (photos.length < 4) return "";
  const { copy, brief } = ctx;
  return `<section id="gallery" class="bs-section bs-section--tint bs-gallery--${variant(ctx.dna.seed, 6)}">
  <div class="bs-container bs-center">
    <span class="bs-eyebrow">${esc(copy.gallery.eyebrow)}</span>
    <h2 class="bs-h2">${esc(copy.gallery.headline)}</h2>
    <div class="bs-gallery">
      ${photos
        .map(
          (photo, index) =>
            `<figure class="bs-media"><img src="${esc(photo)}" alt="${esc(copy.gallery.captions[index] ?? `${brief.industry} project in ${brief.city}`)}" width="600" height="600" loading="lazy" decoding="async"></figure>`
        )
        .join("")}
    </div>
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
      ${brief.rating ? `<div class="bs-rating bs-rating--centred">${stars(brief.rating)}<span><strong>${esc(String(brief.rating))}</strong>${brief.reviewCount ? ` from ${esc(String(brief.reviewCount))} Google reviews` : ""}</span>${GOOGLE_MARK}</div>` : ""}
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
  const query = encodeURIComponent(`${brief.city} ${brief.areas.slice(0, 2).join(" ")}`.trim());
  return `<section id="areas" class="bs-section bs-section--tint bs-areas--${variant(ctx.dna.seed, 7)}">
  <div class="bs-container">
    <div class="bs-split bs-split--wide-right bs-areas">
      <div class="bs-stack">
        <span class="bs-eyebrow">${esc(copy.areas.eyebrow)}</span>
        <h2 class="bs-h2">${esc(copy.areas.headline)}</h2>
        <p class="bs-body">${esc(copy.areas.body)}</p>
        <ul class="bs-row bs-areas__list">
          ${brief.areas
            .slice(0, 12)
            .map((area) => `<li><a class="bs-chip" href="${esc(ctx.href(`/areas/${slug(area)}`))}">${icon("pin", "bs-icon bs-icon--sm")}${esc(area)}</a></li>`)
            .join("")}
        </ul>
        <div class="bs-actions">${button(copy.hero.submitLabel, ctx.primaryHref)}</div>
      </div>
      <div class="bs-areas__map">
        <iframe src="https://www.google.com/maps?q=${query}&output=embed" title="Map of the area served by ${esc(brief.businessName)}" width="600" height="450" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
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
export function bookingSection(ctx: RenderContext): string {
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
  const photo = ctx.photos[5] ?? ctx.photos[2] ?? null;

  return `<section id="booking" class="bs-section">
  <div class="bs-container">
    <div class="bs-split bs-split--wide-right">
      <form class="bs-booking" data-booking-form>
        <span class="bs-booking__glyph">${icon("calendar")}</span>
        <h2 class="bs-h3">${markHeadline(copy.booking.headline, copy.booking.headlineMark)}</h2>
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
        ${FIELD_SERVICE(brief.services.slice(0, 10))}
        <button class="bs-btn bs-btn--wide" type="submit">Request this slot</button>
        <p class="bs-form__note" data-lead-form-message>We confirm every booking by phone first.</p>
      </form>
      <div class="bs-stack">
        <span class="bs-eyebrow">${esc(copy.booking.eyebrow)}</span>
        <h2 class="bs-h2">${esc(copy.guarantee.headline)}</h2>
        <p class="bs-body">${esc(copy.guarantee.body)}</p>
        ${photo ? `<figure class="bs-media bs-media--wide"><img src="${esc(photo)}" alt="${esc(brief.businessName)} at work" width="900" height="520" loading="lazy" decoding="async"></figure>` : ""}
        <div class="bs-actions">${callLink(brief.phone)}</div>
      </div>
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
  const email = brief.email ? `<a class="bs-link-call" href="mailto:${esc(brief.email)}">${esc(brief.email)}</a>` : "";
  return `<section id="contact" class="bs-section bs-section--ink">
  <div class="bs-container">
    <div class="bs-split bs-split--wide-left">
      <div class="bs-stack">
        <span class="bs-eyebrow">${esc(copy.contact.eyebrow)}</span>
        <h2 class="bs-h2">${esc(copy.contact.headline)}</h2>
        <p class="bs-lede">${esc(copy.contact.body)}</p>
        ${brief.phone ? `<a class="bs-phone-xl" href="${esc(telHref(brief.phone) ?? "#")}">${esc(brief.phone)}</a>` : ""}
        ${email}
        <p class="bs-small">${esc(brief.areas.slice(0, 6).join(" · ") || brief.city)}</p>
      </div>
      <div>${leadForm(ctx, copy.contact.formTitle, copy.contact.formSubtitle, copy.contact.submitLabel, "")}</div>
    </div>
  </div>
</section>`;
}
