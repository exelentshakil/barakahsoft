import fs from "node:fs";
import path from "node:path";
import type { Facts } from "@/lib/ai";

export interface Playbook {
  slug: string;
  industry_label: string;
  converting_recipes: string[];
  local_seo_patterns: string[];
  facebook_ad_angles: string[];
  trust_signals: string[];
  forbidden_slop: string[];
  photo_queries: Record<string, string>;
  faq_seed_questions: string[];
  // v3 (Phase M) -- optional industry-specific cinematography language
  // appended to the generic Veo hero-video prompt (src/lib/google/veo.ts).
  // Optional so a playbook without one falls back to today's generic
  // sentence -- no breaking change.
  hero_video_cinematography?: string;
}

const PLAYBOOKS_DIR = path.join(process.cwd(), "playbooks");

// Playbook content lives as files (git-diffable, source of truth) — the
// playbooks table is only a lightweight index for the admin UI, per plan §2.
export function loadPlaybook(slug: string): Playbook {
  const filePath = path.join(PLAYBOOKS_DIR, `${slug}.json`);
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as Playbook;
}

export function listPlaybookSlugs(): string[] {
  return fs
    .readdirSync(PLAYBOOKS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

// detect_industry atom — cheap keyword match against facts.raw_text /
// facts.services rather than an AI call; a business's own on-site language
// (nav labels, service names) is a stronger signal than an LLM guess and
// costs nothing to run per lead.
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  "home-services": ["plumb", "electric", "roof", "hvac", "boiler", "heating", "removal", "moving", "cleaning", "landscap", "pest"],
  "karting-recreation": ["kart", "karting", "track", "racing", "grand prix", "arrive and drive"],
  // v4 Phase S2 — the two personas from the intake selector with no real
  // coverage in the two industries above.
  "salon-beauty": ["salon", "spa", "beauty", "hair", "nail", "esthetician", "barber", "lash", "microblading"],
  "agency-freelancer": ["agency", "freelance", "creative studio", "marketing agency", "design studio", "consultant", "consultancy"],
};

// v4 Phase R3 — a persona explicitly self-identified at intake is a
// stronger signal than post-hoc keyword scraping for the two personas that
// map cleanly onto a real distinct playbook. The other persona slugs stay
// on keyword detection below — too generic a self-label ("local business
// owner", "solo service provider", "other") to safely force one industry.
const PERSONA_INDUSTRY_OVERRIDE: Record<string, string> = {
  "salon-beauty": "salon-beauty",
  "agency-freelancer": "agency-freelancer",
  "contractor-tradesperson": "home-services",
  "home-service-business-owner": "home-services",
};

export function detectIndustry(facts: Facts, persona?: string | null): string {
  if (persona && PERSONA_INDUSTRY_OVERRIDE[persona]) return PERSONA_INDUSTRY_OVERRIDE[persona];

  const haystack = JSON.stringify(facts).toLowerCase();
  let best: { slug: string; hits: number } | null = null;
  for (const [slug, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const hits = keywords.filter((k) => haystack.includes(k)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { slug, hits };
  }
  return best?.slug ?? "home-services";
}
