import { createAdminClient } from "@/lib/supabase/admin";
import { DesignDnaSchema, DEFAULT_DESIGN_DNA, type DesignDna } from "@/lib/design-dna";

// Automatic design direction.
//
// Pasting a reference URL on every lead is friction on the step that most
// decides whether the result sells itself, and it assumes the operator has
// a good site to hand at that exact moment. So a direction is chosen
// automatically and the operator overrides it only when they disagree.
//
// Two sources, in order:
//
//   1. The saved library — references the operator curated themselves, with
//      their extracted DNA cached. They know which sites in their trades are
//      genuinely good; the system should not pretend to.
//
//   2. House presets — real, opinionated directions per trade family, used
//      before the library has anything for an industry.
//
// Deliberately NOT a hardcoded list of third-party URLs to scrape on demand.
// Those rot: sites redesign, go down, or start blocking crawlers, and each
// failure silently degrades every generation for that industry with nothing
// to indicate why.

interface Preset {
  match: RegExp;
  label: string;
  dna: DesignDna;
}

/**
 * House directions.
 *
 * Each is a complete, committed look rather than a safe average — an
 * averaged direction is exactly the generic result this system exists to
 * avoid. Palettes are chosen for how the trade actually presents itself:
 * urgency and high contrast where the customer is in trouble, calm and
 * editorial where they are choosing at leisure.
 */
const PRESETS: Preset[] = [
  {
    match: /electric|electrical|solar|ev charger|generator/i,
    label: "Electrical — high-contrast utility",
    dna: {
      sourceName: "House direction · Electrical",
      mood: "bold-utility",
      palette: {
        primary: "#F5A524",
        accent: "#FFD666",
        surface: "#FFFFFF",
        surfaceAlt: "#F5F6F8",
        ink: "#161A21",
        inkMuted: "#5B6270",
        onPrimary: "#161A21",
      },
      typography: {
        displayFamily: "Archivo",
        bodyFamily: "Inter",
        displayWeight: "800",
        scale: "balanced",
        headingCase: "sentence",
      },
      geometry: { radius: "soft", elevation: "soft", borderTreatment: "hairline" },
      layout: {
        heroTreatment: "full-bleed-image",
        sectionRhythm: "generous",
        imageDensity: "balanced",
        serviceLayout: "feature-grid",
        proofStyle: "review-carousel",
        },
      motifs: [
        "amber call-to-action buttons on dark navy",
        "credential pills sitting directly under the headline",
        "full-width dark band for the emergency call to action",
      ],
      rationale: "Urgency-led without shouting: a dark, confident ground with one warm high-visibility accent reserved for actions.",
    },
  },
  {
    match: /roof|siding|gutter|exterior/i,
    label: "Roofing — heavy, photographic",
    dna: {
      sourceName: "House direction · Roofing",
      mood: "dark-premium",
      palette: {
        primary: "#C2410C",
        accent: "#F59E0B",
        surface: "#FFFFFF",
        surfaceAlt: "#F4F2EF",
        ink: "#1A1614",
        inkMuted: "#57514C",
        onPrimary: "#FFFFFF",
      },
      typography: {
        displayFamily: "Bricolage Grotesque",
        bodyFamily: "Inter",
        displayWeight: "800",
        scale: "dramatic",
        headingCase: "sentence",
      },
      geometry: { radius: "sharp", elevation: "dramatic", borderTreatment: "none" },
      layout: {
        heroTreatment: "full-bleed-image",
        sectionRhythm: "cinematic",
        imageDensity: "gallery-led",
        serviceLayout: "bento-grid",
        proofStyle: "stat-band",
      },
      motifs: [
        "edge-to-edge project photography with no gutters",
        "oversized outlined numerals marking each stage",
        "diagonal section edges between light and dark bands",
      ],
      rationale: "The work is visual and expensive, so the photography carries the page and the type stays out of its way.",
    },
  },
  {
    match: /plumb|hvac|heating|cooling|air condition|drain|boiler/i,
    label: "Plumbing & HVAC — calm and dependable",
    dna: {
      sourceName: "House direction · Plumbing & HVAC",
      mood: "clinical-trust",
      palette: {
        primary: "#0E5A8A",
        accent: "#38BDF8",
        surface: "#FFFFFF",
        surfaceAlt: "#F1F5F9",
        ink: "#111827",
        inkMuted: "#4B5563",
        onPrimary: "#FFFFFF",
      },
      typography: {
        displayFamily: "Manrope",
        bodyFamily: "Inter",
        displayWeight: "700",
        scale: "balanced",
        headingCase: "sentence",
      },
      geometry: { radius: "rounded", elevation: "soft", borderTreatment: "hairline" },
      layout: {
        heroTreatment: "split-editorial",
        sectionRhythm: "generous",
        imageDensity: "balanced",
        serviceLayout: "feature-grid",
        proofStyle: "quote-cards",
      },
      motifs: [
        "numbered what-happens-next process row",
        "response-time promise stated as a large figure",
        "soft blue wash behind the proof section",
      ],
      rationale: "The customer is stressed and comparing; calm, legible and specific beats loud.",
    },
  },
  {
    match: /landscap|lawn|garden|tree|pool|fenc|deck|paving|concrete|driveway/i,
    label: "Outdoor trades — warm and crafted",
    dna: {
      sourceName: "House direction · Outdoor trades",
      mood: "warm-craft",
      palette: {
        primary: "#3F6212",
        accent: "#CA8A04",
        surface: "#FDFCF9",
        surfaceAlt: "#F1EFE7",
        ink: "#1C1917",
        inkMuted: "#57534E",
        onPrimary: "#FFFFFF",
      },
      typography: {
        displayFamily: "Fraunces",
        bodyFamily: "Inter",
        displayWeight: "700",
        scale: "dramatic",
        headingCase: "sentence",
      },
      geometry: { radius: "rounded", elevation: "soft", borderTreatment: "hairline" },
      layout: {
        heroTreatment: "split-editorial",
        sectionRhythm: "cinematic",
        imageDensity: "gallery-led",
        serviceLayout: "editorial-list",
        proofStyle: "quote-cards",
      },
      motifs: [
        "before-and-after image pairs",
        "warm paper ground rather than pure white",
        "seasonal service list set as an editorial column",
      ],
      rationale: "Considered rather than urgent: the buyer is imagining a result, so the page should feel like a portfolio.",
    },
  },
  {
    match: /clean|pest|restoration|removal|junk|mov(er|ing)|locksmith|handyman/i,
    label: "Rapid response — direct and reassuring",
    dna: {
      sourceName: "House direction · Rapid response",
      mood: "bold-utility",
      palette: {
        primary: "#1D4ED8",
        accent: "#22C55E",
        surface: "#FFFFFF",
        surfaceAlt: "#F1F5F9",
        ink: "#0F172A",
        inkMuted: "#475569",
        onPrimary: "#FFFFFF",
      },
      typography: {
        displayFamily: "Plus Jakarta Sans",
        bodyFamily: "Inter",
        displayWeight: "800",
        scale: "balanced",
        headingCase: "sentence",
      },
      geometry: { radius: "rounded", elevation: "soft", borderTreatment: "hairline" },
      layout: {
        heroTreatment: "gradient-statement",
        sectionRhythm: "generous",
        imageDensity: "hero-led",
        serviceLayout: "feature-grid",
        proofStyle: "stat-band",
      },
      motifs: [
        "response window stated as an oversized figure",
        "green reassurance ticks against a blue ground",
        "sticky call band that stays visible while scrolling",
      ],
      rationale: "Speed is the product, so the page leads with how fast someone answers and makes calling unmissable.",
    },
  },
  {
    match: /law|legal|attorney|account|financ|insur|consult|advis/i,
    label: "Professional services — editorial authority",
    dna: {
      sourceName: "House direction · Professional services",
      mood: "light-editorial",
      palette: {
        primary: "#1E3A5F",
        accent: "#B08D57",
        surface: "#FCFCFD",
        surfaceAlt: "#F1F2F5",
        ink: "#14181F",
        inkMuted: "#4E5560",
        onPrimary: "#FFFFFF",
      },
      typography: {
        displayFamily: "Instrument Serif",
        bodyFamily: "Inter",
        displayWeight: "600",
        scale: "dramatic",
        headingCase: "sentence",
      },
      geometry: { radius: "sharp", elevation: "flat", borderTreatment: "hairline" },
      layout: {
        heroTreatment: "split-editorial",
        sectionRhythm: "cinematic",
        imageDensity: "hero-led",
        serviceLayout: "editorial-list",
        proofStyle: "quote-cards",
      },
      motifs: [
        "serif display headline against generous whitespace",
        "hairline rules separating practice areas",
        "restrained gold accent used once per section",
      ],
      rationale: "Authority reads as restraint: fewer elements, more space, and type doing the persuading.",
    },
  },
  {
    match: /salon|spa|beauty|barber|aesthetic|wellness|dental|clinic|medic|therap/i,
    label: "Health & beauty — soft editorial",
    dna: {
      sourceName: "House direction · Health & beauty",
      mood: "light-editorial",
      palette: {
        primary: "#9D5C63",
        accent: "#E0B0A0",
        surface: "#FDFBFA",
        surfaceAlt: "#F5EEEB",
        ink: "#1F1A19",
        inkMuted: "#5D5350",
        onPrimary: "#FFFFFF",
      },
      typography: {
        displayFamily: "Cormorant Garamond",
        bodyFamily: "Inter",
        displayWeight: "600",
        scale: "dramatic",
        headingCase: "sentence",
      },
      geometry: { radius: "pill", elevation: "flat", borderTreatment: "hairline" },
      layout: {
        heroTreatment: "full-bleed-image",
        sectionRhythm: "cinematic",
        imageDensity: "gallery-led",
        serviceLayout: "editorial-list",
        proofStyle: "quote-cards",
      },
      motifs: [
        "full-height portrait imagery",
        "pill-shaped booking button repeated down the page",
        "treatment menu set as a priced editorial list",
      ],
      rationale: "The buyer is choosing on feel, so the page is calm, tactile and photograph-led.",
    },
  },
];

/** The house direction for an industry, before the library has anything. */
export function presetFor(industry: string | null | undefined): { label: string; dna: DesignDna } {
  const text = (industry ?? "").trim();
  if (text) {
    const hit = PRESETS.find((p) => p.match.test(text));
    if (hit) return { label: hit.label, dna: hit.dna };
  }
  return { label: "House default direction", dna: DEFAULT_DESIGN_DNA };
}

export interface LibraryEntry {
  id: string;
  industry: string;
  label: string;
  source_url: string | null;
  is_house: boolean;
}

/** References the operator has curated, newest first. */
export async function listLibrary(): Promise<LibraryEntry[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("design_references")
    .select("id, industry, label, source_url, is_house")
    .order("created_at", { ascending: false })
    .returns<LibraryEntry[]>();
  return data ?? [];
}

/**
 * Pick a direction for a lead automatically.
 *
 * A curated reference for the industry always wins over a house preset —
 * the operator knows which sites in their trades are genuinely good, and
 * that judgement should not be overridden by a built-in default.
 */
export async function autoSelectDna(
  industry: string | null | undefined
): Promise<{ dna: DesignDna; label: string; sourceUrl: string | null; from: "library" | "preset" }> {
  const text = (industry ?? "").trim();

  if (text) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("design_references")
      .select("label, source_url, dna, industry")
      .order("created_at", { ascending: false })
      .returns<{ label: string; source_url: string | null; dna: unknown; industry: string }[]>();

    // Loose matching in both directions: a reference saved for "roofing"
    // should serve a lead whose industry reads "Roofing & Siding", and the
    // reverse.
    const lower = text.toLowerCase();
    const match = (data ?? []).find((row) => {
      const ref = row.industry.toLowerCase();
      return lower.includes(ref) || ref.includes(lower);
    });

    if (match) {
      const parsed = DesignDnaSchema.safeParse(match.dna);
      if (parsed.success) {
        return { dna: parsed.data, label: match.label, sourceUrl: match.source_url, from: "library" };
      }
    }
  }

  const preset = presetFor(text);
  return { dna: preset.dna, label: preset.label, sourceUrl: null, from: "preset" };
}

/**
 * Auto-select, researching the trade first if the library has nothing.
 *
 * Split from autoSelectDna so callers that must stay fast (a UI read) do not
 * accidentally trigger minutes of research, while the scrape job — which is
 * already a background job and already the right moment — does.
 */
export async function autoSelectOrResearch(
  industry: string | null | undefined
): Promise<{ dna: DesignDna; label: string; sourceUrl: string | null; from: "library" | "preset" | "research" }> {
  const existing = await autoSelectDna(industry);
  if (existing.from === "library") return existing;

  const text = (industry ?? "").trim();
  if (!text) return existing;

  // Imported lazily: research pulls in Firecrawl search and the DNA
  // extractor, neither of which belongs in the hot path of a library read.
  const { researchAndCache } = await import("@/lib/research-design-reference");
  const researched = await researchAndCache(text);
  return { dna: researched.dna, label: researched.label, sourceUrl: researched.sourceUrl, from: researched.from };
}

/** Save a reference so every future lead in this industry gets it automatically. */
export async function saveToLibrary(
  industry: string,
  label: string,
  dna: DesignDna,
  sourceUrl: string | null
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("design_references").insert({
    industry: industry.trim(),
    label: label.trim().slice(0, 120),
    source_url: sourceUrl,
    dna,
  });
}
