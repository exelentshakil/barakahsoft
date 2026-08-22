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
  hero_video_cinematography?: string;
}

const PLAYBOOKS_DIR = path.join(process.cwd(), "playbooks");

export function loadPlaybook(slug: string): Playbook {
  const filePath = path.join(PLAYBOOKS_DIR, `${slug}.json`);
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as Playbook;
  }
  // Fallback to home-services base playbook if specific playbook file doesn't exist
  const defaultPath = path.join(PLAYBOOKS_DIR, "home-services.json");
  const raw = fs.readFileSync(defaultPath, "utf-8");
  return JSON.parse(raw) as Playbook;
}

export function listPlaybookSlugs(): string[] {
  return fs
    .readdirSync(PLAYBOOKS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

const INDUSTRY_REGEXES: Record<string, RegExp[]> = {
  "tech-saas": [
    /\b(software|platform|fintech|payment|api|infrastructure|saas|developer|database|cloud)\b/i,
  ],
  "agency-freelancer": [
    /\b(marketing agency|strategic marketing|consultant|consulting|growth agency|creative studio|fractional cmo|coaching|automation)\b/i,
  ],
  "home-services": [
    /\b(plumber|plumbing|electrician|electrical|roofing|roofer|hvac|air conditioning|heating|furnace|contractor|remodeling|restoration|movers|moving)\b/i,
  ],
  "healthcare-medical": [
    /\b(dentist|dental|doctor|clinic|medical|chiropractor|orthodontist|pediatric|surgeon)\b/i,
  ],
  "salon-beauty": [
    /\b(hair salon|nail salon|barbershop|esthetician|medspa|skincare clinic|hair stylist)\b/i,
  ],
  "karting-recreation": [
    /\b(karting|racing track|grand prix|amusement park|axe throwing)\b/i,
  ],
};

export function detectIndustry(facts: Facts, persona?: string | null): string {
  const haystack = `${facts.business_name || ""} ${JSON.stringify(facts.pages || "")} ${facts.markdown || ""}`.toLowerCase();

  for (const [slug, regexList] of Object.entries(INDUSTRY_REGEXES)) {
    for (const rx of regexList) {
      if (rx.test(haystack)) {
        return slug;
      }
    }
  }

  return "agency-freelancer";
}
