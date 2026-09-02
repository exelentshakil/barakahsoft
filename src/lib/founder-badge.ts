// The owner's plate on the about photograph, guaranteed.
//
// Every reference site the client works from carries the same thing: the
// owner's photograph with a plate over it holding the logo, their name and
// their role. render-sections.ts asks for it in the section prompt, spelled
// out as exact markup, described as mandatory — and md360roofing shipped
// without one. The about copy there is written in the first person ("I
// started MD Roofing and Solar because I know exactly…") and the owner is
// never named anywhere on the page, which is the whole failure: a personal
// story told by nobody.
//
// The prompt already tried being more specific and the badge still went
// missing, so this stops asking. The markup is emitted here, by the
// application, from facts the application already holds — the same move
// build-homepage.ts makes with GUARANTEES for the CSS it refuses to let a
// model get wrong.
//
// Deliberately string-only, no cheerio: this runs on the edge read path so
// that pages already in the database get their badge on the next request
// rather than on the next rebuild.

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Scraped names arrive with zero-width joiners in them often enough to matter. */
function clean(value: string | null | undefined): string {
  return (value ?? "").replace(/[​-‏﻿]/g, "").trim();
}

export interface FounderBadgeFacts {
  founder: string | null;
  businessName: string;
  logoUrl: string | null;
}

/**
 * The badge itself, in the shape the stylesheet actually styles.
 *
 * Worth noting against the version in the section prompt, which asks for
 * `<div><span>…</span><span class="bs-small">…</span></div>`: the stylesheet
 * styles `.bs-founder-badge__name strong` and `.bs-founder-badge__name span`.
 * The prompt has been asking for markup the CSS does not dress, so even the
 * builds that DID produce a badge got the plain version of it.
 */
export function founderBadgeMarkup(facts: FounderBadgeFacts): string {
  const founder = clean(facts.founder);
  const business = clean(facts.businessName);
  const name = founder || business;
  const role = founder ? "Founder" : "Local, family owned";

  const logo = facts.logoUrl
    ? `<div class="bs-founder-badge__logo"><img src="${escapeHtml(facts.logoUrl)}" alt="${escapeHtml(business)} logo" width="120" height="48" loading="lazy" decoding="async"></div>`
    : `<div class="bs-founder-badge__logo"><strong>${escapeHtml(business)}</strong></div>`;

  return `<div class="bs-founder-badge">${logo}<div class="bs-founder-badge__name"><strong>${escapeHtml(name)}</strong><span>${role}</span></div></div>`;
}

/** The about section's bounds, or null when the page has no about section. */
function aboutSection(html: string): { start: number; end: number } | null {
  const open = /<section[^>]*\bclass=["'][^"']*\bbs-about\b[^"']*["'][^>]*>/i.exec(html);
  if (!open) return null;
  const close = html.indexOf("</section>", open.index);
  return close === -1 ? null : { start: open.index, end: close + "</section>".length };
}

/**
 * Where the badge goes: just inside the closing tag of the photograph's frame.
 *
 * The stylesheet positions `.bs-founder-badge` absolutely against the frame,
 * so it has to be a child of one — dropped anywhere else it pins itself to
 * the section and lands over body copy. A frame with no <img> in it is not a
 * photograph and is skipped, which also steps around the empty decorative
 * frames stripEmptyMediaFrames has not removed.
 */
function photoFrameClose(slice: string): number {
  const opens = /<figure[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = opens.exec(slice))) {
    const close = slice.indexOf("</figure>", match.index);
    if (close === -1) continue;
    if (/<img[\s>]/i.test(slice.slice(match.index, close))) return close;
  }
  return -1;
}

/**
 * Put the founder badge on the about photograph if it is not already there.
 *
 * Returns the html untouched whenever the page already has a badge, has no
 * about section, or has no photograph in it to hang one on — a badge with no
 * picture under it is a floating chip, which is worse than the absence.
 */
export function ensureFounderBadge(html: string | null, facts: FounderBadgeFacts): string | null {
  if (!html || html.includes("bs-founder-badge")) return html;

  // With neither a name nor a logo the badge would read "MD Roofing and
  // Solar / Local, family owned" beside the identical business name already
  // in the heading — a plate that says nothing new.
  if (!clean(facts.founder) && !facts.logoUrl) return html;

  const about = aboutSection(html);
  if (!about) return html;

  const slice = html.slice(about.start, about.end);
  const at = photoFrameClose(slice);
  if (at === -1) return html;

  const patched = slice.slice(0, at) + founderBadgeMarkup(facts) + slice.slice(at);
  return html.slice(0, about.start) + patched + html.slice(about.end);
}
