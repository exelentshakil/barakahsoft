import fs from "node:fs";
import path from "node:path";

// No hardcoded platform identity on a path a partner's prospect can reach.
//
// The most likely visible failure of a white-label build is not a crash: it is
// a partner's client receiving a proposal branded KeyGrowth, signed BarakahSoft
// LLC, from hello@barakahsoft.com, linking to portal.barakahsoft.com. Every one
// of those was a literal compiled into a shared file.
//
// So the files that produce partner-visible output are checked for the
// platform's own identity, and for the two process-global origin variables
// that a per-tenant origin replaced.

const BANNED: { pattern: RegExp; why: string }[] = [
  { pattern: /barakahsoft/i, why: "platform brand — read it from the tenant" },
  { pattern: /\+1 ?\(?307\)? ?533-?6678/, why: "platform phone — use tenant.brand.phoneE164" },
  { pattern: /NEXT_PUBLIC_(SITE|PORTAL)_URL/, why: "process-global origin — use tenant.siteBaseUrl / portalBaseUrl" },
];

/** Files whose output reaches someone who bought from a partner. */
const GUARDED = [
  "src/lib/notifications.ts",
  "src/lib/deliver.ts",
  "src/lib/close-plan.ts",
  "src/lib/outreach/sequence.ts",
  "src/app/api/outreach/send/route.ts",
  "src/app/api/leads/[id]/deliver/route.ts",
  "src/app/api/stripe/checkout/route.ts",
  "src/components/portal/sections/ProposalHeader.tsx",
  "src/components/portal/sections/ProposalFooter.tsx",
  "src/components/portal/sections/ProposalDecisionBox.tsx",
  "src/components/portal/sections/ProposalCheckoutModal.tsx",
];

/**
 * The platform's own defaults, which are correct where they are.
 *
 * notifications.ts keeps env-var fallbacks for the platform tenant, and
 * sequence.ts falls back to the platform name when a caller supplies no sender.
 * Both are reached only when no tenant identity was passed, which for a
 * partner would already be a bug elsewhere.
 */
const ALLOWED_LINE = /^\s*(\/\/|\*|\/\*)|const fromEmail = \(\)|const senderName = \(\)|\|\| "BarakahSoft"/;

const failures: string[] = [];

for (const file of GUARDED) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) {
    failures.push(`${file}: guarded file is missing — update scripts/check-branding.ts`);
    continue;
  }
  const lines = fs.readFileSync(full, "utf-8").split("\n");
  lines.forEach((line, index) => {
    if (ALLOWED_LINE.test(line)) return;
    for (const { pattern, why } of BANNED) {
      if (pattern.test(line)) {
        failures.push(`${file}:${index + 1}  ${why}\n    ${line.trim().slice(0, 110)}`);
      }
    }
  });
}

if (failures.length > 0) {
  console.error("\nHardcoded platform identity on partner-visible paths:\n");
  for (const failure of failures) console.error(`  ${failure}`);
  console.error("\nResolve the tenant instead — src/lib/tenant.ts, or tenantBySlug(lead.tenant_slug).\n");
  process.exit(1);
}

console.log(`branding: ok (${GUARDED.length} partner-visible files checked)`);
