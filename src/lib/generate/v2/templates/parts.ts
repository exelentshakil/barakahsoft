// Shared markup primitives. Everything the page is built from lives in this
// directory, so "the mega menu does not open" or "the contrast is wrong" is a
// bug with one cause and one fix, not a property of whatever the model wrote
// this time.

export function esc(value: string | null | undefined): string {
  return String(value ?? "").replace(/[&<>"']/g, (character) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character
  );
}

/** Wraps the phrase the copy nominated, once, in the brand-colour span. */
export function markHeadline(headline: string, mark: string): string {
  const safe = esc(headline);
  const phrase = mark.trim();
  if (!phrase) return safe;
  const target = esc(phrase);
  const index = safe.toLowerCase().indexOf(target.toLowerCase());
  if (index === -1) return safe;
  return `${safe.slice(0, index)}<span class="bs-mark">${safe.slice(index, index + target.length)}</span>${safe.slice(index + target.length)}`;
}

export function telHref(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.length >= 7 ? `tel:${digits}` : null;
}

export function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const ICONS: Record<string, string> = {
  phone: `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.94.36 1.86.7 2.73a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.35-1.27a2 2 0 0 1 2.11-.45c.87.34 1.79.57 2.73.7A2 2 0 0 1 22 16.92z"/>`,
  shield: `<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>`,
  check: `<path d="M20 6 9 17l-5-5"/>`,
  star: `<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>`,
  clock: `<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>`,
  pin: `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>`,
  award: `<circle cx="12" cy="8" r="6"/><path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5"/>`,
  wrench: `<path d="M14.7 6.3a4 4 0 0 0 5 5l-9.4 9.4a2.1 2.1 0 0 1-3-3z"/>`,
  home: `<path d="m3 10 9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>`,
  calendar: `<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>`,
  arrow: `<path d="M5 12h14M13 6l6 6-6 6"/>`,
  menu: `<path d="M3 6h18M3 12h18M3 18h18"/>`,
  close: `<path d="M18 6 6 18M6 6l12 12"/>`,
  quote: `<path d="M7 7h4v6a4 4 0 0 1-4 4V7zm9 0h4v6a4 4 0 0 1-4 4V7z"/>`,
};

export function icon(name: keyof typeof ICONS | string, className = "bs-icon"): string {
  const path = ICONS[name] ?? ICONS.check;
  return `<span class="${className}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg></span>`;
}

/** Rotating-text seal, drawn from the business rather than a stock asset. */
export function seal(line: string, logoUrl: string | null, businessName: string): string {
  // Repeated so the ring always reads as continuous however short the line is.
  const text = `${line.trim().replace(/\s+/g, " ")} · `.toUpperCase();
  const ring = text.repeat(text.length < 34 ? 3 : 2);
  const centre = logoUrl
    ? `<img src="${esc(logoUrl)}" alt="${esc(businessName)}" width="56" height="56">`
    : icon("home", "bs-seal__glyph");

  return `<div class="bs-seal" aria-hidden="true">
  <svg viewBox="0 0 200 200" class="bs-seal__ring">
    <defs><path id="bs-seal-path" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0"/></defs>
    <text><textPath href="#bs-seal-path" startOffset="0">${esc(ring)}</textPath></text>
  </svg>
  <span class="bs-seal__core">${centre}</span>
</div>`;
}

export function stars(rating: number | null): string {
  const filled = Math.round(rating ?? 5);
  return `<span class="bs-stars" aria-hidden="true">${Array.from({ length: 5 }, (_, index) =>
    `<svg viewBox="0 0 24 24" fill="${index < filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.5">${ICONS.star}</svg>`
  ).join("")}</span>`;
}

export function button(label: string, href: string, variant = ""): string {
  return `<a class="bs-btn${variant ? ` ${variant}` : ""}" href="${esc(href)}">${esc(label)}${icon("arrow", "bs-icon bs-icon--sm")}</a>`;
}

export function callLink(phone: string | null, className = "bs-link-call"): string {
  const href = telHref(phone);
  if (!href || !phone) return "";
  return `<a class="${className}" href="${href}">${icon("phone")}<span>${esc(phone)}</span></a>`;
}

export function media(url: string | null, alt: string, modifier = "", eager = false): string {
  if (!url) return "";
  return `<figure class="bs-media${modifier ? ` ${modifier}` : ""}"><img src="${esc(url)}" alt="${esc(alt)}" width="1200" height="800" ${
    eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'
  } decoding="async"></figure>`;
}
