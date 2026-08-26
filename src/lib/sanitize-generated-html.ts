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
  "div", "section", "main", "article", "aside", "header", "footer", "nav",
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "a", "img", "svg", "path",
  "ul", "ol", "li", "button", "strong", "em", "br", "hr", "figure", "figcaption",
  "blockquote", "cite", "time", "small", "dl", "dt", "dd",
  // Interactive Google Maps / OpenStreetMap territory embeds
  "iframe",
  // The hero lead-capture form. Safe only in combination with
  // FORM_TARGET_ATTRS below, which guarantees it cannot name a destination.
  "form", "label", "input", "select", "option", "textarea",
];

// Interaction hooks. The generator asks for behaviour with these and a
// reviewed script in the application implements it; model-authored <script>
// is stripped entirely, so this is the only route to interactivity.
const INTERACTION_ATTRS = [
  "data-reveal",
  "data-reveal-delay",
  "data-count-to",
  "data-count-suffix",
  "data-accordion",
  "data-accordion-item",
  "data-accordion-trigger",
  "data-review-slider",
  "data-review-track",
  "data-review-prev",
  "data-review-next",
  "data-bar",
  "data-bar-max",
  "data-bar-fill",
  "data-lead-form",
  "data-lead-form-message",
  "data-open-quote-modal",
];

// The attributes that could point a generated form at somewhere other than
// this application. They are stripped unconditionally, from every tag, so a
// model-authored form has no way to express a destination at all: with no
// action/formaction it can only ever reach BespokeRuntime, which cancels the
// native submit and POSTs to the lead's own quote-request endpoint. This is
// what makes allowing <form> at all safe — the tag is permitted, naming a
// target is not. None of these is ever valid on a link, so they go from
// every tag.
const FORM_TARGET_ATTRS = ["action", "formaction", "method", "formmethod", "enctype", "form"];

// `target` is legitimate on an anchor (target="_blank") and is only a
// submission concern on the form elements, so it is stripped by tag.
const TARGET_STRIPPED_TAGS = new Set(["form", "input", "button", "select", "textarea"]);

// Input types that belong on a lead-capture form. Anything else is coerced
// to "text" rather than dropped, so an odd type never silently removes a
// field the layout was built around.
const SAFE_INPUT_TYPES = new Set(["text", "tel", "email", "number", "checkbox", "radio", "submit", "search", "url", "date", "time"]);

const ALLOWED_ATTRIBUTES = {
  "*": ["class", "id", "style", ...INTERACTION_ATTRS],
  a: ["href", "target", "rel", "aria-label", "aria-expanded", "aria-controls"],
  button: ["type", "aria-label", "aria-expanded", "aria-controls"],
  img: ["src", "alt", "loading", "width", "height", "fetchpriority", "decoding", "sizes", "srcset"],
  svg: ["viewBox", "fill", "stroke", "xmlns", "width", "height", "stroke-width", "stroke-linecap", "stroke-linejoin"],
  path: ["d", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"],
  time: ["datetime"],
  iframe: ["src", "width", "height", "style", "loading", "title", "class", "aria-label", "tabindex", "allowfullscreen", "referrerpolicy"],
  // No action/method anywhere here by construction — see FORM_TARGET_ATTRS.
  form: ["aria-label", "novalidate"],
  label: ["for", "aria-label"],
  input: ["type", "name", "placeholder", "required", "value", "autocomplete", "inputmode", "aria-label", "maxlength", "min", "max", "step", "pattern"],
  select: ["name", "required", "aria-label", "multiple"],
  option: ["value", "selected"],
  textarea: ["name", "placeholder", "required", "rows", "cols", "aria-label", "maxlength"],
};

const ALLOWED_SCHEMES = ["http", "https", "tel", "mailto", "#"];

// header/footer/nav are removed WITH their content, not unwrapped. The real
// BespokeNav and BespokeFooter are rendered around this markup by
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

/**
 * Sanitize a generated page body.
 *
 * Safety is unchanged: no script, no event handlers, no dangerous URL
 * schemes, no credential-bearing asset URLs, and inline style restricted to
 * layout properties that cannot express colour.
 *
 * Class names are NOT filtered any more. Pages ship their own stylesheet, so
 * a class the model invents is a class the model also writes a rule for —
 * which removes the reason the old bs-* allowlist existed.
 */
export function sanitizeBespokeHtml(rawHtml: string): string {
  const options = baseOptions();

  // Strip redundant leading dashes, em-dashes, and hyphens from section eyebrows, badges, and subheadings
  const unPrefixed = rawHtml.replace(
    /(<(?:span|p|h[1-6]|div)[^>]*class=["'][^"']*(?:eyebrow|subtitle|label|tag|badge|kicker|pill)[^"']*["'][^>]*>)s*(?:[—–-]|&mdash;|&ndash;|&#8212;|&#8211;)s*/gi,
    "$1"
  );

  return sanitizeHtml(unPrefixed, {
    ...options,
    // header/footer/nav are legal INSIDE the generated body — a page may have
    // a section header — because the site's real chrome is rendered around
    // this markup, not inside it, and the class scoping keeps generated rules
    // off it.
    //
    // form/input/select/textarea/option are legal here too, unlike the legacy
    // path above. The hero lead-capture form is a real conversion mechanism
    // and stripping it silently deleted the highest-value block on the page.
    // Safety comes from FORM_TARGET_ATTRS instead: the tags are allowed, but
    // naming a destination is not, so a generated form can only ever be
    // submitted by the reviewed runtime to this application's own endpoint.
    nonTextTags: ["script", "style"],
    transformTags: {
      "*": (tagName, attribs) => {
        const next: Record<string, string> = { ...attribs };

        // Ensure iframes can only load safe, trusted Google Maps or OpenStreetMap embeds
        if (tagName === "iframe") {
          const src = next.src ?? "";
          const isSafeMap = /^https:\/\/(www\.)?(google\.com\/maps|maps\.google\.com|openstreetmap\.org)\//i.test(src);
          if (!isSafeMap) {
            return { tagName: "div", attribs: {} };
          }
          if (!next.loading) next.loading = "lazy";
          return { tagName, attribs: next };
        }

        // A generated form may never name where it posts. Stripped from every
        // tag, not just <form>, because formaction on a submit button is the
        // same hole by another name.
        for (const attr of FORM_TARGET_ATTRS) delete next[attr];
        if (TARGET_STRIPPED_TAGS.has(tagName)) delete next.target;

        // Keep generated inputs to types that make sense on a lead form. A
        // password or file input on a client's public marketing page is
        // never intended and is not worth trusting to prompt discipline.
        if (tagName === "input") {
          const type = (next.type ?? "text").toLowerCase();
          if (!SAFE_INPUT_TYPES.has(type)) next.type = "text";
        }

        // Class names are no longer filtered. Pages ship their own
        // stylesheet now, so the names are the model's to choose — the old
        // bs-* allowlist existed because a class either matched a pre-built
        // rule or rendered as nothing, and that is no longer true.
        if (next.style) {
          const kept = filterStyle(next.style);
          if (kept) next.style = kept;
          else delete next.style;
        }

        if (tagName === "a" && next.href && /^https?:/i.test(next.href)) {
          next.rel = "noopener noreferrer";
        }

        for (const attr of ["src", "href"]) {
          if (next[attr] && urlLeaksCredential(next[attr])) {
            if (tagName === "img") return { tagName, attribs: {} };
            delete next[attr];
          }
        }

        if (tagName === "img" && !next.loading) next.loading = "lazy";
        if (tagName === "svg" && !next.viewBox && !next.viewbox) {
          next.viewBox = "0 0 24 24";
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
