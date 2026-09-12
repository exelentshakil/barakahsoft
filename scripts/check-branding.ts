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
  // A postal address is the leak that carries neither the brand name nor the
  // phone number, so the two patterns above miss it entirely — the platform's
  // Wyoming address sat in the shared footer and would have printed under a
  // Belfast studio's logo.
  { pattern: /\b(Sheridan,?\s*WY|WY\s*82801|N\.?\s*Gould St)/i, why: "platform address — use landing.contact.addressLines" },
];

/** Files whose output reaches someone who bought from a partner. */
const GUARDED = [
  "src/lib/notifications.ts",
  "src/lib/deliver.ts",
  "src/lib/outreach/sequence.ts",
  "src/app/api/outreach/send/route.ts",
  "src/app/api/leads/[id]/deliver/route.ts",
  "src/components/portal/sections/ProposalHeader.tsx",
  "src/components/portal/sections/ProposalFooter.tsx",
  "src/components/portal/sections/ProposalDecisionBox.tsx",
  "src/components/landing/Nav.tsx",
  "src/components/landing/Footer.tsx",
  "src/components/landing/Hero.tsx",
  "src/components/landing/CookieConsent.tsx",
  "src/components/landing/PartnerLanding.tsx",
  "src/app/layout.tsx",
  "src/app/admin/layout.tsx",
  "src/app/api/s/[leadSlug]/events/route.ts",
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

/**
 * Comment bodies, including JSX ones.
 *
 * A prose line inside a {/* ... *\/} block explaining WHY the platform's pixel
 * must not fire on a partner's domain has to be allowed to name the platform;
 * rewording the explanation to satisfy a grep would make the comment worse.
 * Tracked as a state machine rather than per-line, because a JSX comment's
 * middle lines carry no marker of their own.
 */
function stripComments(lines: string[]): string[] {
  let inBlock = false;
  return lines.map((line) => {
    let out = line;
    if (inBlock) {
      const end = out.indexOf("*/");
      if (end === -1) return "";
      out = out.slice(end + 2);
      inBlock = false;
    }
    const start = out.indexOf("/*");
    if (start !== -1) {
      const end = out.indexOf("*/", start + 2);
      if (end === -1) {
        inBlock = true;
        return out.slice(0, start);
      }
      out = out.slice(0, start) + out.slice(end + 2);
    }
    return out;
  });
}

const failures: string[] = [];

for (const file of GUARDED) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) {
    failures.push(`${file}: guarded file is missing — update scripts/check-branding.ts`);
    continue;
  }
  const raw = fs.readFileSync(full, "utf-8").split("\n");
  const lines = stripComments(raw);
  lines.forEach((line, index) => {
    if (ALLOWED_LINE.test(line)) return;
    for (const { pattern, why } of BANNED) {
      if (pattern.test(line)) {
        failures.push(`${file}:${index + 1}  ${why}\n    ${raw[index].trim().slice(0, 110)}`);
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
