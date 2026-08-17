import sanitizeHtml from "sanitize-html";

// v8 -- the real safety net now that homepage generation produces actual
// HTML/Tailwind markup from Gemini instead of an enum pick from a vetted
// component catalog. Nothing generated is ever stored or rendered before
// passing through this: strips <script>, every event-handler attribute
// (onclick, onload, ...), javascript:/data: URLs, and any tag/attribute
// not on the explicit allowlist below. This is the boundary that makes
// "the AI can write arbitrary HTML" survivable -- it can never inject a
// script or an event handler, only markup and classes.
const ALLOWED_TAGS = [
  "div", "section", "header", "footer", "nav", "main", "article", "aside",
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "span", "a", "img", "svg", "path",
  "ul", "ol", "li", "button", "strong", "em", "br", "hr", "figure", "figcaption",
  "blockquote", "cite", "time",
];

const ALLOWED_ATTRIBUTES = {
  "*": ["class", "id"],
  a: ["href", "target", "rel"],
  img: ["src", "alt", "loading", "width", "height"],
  svg: ["viewBox", "fill", "stroke", "xmlns", "width", "height"],
  path: ["d", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"],
  time: ["datetime"],
};

// Only these real, harmless URL schemes survive on href/src -- blocks
// javascript:, data: (except real inline images, still risky, excluded),
// vbscript:, and anything else.
const ALLOWED_SCHEMES = ["http", "https", "tel", "mailto", "#"];

export function sanitizeGeneratedHtml(rawHtml: string): string {
  return sanitizeHtml(rawHtml, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ALLOWED_SCHEMES,
    allowProtocolRelative: false,
    // Anchors like href="#services" don't have a scheme sanitize-html
    // recognizes by default -- allow bare "#..." explicitly rather than
    // loosening the real scheme allowlist.
    allowedSchemesByTag: { a: [...ALLOWED_SCHEMES] },
    disallowedTagsMode: "discard",
    exclusiveFilter: (frame) => frame.attribs && Object.keys(frame.attribs).some((a) => a.toLowerCase().startsWith("on")),
  });
}

// v8 -- real bug found on first live test: despite an explicit prompt
// instruction to use only the brand-aware utility classes (bg-primary,
// text-primary, bg-gradient-primary, ...), the model used zero of them and
// instead picked its own fixed accent palette (amber/slate) throughout --
// meaning every lead would render with the same generic colors regardless
// of their own real brand color. Prompt compliance on a single abstract
// instruction across a long generation isn't reliable enough to trust
// alone, so this is a deterministic backstop: every non-neutral Tailwind
// color utility (any accent family -- amber, blue, emerald, etc.) gets
// rewritten to the equivalent brand-aware primary utility. Neutral
// grayscale classes (slate/gray/zinc/neutral/stone/white/black) are left
// alone -- real premium sites need real neutral text/border/background
// colors, only the *accent* color needs to be this lead's real brand color.
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
