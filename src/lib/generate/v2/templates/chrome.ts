import { esc, icon, button, callLink, ratingText, slug, telHref, socialIcon, socialLabel } from "@/lib/generate/v2/templates/parts";
import type { RenderContext } from "@/lib/generate/v2/templates/sections";

// Navigation and footer, written here rather than generated.
//
// The generated nav had two faults that no amount of prompting fixed: the
// dropdowns did not open, because the markup and the runtime's data-attribute
// contract only sometimes agreed, and the contrast was wrong, because the bar
// was rendered in the brand colour with white text on top of it. Both are
// structural, so both are fixed structurally: the attributes below are the
// exact ones BespokeChromeRuntime binds to, and the bar is always ink.

export function navMarkup(ctx: RenderContext): string {
  const { brief, logoUrl, copy } = ctx;
  // Service thumbnails come from the same plan the sections use, so the menu
  // shows this client's real work rather than generic glyphs.
  const thumbs = ctx.photos.slice(2);

  const brand = logoUrl
    ? `<img src="${esc(logoUrl)}" alt="${esc(brief.businessName)}" width="180" height="52">`
    : `<span class="bs-wordmark">${esc(brief.businessName)}</span>`;

  const services = brief.services.slice(0, 8);
  const areas = brief.areas.slice(0, 8);

  // The CTA card that closes both panels. Built from the same tokens as the
  // page, so it is this lead's aesthetic rather than a bolted-on component.
  const panelCta = `<aside class="bs-nav__cta">
    ${thumbs[0] ? `<figure class="bs-nav__ctamedia"><img src="${esc(thumbs[0])}" alt="" width="360" height="200" loading="lazy"><span class="bs-nav__ctaflag">${icon("clock", "bs-icon bs-icon--sm")}Fast response</span></figure>` : ""}
    <div class="bs-nav__ctabody">
      <strong>${esc(copy.band.headline)}</strong>
      <p>${esc(copy.band.body)}</p>
      ${brief.phone ? `<a class="bs-btn bs-btn--wide" href="tel:${esc((brief.phone || "").replace(/[^\d+]/g, ""))}">${icon("phone", "bs-icon bs-icon--sm")}Call ${esc(brief.phone)}</a>` : ""}
      <a class="bs-textlink" href="${esc(ctx.primaryHref)}">${esc(copy.hero.submitLabel)}${icon("arrow", "bs-icon bs-icon--sm")}</a>
    </div>
  </aside>`;

  const servicesPanel = services.length
    ? `<li class="bs-nav__item" data-nav-dropdown>
    <button class="bs-nav__link" type="button" data-nav-trigger aria-expanded="false">Services${icon("arrow", "bs-icon bs-icon--sm bs-nav__caret")}</button>
    <div class="bs-nav__panel" data-nav-panel data-open="false">
      <div class="bs-nav__panelhead"><span>Core services</span><span class="bs-nav__count">${services.length} offerings</span></div>
      <div class="bs-nav__panelmain">
        <div class="bs-nav__panelgrid">
          ${services
            .map(
              (service, index) => `<a href="${esc(ctx.href(`/services/${slug(service)}`))}">
            ${thumbs[index % Math.max(thumbs.length, 1)] ? `<span class="bs-nav__thumb"><img src="${esc(thumbs[index % thumbs.length])}" alt="" width="96" height="96" loading="lazy"></span>` : `<span class="bs-nav__thumb bs-nav__thumb--glyph">${icon("wrench", "bs-icon bs-icon--sm")}</span>`}
            <span class="bs-nav__itemtext"><strong>${esc(service)}</strong><span>${esc(service)} in ${esc(brief.city)}</span></span>
          </a>`
            )
            .join("")}
        </div>
        ${panelCta}
      </div>
    </div>
  </li>`
    : "";

  const areasPanel = areas.length
    ? `<li class="bs-nav__item" data-nav-dropdown>
    <button class="bs-nav__link" type="button" data-nav-trigger aria-expanded="false">Service Areas${icon("arrow", "bs-icon bs-icon--sm bs-nav__caret")}</button>
    <div class="bs-nav__panel" data-nav-panel data-open="false">
      <div class="bs-nav__panelhead"><span>Coverage locations</span><span class="bs-nav__count">${areas.length} zones covered</span></div>
      <div class="bs-nav__panelmain">
        <div class="bs-nav__panelgrid bs-nav__panelgrid--areas">
          ${areas
            .map(
              (area) => `<a href="${esc(ctx.href(`/areas/${slug(area)}`))}">
            <span class="bs-nav__thumb bs-nav__thumb--pin">${icon("pin", "bs-icon bs-icon--sm")}</span>
            <span class="bs-nav__itemtext"><strong>${esc(area)}</strong><span>${esc(brief.industry)} in ${esc(area)}</span></span>
          </a>`
            )
            .join("")}
        </div>
        ${panelCta}
      </div>
    </div>
  </li>`
    : "";

  const utility = [
    brief.licensedInsured ? `${icon("shield", "bs-icon bs-icon--sm")}Licensed, bonded &amp; insured` : "",
    brief.areas.length ? `${icon("pin", "bs-icon bs-icon--sm")}Serving ${esc(brief.areas.slice(0, 3).join(", "))} &amp; surrounding areas` : "",
    brief.email ? `<a href="mailto:${esc(brief.email)}">${esc(brief.email)}</a>` : "",
  ].filter(Boolean);

  // Grouped rather than one flat list of twenty links, which is what the
  // drawer degenerated into once services and areas were both in it.
  const drawerGroups: { title: string | null; links: { label: string; href: string }[] }[] = [
    { title: null, links: [{ label: "Home", href: ctx.href("/") }, { label: "About", href: ctx.href("/about") }, { label: "FAQ", href: ctx.href("/faq") }, { label: "Contact", href: ctx.href("/contact") }] },
    { title: "Services", links: services.map((service) => ({ label: service, href: ctx.href(`/services/${slug(service)}`) })) },
    { title: "Service areas", links: areas.map((area) => ({ label: area, href: ctx.href(`/areas/${slug(area)}`) })) },
  ].filter((group) => group.links.length > 0);

  // The strip above the nav. On the reference sites this is where a company
  // says what kind of company it is before a word of the page is read: a
  // two-tone flag, a promotion, a hazard stripe, or nothing at all.
  const { headerBar, navEdge } = ctx.dna.treatment;
  const utilityBar =
    headerBar === "none" || !utility.length
      ? ""
      : headerBar === "offer"
      ? `<div class="bs-utility bs-utility--offer"><div class="bs-container"><span>${icon("award", "bs-icon bs-icon--sm")}${esc(copy.band.headline)}</span></div></div>`
      : `<div class="bs-utility bs-utility--${headerBar}"><div class="bs-container">${utility
          .map((item) => `<span>${item}</span>`)
          .join("")}</div></div>`;

  // The nav's bottom edge, and whether the wordmark breaks out of it. Reads as
  // brand shape long before anyone parses the logo.
  const edge =
    navEdge === "wave"
      ? `<svg class="bs-nav__edge" viewBox="0 0 1240 34" preserveAspectRatio="none" aria-hidden="true"><path d="M0,0 H1240 V12 C980,40 820,4 620,18 C420,32 250,6 0,20 Z"/></svg>`
      : navEdge === "angled"
      ? `<svg class="bs-nav__edge" viewBox="0 0 1240 26" preserveAspectRatio="none" aria-hidden="true"><path d="M0,0 H1240 V4 L0,26 Z"/></svg>`
      : "";

  // The plinth carries the wordmark, so the bar leaves a gap where the logo
  // would sit — otherwise the logo renders twice.
  const plinth = navEdge === "plinth" ? `<div class="bs-nav__plinth">${brand}</div>` : "";
  const barBrand =
    navEdge === "plinth"
      ? `<span class="bs-nav__logo bs-nav__logo--hidden" aria-hidden="true"></span>`
      : `<a class="bs-nav__logo" href="${esc(ctx.href("/"))}" aria-label="${esc(brief.businessName)} home">${brand}</a>`;

  return `<nav class="bs-nav bs-nav--edge-${navEdge}" data-nav data-sticky-nav aria-label="Main">
  ${utilityBar}
  <div class="bs-nav__bar">
    ${barBrand}
    <ul class="bs-nav__links">
      <li><a class="bs-nav__link" href="${esc(ctx.href("/"))}">Home</a></li>
      ${servicesPanel}
      ${areasPanel}
      <li><a class="bs-nav__link" href="${esc(ctx.href("/about"))}">About</a></li>
      <li><a class="bs-nav__link" href="${esc(ctx.href("/faq"))}">FAQ</a></li>
      <li><a class="bs-nav__link" href="${esc(ctx.href("/contact"))}">Contact</a></li>
    </ul>
    <div class="bs-nav__actions">
      ${callLink(brief.phone, "bs-link-call bs-hide-mobile")}
      ${button(copy.hero.submitLabel, ctx.primaryHref)}
      <button class="bs-nav__burger" type="button" data-nav-toggle aria-expanded="false" aria-label="Open menu">${icon("menu")}</button>
    </div>
  </div>
  ${edge}${plinth}
</nav>
<!-- Deliberately a SIBLING of the nav, not a child: position:fixed resolves
     against the nearest filtered/transformed ancestor, and any such property
     on the bar would trap the drawer inside it. -->
<div class="bs-nav__drawer" data-nav-drawer data-open="false">
    <button class="bs-nav__close" type="button" data-nav-close aria-label="Close menu">${icon("close")}</button>
  ${drawerGroups
      .map((group) =>
        group.title
          ? // <details> rather than a script: the sanitizer strips script, and
            // twenty links in one flat list is not a menu anyone can navigate.
            `<details class="bs-nav__group"><summary>${esc(group.title)}${icon("arrow", "bs-icon bs-icon--sm")}</summary><div class="bs-nav__grouplinks">${group.links
              .map((link) => `<a href="${esc(link.href)}">${esc(link.label)}</a>`)
              .join("")}</div></details>`
          : group.links.map((link) => `<a href="${esc(link.href)}">${esc(link.label)}</a>`).join("")
      )
      .join("")}
  ${brief.phone ? `<a class="bs-btn bs-btn--wide bs-btn--call" href="${esc(telHref(brief.phone) ?? "#")}"><span class="bs-btn__chip">${icon("phone-call", "bs-icon bs-icon--sm")}</span><span class="bs-btn__calltext"><span class="bs-btn__calllabel">Call now</span><span class="bs-btn__callnumber">${esc(brief.phone)}</span></span></a>` : ""}
</div>`;
}

export function footerMarkup(ctx: RenderContext): string {
  const { brief, copy, logoUrl } = ctx;
  const year = new Date().getFullYear();

  const column = (title: string, links: { label: string; href: string }[]) =>
    links.length
      ? `<div class="bs-footer__col"><h3>${esc(title)}</h3><ul>${links
          .map((link) => `<li><a href="${esc(link.href)}">${esc(link.label)}</a></li>`)
          .join("")}</ul></div>`
      : "";

  return `<footer class="bs-footer">
  <div class="bs-container">
    <div class="bs-footer-cta">
      <div>
        <h2 class="bs-h2">${esc(copy.footer.ctaHeadline)}</h2>
        <p>${esc(copy.footer.ctaBody)}</p>
      </div>
      <div class="bs-actions">
        ${button(copy.footer.ctaLabel, ctx.primaryHref, "bs-btn--light")}
        ${callLink(brief.phone, "bs-link-call bs-link-call--invert")}
      </div>
    </div>
    <div class="bs-footer__cols">
      <div class="bs-footer__col bs-footer__brand">
        ${logoUrl ? `<img src="${esc(logoUrl)}" alt="${esc(brief.businessName)}" width="180" height="56" loading="lazy">` : `<span class="bs-wordmark">${esc(brief.businessName)}</span>`}
        <p class="bs-body">${esc(copy.footer.blurb)}</p>
        <div class="bs-row">
          ${brief.licensedInsured ? `<span class="bs-badge">${icon("shield")}Licensed &amp; insured</span>` : ""}
          ${brief.rating && brief.reviewCount ? `<span class="bs-badge">${icon("star")}${esc(ratingText(brief.rating))} · ${esc(String(brief.reviewCount))} reviews</span>` : ""}
        </div>
        ${brief.phone ? `<a class="bs-phone-xl" href="${esc(telHref(brief.phone) ?? "#")}">${esc(brief.phone)}</a>` : ""}
        ${brief.email ? `<a class="bs-footer__email" href="mailto:${esc(brief.email)}">${esc(brief.email)}</a>` : ""}
      </div>
      ${column("Services", brief.services.slice(0, 8).map((service) => ({ label: service, href: ctx.href(`/services/${slug(service)}`) })))}
      ${column("Service Areas", brief.areas.slice(0, 8).map((area) => ({ label: area, href: ctx.href(`/areas/${slug(area)}`) })))}
      ${column("Useful Links", [
        { label: "Home", href: ctx.href("/") },
        { label: "About", href: ctx.href("/about") },
        { label: "Services", href: ctx.href("/services") },
        { label: "FAQ", href: ctx.href("/faq") },
        { label: "Contact", href: ctx.href("/contact") },
      ])}
    </div>
    ${
      brief.socials.length
        ? `<div class="bs-footer__socials">${brief.socials
            .map(
              (url) =>
                `<a href="${esc(url)}" aria-label="${esc(socialLabel(url))}" rel="noopener noreferrer" target="_blank">${socialIcon(url)}</a>`
            )
            .join("")}</div>`
        : ""
    }
    <!-- Duplicated and marquee'd: the name was simply too long for the width
         and got cropped mid-word ("SADDLE ROOI"). Sliding it reads as
         deliberate and shows the whole thing. -->
    <div class="bs-footer__wordmark" aria-hidden="true"><span>${esc(brief.businessName)}</span><span>${esc(brief.businessName)}</span></div>
    <div class="bs-footer__bottom">
      <span>© ${year} ${esc(brief.businessName)}. ${esc(brief.industry)} in ${esc(brief.city)} and the surrounding area.</span>
      <span><a href="${esc(ctx.href("/privacy"))}">Privacy Policy</a> · <a href="${esc(ctx.href("/terms"))}">Terms of Service</a></span>
    </div>
  </div>
</footer>`;
}
