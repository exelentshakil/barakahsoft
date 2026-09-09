import { VerticalProfileSchema } from "@/lib/verticals/types";
import { PROFILES } from "@/lib/verticals";
import { ICP_CATEGORIES, classifyIcp } from "@/lib/verticals/icp";

// Profiles are data the generator executes against, so a malformed one is a
// broken page rather than a type error. This validates every curated profile
// and proves the router lands each ICP category on a profile that exists.

let failed = false;

for (const profile of PROFILES) {
  const result = VerticalProfileSchema.safeParse(profile);
  if (!result.success) {
    failed = true;
    console.error(`\n${profile.slug} failed validation:`);
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
  }
}

const slugs = new Set(PROFILES.map((profile) => profile.slug));
for (const category of ICP_CATEGORIES) {
  if (!slugs.has(category.vertical)) {
    failed = true;
    console.error(`ICP "${category.slug}" routes to "${category.vertical}", which is not a registered profile.`);
  }
}

// A sample per category, so a pattern that stops matching is visible.
const SAMPLES: [string, string][] = [
  ["Emergency plumber and boiler repair", "local-services"],
  ["Family dental practice", "health-wellness"],
  ["Independent italian restaurant", "hospitality-food"],
  ["Hair salon and barber", "beauty-fitness"],
  ["Solicitors and conveyancing", "professional-services"],
  ["Florist and flower shop", "local-retail"],
  ["SaaS platform for field service teams", "tech-saas"],
  ["Wedding photographer", "creative-portfolio"],
  ["Local charity and community centre", "nonprofit-community"],
];

for (const [text, expected] of SAMPLES) {
  const { category } = classifyIcp({ industry: text, hasPhone: true, hasReviews: true });
  const mark = category.slug === expected ? "ok  " : "FAIL";
  if (category.slug !== expected) failed = true;
  console.log(`  ${mark} ${text.padEnd(42)} -> ${category.slug} (${category.fit})`);
}

if (failed) process.exit(1);
console.log(`\nverticals: ok (${PROFILES.length} profiles, ${ICP_CATEGORIES.length} ICP categories)`);
