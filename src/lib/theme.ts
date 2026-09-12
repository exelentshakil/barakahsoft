// The palette.
//
// Contrast is not solved here. It is made impossible.
//
// What this replaces was an OKLCH ramp solver, a capsize typography engine, a
// static CSS audit, a rendered audit in headless Chromium and a remediation
// pass — roughly 2,100 lines whose entire purpose was to stop generated text
// becoming unreadable against a generated background. None of that is needed
// if body copy only ever sits on white or on near-black, and the client's
// brand colour is confined to accents whose foreground we decide here.
//
// The brand colour never appears behind a paragraph. It appears on buttons, on
// an eyebrow label, on a rating mark, on a link, on a rule. That is also how
// the expensive end of the web uses colour, so the constraint that makes the
// page safe is the same one that makes it look considered.

export const NEUTRALS = {
  ink: "#0F1115",
  ink2: "#3D4350",
  ink3: "#6B7280",
  bg: "#FFFFFF",
  surface: "#F7F8FA",
  line: "#E4E7EC",
  invert: "#FFFFFF",
} as const;

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Normalise anything the scrape produced into `#rrggbb`, or null. */
export function normaliseHex(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.trim();
  if (!HEX.test(raw)) return null;
  const body = raw.replace(/^#/, "");
  const full = body.length === 3 ? body.split("").map((c) => c + c).join("") : body;
  return `#${full.toLowerCase()}`;
}

/**
 * Is white legible on this colour?
 *
 * One relative-luminance comparison, the WCAG formula, no solver and no
 * dependency. It is asked exactly one question — what goes on top of a
 * brand-coloured button — because that is the only place the brand colour is
 * ever allowed to sit underneath text.
 */
export function onBrand(hex: string): string {
  const safe = normaliseHex(hex) ?? DEFAULT_BRAND;
  const channel = (i: number) => {
    const v = parseInt(safe.slice(1 + i * 2, 3 + i * 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
  // 0.36 sits where white-on-colour and black-on-colour cross 4.5:1. Below it
  // white wins, above it near-black does.
  return luminance > 0.36 ? NEUTRALS.ink : NEUTRALS.invert;
}

/**
 * A brand colour too pale to read as an accent is not a brand colour.
 *
 * Scrapes return `#ffffff` and `#fafafa` often enough to matter — a site whose
 * only declared colour is its background. Accepting one would produce invisible
 * buttons, so it falls back to the house ink instead, which is never wrong.
 */
export const DEFAULT_BRAND = "#1F2A37";

export function resolveBrand(candidate: string | null | undefined): string {
  const hex = normaliseHex(candidate);
  if (!hex) return DEFAULT_BRAND;
  const channel = (i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
  const max = Math.max(channel(0), channel(1), channel(2));
  const min = Math.min(channel(0), channel(1), channel(2));
  const lightness = (max + min) / 2;
  const saturation = max === min ? 0 : (max - min) / (1 - Math.abs(2 * lightness - 1));
  // Near-white, near-black, or a grey with nothing to say.
  if (lightness > 0.9 || lightness < 0.06) return DEFAULT_BRAND;
  if (saturation < 0.08 && lightness > 0.75) return DEFAULT_BRAND;
  return hex;
}

/** The custom properties the generated page is required to build on. */
export function themeCss(brandHex: string): string {
  const brand = resolveBrand(brandHex);
  return `:root{
  --ink:${NEUTRALS.ink};
  --ink-2:${NEUTRALS.ink2};
  --ink-3:${NEUTRALS.ink3};
  --bg:${NEUTRALS.bg};
  --surface:${NEUTRALS.surface};
  --line:${NEUTRALS.line};
  --invert:${NEUTRALS.invert};
  --brand:${brand};
  --on-brand:${onBrand(brand)};
}`;
}

// ---------------------------------------------------------------- type
//
// Removing the capsize engine was right; leaving type unspecified is not. A
// model given no direction falls back to system-ui, and a page set in
// system-ui reads cheap no matter how good its layout is — which is the one
// thing a mockup sent to win work cannot afford.
//
// So: a short list of pairings that are known to work, chosen by trade. No
// metrics, no optical sizing, no solver. A good pair, named.

export interface FontPair {
  display: string;
  text: string;
  href: string;
}

const INTER = "Inter:wght@400;500;600";

function pair(display: string, displayFamily: string): FontPair {
  return {
    display: displayFamily,
    text: "Inter",
    href: `https://fonts.googleapis.com/css2?family=${display}&family=${INTER}&display=swap`,
  };
}

const PAIRS: { match: RegExp; pair: FontPair }[] = [
  // Trades and anything that has to read as capable rather than refined.
  {
    match: /roof|plumb|electric|build|construct|scaffold|paving|landscap|fenc|drain|heating|hvac|garage|remov|skip|joiner|carpent|glaz|render|damp|pest|clean|security|locksmith/i,
    pair: pair("Archivo:wght@400;500;600;700", "Archivo"),
  },
  // Beauty, wellbeing, hospitality — where warmth sells.
  {
    match: /salon|hair|beaut|skin|spa|clinic|aesthet|nail|lash|brow|massage|wellness|yoga|pilates|florist|bridal|photograph|interior|restaurant|cafe|bakery|patisserie|hotel|deli/i,
    pair: pair("Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600", "Fraunces"),
  },
  // Advice, and anyone who is trusted with money or a decision.
  {
    match: /law|solicit|legal|account|financ|advis|mortgage|insur|consult|survey|architect|engineer|recruit|wealth|tax|estate|chartered/i,
    pair: pair("Newsreader:wght@400;500;600", "Newsreader"),
  },
  // Clinical and veterinary.
  {
    match: /dental|dentist|doctor|medical|physio|chiro|osteo|optic|hearing|vet|podiat|therap|counsel|psycho/i,
    pair: pair("Sora:wght@400;500;600", "Sora"),
  },
  // Training, fitness, anything with momentum.
  {
    match: /gym|fitness|crossfit|strength|coach|academy|martial|boxing|swim|dance|driving|tutor|school|nursery/i,
    pair: pair("Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700", "Bricolage Grotesque"),
  },
];

const HOUSE = pair("Instrument+Sans:wght@400;500;600", "Instrument Sans");

/** The pairing this trade gets. Never system-ui. */
export function fontPairFor(industry: string, services: string[] = []): FontPair {
  const haystack = `${industry} ${services.join(" ")}`;
  return PAIRS.find((entry) => entry.match.test(haystack))?.pair ?? HOUSE;
}
