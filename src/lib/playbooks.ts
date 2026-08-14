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
};

export function detectIndustry(facts: Facts): string {
  const haystack = JSON.stringify(facts).toLowerCase();
  let best: { slug: string; hits: number } | null = null;
  for (const [slug, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    const hits = keywords.filter((k) => haystack.includes(k)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { slug, hits };
  }
  return best?.slug ?? "home-services";
}
