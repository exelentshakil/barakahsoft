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
  // The handset with outgoing signal arcs — reads as "call us now" at a
  // glance, where the bare handset reads as a generic phone-number label.
  "phone-call": `<path d="M15.05 5A5 5 0 0 1 19 8.95"/><path d="M15.05 1A9 9 0 0 1 23 8.94"/><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.94.36 1.86.7 2.73a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.35-1.27a2 2 0 0 1 2.11-.45c.87.34 1.79.57 2.73.7A2 2 0 0 1 22 16.92z"/>`,
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

/** The Google "G", drawn rather than hotlinked so it cannot break or track. */
export const GOOGLE_MARK = `<span class="bs-google" aria-label="Google review"><svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"/><path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.7l4-3z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"/></svg></span>`;

const SOCIAL_PATHS: [RegExp, string, string][] = [
  [/facebook\.com/i, "Facebook", `<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>`],
  [/instagram\.com/i, "Instagram", `<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.2"/>`],
  [/(twitter|x)\.com/i, "X", `<path d="M4 4l16 16M20 4L4 20"/>`],
  [/youtube\.com/i, "YouTube", `<rect x="2" y="5" width="20" height="14" rx="4"/><path d="M10 9l5 3-5 3z"/>`],
  [/linkedin\.com/i, "LinkedIn", `<rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 10v7M7 7v.01M12 17v-4a2 2 0 0 1 4 0v4"/>`],
  [/tiktok\.com/i, "TikTok", `<path d="M15 3v9a4 4 0 1 1-4-4"/><path d="M15 6a5 5 0 0 0 5 4"/>`],
];

export function socialLabel(url: string): string {
  return SOCIAL_PATHS.find(([pattern]) => pattern.test(url))?.[1] ?? "Social profile";
}

export function socialIcon(url: string): string {
  const path = SOCIAL_PATHS.find(([pattern]) => pattern.test(url))?.[2] ?? ICONS.home;
  return `<span class="bs-social" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg></span>`;
}

export const FACEBOOK_MARK = `<span class="bs-fbmark" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path fill="#fff" d="M15.6 12.5h-2.3V20h-3v-7.5H8.6V10h1.7V8.5c0-2 1.2-3.2 3.1-3.2.9 0 1.7.07 2 .1v2.3h-1.4c-.9 0-1.1.44-1.1 1.07V10h2.5z"/></svg></span>`;

/**
 * The review proof strip.
 *
 * Two shapes, because most local trades have Google reviews and no Facebook
 * ones, and a hollow second badge reading "read our reviews" next to a real
 * rating diluted the only number that carries weight.
 *
 *   Both platforms rated -> two pills, each with its own real rating and count.
 *   Google only          -> ONE combined badge carrying both marks, the rating
 *                           and the Google count. The Facebook mark says where
 *                           else the business can be found; the count is
 *                           attributed to Google in the text, because that is
 *                           where it came from.
 */
export function reviewPills(args: {
  rating: number | null;
  reviewCount: number | null;
  googleReviewUrl: string | null;
  facebookUrl: string | null;
  facebookRating: number | null;
  facebookReviewCount: number | null;
}): string {
  if (!args.rating) return "";

  const stack = (mark: string, value: string, sub: string) =>
    `${mark}<span class="bs-pill__body"><span class="bs-pill__top"><strong>${esc(value)}</strong>${stars(Number(value) || args.rating)}</span><span class="bs-pill__sub">${esc(sub)}</span></span>`;

  const wrap = (href: string | null, inner: string, extra = "") =>
    href
      ? `<a class="bs-pill${extra}" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
      : `<span class="bs-pill${extra}">${inner}</span>`;

  // Both platforms have real numbers: show them separately, as equals.
  if (args.facebookRating && args.facebookReviewCount) {
    return `<div class="bs-pills">${[
      wrap(
        args.googleReviewUrl,
        stack(GOOGLE_MARK, String(args.rating), args.reviewCount ? `${args.reviewCount} Google reviews` : "Google reviews")
      ),
      wrap(
        args.facebookUrl,
        stack(FACEBOOK_MARK, String(args.facebookRating), `${args.facebookReviewCount} Facebook reviews`)
      ),
    ].join("")}</div>`;
  }

  // One rating, both marks — a single badge rather than a real one beside a
  // hollow one.
  const marks = `<span class="bs-pill__marks">${GOOGLE_MARK}${args.facebookUrl ? FACEBOOK_MARK : ""}</span>`;
  const inner = `${marks}<span class="bs-pill__body">
    <span class="bs-pill__top"><strong>${esc(String(args.rating))}</strong>${stars(args.rating)}</span>
    <span class="bs-pill__sub">${args.reviewCount ? `${esc(String(args.reviewCount))} Google reviews` : "Google reviews"}</span>
  </span>`;

  return `<div class="bs-pills">${wrap(args.googleReviewUrl, inner, " bs-pill--combined")}</div>`;
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
