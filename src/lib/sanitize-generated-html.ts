import sanitizeHtml from "sanitize-html";

// The safety boundary for markup that a model wrote and a real client's
// site renders. Nothing generated is stored or displayed before passing
// through here: <script>, every event-handler attribute, and every URL
// scheme except http/https/tel/mailto/# are removed.
//
// v9 adds a second, separate guarantee on top of safety: BRAND INTEGRITY.
// Generated pages are now authored against the closed `bs-*` vocabulary in
// src/app/bespoke.css, so sanitizeBespokeHtml drops any class outside that
// vocabulary. A page therefore cannot express a literal color, an
// arbitrary font, or a class that resolves to no CSS at all — which is
// what previously made generated pages look broken regardless of how good
// the prompt was (Tailwind's content scanner cannot see markup stored in
// the database, so AI-authored utility classes silently produced nothing).

const ALLOWED_TAGS = [
  "div", "section", "main", "article", "aside",
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "a", "img", "svg", "path",
  "ul", "ol", "li", "button", "strong", "em", "br", "hr", "figure", "figcaption",
  "blockquote", "cite", "time", "small", "dl", "dt", "dd",
];

const ALLOWED_ATTRIBUTES = {
  "*": ["class", "id", "style"],
  a: ["href", "target", "rel"],
  img: ["src", "alt", "loading", "width", "height"],
  svg: ["viewBox", "fill", "stroke", "xmlns", "width", "height", "stroke-width", "stroke-linecap", "stroke-linejoin"],
  path: ["d", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"],
  time: ["datetime"],
};

const ALLOWED_SCHEMES = ["http", "https", "tel", "mailto", "#"];

// header/footer/nav are removed WITH their content, not unwrapped. The real
// MegaMenu and PremiumFooter are rendered around this markup by
// BespokeHomepage; a model-authored nav produced a visible double header
// whose links pointed at pages that may not exist.
const STRIPPED_WITH_CONTENT = ["script", "style", "textarea", "option", "header", "footer", "nav", "form", "input", "iframe"];

function baseOptions(): sanitizeHtml.IOptions {
  return {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ALLOWED_SCHEMES,
    allowProtocolRelative: false,
    allowedSchemesByTag: { a: [...ALLOWED_SCHEMES] },
    disallowedTagsMode: "discard",
    nonTextTags: STRIPPED_WITH_CONTENT,
    exclusiveFilter: (frame) => !!frame.attribs && Object.keys(frame.attribs).some((a) => a.toLowerCase().startsWith("on")),
  };
}

export function sanitizeGeneratedHtml(rawHtml: string): string {
  return sanitizeHtml(rawHtml, baseOptions());
}

// Layout-only inline styles. Deliberately excludes every color-bearing
// property (color, background, border-color, fill, box-shadow) so inline
// style cannot become a back door around the token palette, and excludes
// position/z-index so generated markup cannot escape its section or cover
// the real nav. Grid/flex sizing is genuinely useful for bespoke
// composition and carries no such risk.
const SAFE_STYLE_PROPS = new Set([
  "grid-template-columns", "grid-template-rows", "grid-column", "grid-row",
  "gap", "row-gap", "column-gap",
  "aspect-ratio", "max-width", "min-width", "max-height", "min-height",
  "order", "flex", "flex-basis", "align-self", "justify-self",
  "text-align", "letter-spacing", "line-height", "text-transform",
  "margin-top", "margin-bottom", "margin-inline", "padding-block", "padding-inline",
  "object-position", "opacity",
]);

// CONFIRMED PRODUCTION LEAK: generated pages embedded Google Places photo
// URLs verbatim, and those URLs carry `key=AIza...` -- the account's Places
// API key was written into the database and served in public page source on
// every delivered site. The durable fix is mirroring photos into Storage so
// no key-bearing URL is ever a candidate (see the media pipeline), but this
// is the backstop that makes it structurally impossible to publish one:
// any URL carrying something shaped like a credential is dropped here,
// whatever produced it.
const CREDENTIAL_IN_URL = /[?&](key|api_?key|token|access_token|signature|sig)=/i;

function urlLeaksCredential(url: string): boolean {
  return CREDENTIAL_IN_URL.test(url) || /AIza[0-9A-Za-z_-]{20,}/.test(url) || /sk-[0-9A-Za-z_-]{20,}/.test(url);
}

// url(), expression(), and CSS escapes are the classic vectors for smuggling
// a request or a script through a style attribute.
const UNSAFE_STYLE_VALUE = /url\s*\(|expression\s*\(|javascript:|@import|\\/i;

function filterStyle(style: string): string {
  return style
    .split(";")
    .map((decl) => decl.trim())
    .filter(Boolean)
    .filter((decl) => {
      const idx = decl.indexOf(":");
      if (idx < 1) return false;
      const prop = decl.slice(0, idx).trim().toLowerCase();
      const value = decl.slice(idx + 1).trim();
      if (!SAFE_STYLE_PROPS.has(prop)) return false;
      if (UNSAFE_STYLE_VALUE.test(value)) return false;
      return value.length > 0 && value.length < 120;
    })
    .join("; ");
}

// The single source of truth for what a bespoke page may reference. Kept in
// sync with src/app/bespoke.css by the `bs-` prefix rule rather than an
// exhaustive list: any bs-* class that does not exist in the stylesheet
// simply has no effect, which is inert, while a NON-bs class is the actual
// risk (it could be a Tailwind color utility, and those do resolve).
const BESPOKE_CLASS = /^bs-[a-z0-9-]+$/;

function filterClasses(className: string): string {
  return className
    .split(/\s+/)
    .filter((c) => BESPOKE_CLASS.test(c))
    .join(" ");
}

/**
 * Sanitize markup generated against the bespoke design-token vocabulary.
 * Same safety guarantees as sanitizeGeneratedHtml, plus class and inline-
 * style filtering so the page is structurally incapable of rendering
 * off-brand or referencing CSS that does not exist.
 */
export function sanitizeBespokeHtml(rawHtml: string): string {
  const options = baseOptions();

  return sanitizeHtml(rawHtml, {
    ...options,
    transformTags: {
      "*": (tagName, attribs) => {
        const next: Record<string, string> = { ...attribs };

        if (next.class) {
          const kept = filterClasses(next.class);
          if (kept) next.class = kept;
          else delete next.class;
        }

        if (next.style) {
          const kept = filterStyle(next.style);
          if (kept) next.style = kept;
          else delete next.style;
        }

        // Every outbound link opens safely; internal anchors are untouched.
        if (tagName === "a" && next.href && /^https?:/i.test(next.href)) {
          next.rel = "noopener noreferrer";
        }

        // Drop, rather than publish, any asset URL carrying a credential.
        // A missing image is a cosmetic problem; a leaked API key is not.
        for (const attr of ["src", "href"]) {
          if (next[attr] && urlLeaksCredential(next[attr])) {
            if (tagName === "img") return { tagName, attribs: {} };
            delete next[attr];
          }
        }

        // A generated page can reference dozens of photos. Anything below
        // the fold should not block first paint.
        if (tagName === "img" && !next.loading) {
          next.loading = "lazy";
        }

        return { tagName, attribs: next };
      },
    },
  });
}

// Retained for the legacy Tailwind-authored generation path (pre-v9 leads
// whose stored markup uses bg-primary/text-primary utilities). New
// generation goes through sanitizeBespokeHtml and does not need it: the
// token vocabulary has no channel through which an off-brand color could
// be written in the first place.
const ACCENT_COLOR_CLASS = /\b(bg|text|border|from|to|via|ring|fill|stroke|decoration|divide|outline|accent|caret)-(red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g;

const PROPERTY_TO_PRIMARY_CLASS: Record<string, string> = {
  bg: "bg-primary",
  text: "text-primary",
  border: "border-primary",
  ring: "ring-primary",
  fill: "fill-primary",
  stroke: "stroke-primary",
  decoration: "decoration-primary",
  divide: "divide-primary",
  outline: "outline-primary",
  accent: "accent-primary",
  caret: "caret-primary",
  from: "from-primary",
  to: "to-primary",
  via: "via-primary",
};

export function enforceBrandColor(html: string): string {
  return html.replace(ACCENT_COLOR_CLASS, (_match, property: string) => PROPERTY_TO_PRIMARY_CLASS[property] ?? "text-primary");
}
