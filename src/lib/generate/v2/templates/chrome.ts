import { esc, icon, button, callLink, slug, telHref } from "@/lib/generate/v2/templates/parts";
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

  const brand = logoUrl
    ? `<img src="${esc(logoUrl)}" alt="${esc(brief.businessName)}" width="180" height="52">`
    : `<span class="bs-wordmark">${esc(brief.businessName)}</span>`;

  const services = brief.services.slice(0, 8);
  const areas = brief.areas.slice(0, 8);

  const servicesPanel = services.length
    ? `<li class="bs-nav__item" data-nav-dropdown>
    <button class="bs-nav__link" type="button" data-nav-trigger aria-expanded="false">Services${icon("arrow", "bs-icon bs-icon--sm bs-nav__caret")}</button>
    <div class="bs-nav__panel" data-nav-panel data-open="false">
      <div class="bs-nav__panelgrid">
        ${services
          .map(
            (service) => `<a href="${esc(ctx.href(`/services/${slug(service)}`))}">${icon("wrench", "bs-icon bs-icon--sm")}<span><strong>${esc(service)}</strong></span></a>`
          )
          .join("")}
      </div>
      <div class="bs-nav__panelcta">
        <p>${esc(copy.band.body)}</p>
        ${button(copy.hero.submitLabel, ctx.primaryHref)}
      </div>
    </div>
  </li>`
    : "";

  const areasPanel = areas.length
    ? `<li class="bs-nav__item" data-nav-dropdown>
    <button class="bs-nav__link" type="button" data-nav-trigger aria-expanded="false">Service Areas${icon("arrow", "bs-icon bs-icon--sm bs-nav__caret")}</button>
    <div class="bs-nav__panel bs-nav__panel--narrow" data-nav-panel data-open="false">
      <div class="bs-nav__panelgrid bs-nav__panelgrid--areas">
        ${areas
          .map((area) => `<a href="${esc(ctx.href(`/areas/${slug(area)}`))}">${icon("pin", "bs-icon bs-icon--sm")}<span>${esc(area)}</span></a>`)
          .join("")}
      </div>
    </div>
  </li>`
    : "";

  const utility = [
    brief.licensedInsured ? `${icon("shield", "bs-icon bs-icon--sm")}Licensed, bonded &amp; insured` : "",
    brief.areas.length ? `${icon("pin", "bs-icon bs-icon--sm")}Serving ${esc(brief.areas.slice(0, 3).join(", "))} &amp; surrounding areas` : "",
    brief.email ? `<a href="mailto:${esc(brief.email)}">${esc(brief.email)}</a>` : "",
  ].filter(Boolean);

  const drawerLinks = [
    { label: "Home", href: ctx.href("/") },
    ...services.map((service) => ({ label: service, href: ctx.href(`/services/${slug(service)}`) })),
    ...areas.map((area) => ({ label: area, href: ctx.href(`/areas/${slug(area)}`) })),
    { label: "About", href: ctx.href("/about") },
    { label: "FAQ", href: ctx.href("/faq") },
    { label: "Contact", href: ctx.href("/contact") },
  ];

  return `<nav class="bs-nav" data-nav data-sticky-nav aria-label="Main">
  ${utility.length ? `<div class="bs-utility"><div class="bs-container">${utility.map((item) => `<span>${item}</span>`).join("")}</div></div>` : ""}
  <div class="bs-nav__bar">
    <a class="bs-nav__logo" href="${esc(ctx.href("/"))}" aria-label="${esc(brief.businessName)} home">${brand}</a>
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
  <div class="bs-nav__drawer" data-nav-drawer data-open="false">
    <button class="bs-nav__close" type="button" data-nav-close aria-label="Close menu">${icon("close")}</button>
    ${drawerLinks.map((link) => `<a href="${esc(link.href)}">${esc(link.label)}</a>`).join("")}
    ${brief.phone ? `<a class="bs-btn bs-btn--wide" href="${esc(telHref(brief.phone) ?? "#")}">${esc(brief.phone)}</a>` : ""}
  </div>
</nav>`;
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
          ${brief.rating && brief.reviewCount ? `<span class="bs-badge">${icon("star")}${esc(String(brief.rating))} · ${esc(String(brief.reviewCount))} reviews</span>` : ""}
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
    <div class="bs-footer__wordmark" aria-hidden="true">${esc(brief.businessName)}</div>
    <div class="bs-footer__bottom">
      <span>© ${year} ${esc(brief.businessName)}. ${esc(brief.industry)} in ${esc(brief.city)} and the surrounding area.</span>
      <span><a href="${esc(ctx.href("/privacy"))}">Privacy Policy</a> · <a href="${esc(ctx.href("/terms"))}">Terms of Service</a></span>
    </div>
  </div>
</footer>`;
}
