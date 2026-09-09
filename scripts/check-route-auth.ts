import fs from "node:fs";
import path from "node:path";

// Every route that uses the service-role client must gate first.
//
// createAdminClient bypasses RLS by definition, so on those paths the database
// will never refuse a read. The gate is the handler, and a handler that forgets
// one is not a subtle bug — it is one brand's operator reading another's leads,
// or an anonymous caller deleting them. Fifteen routes had exactly that: they
// checked auth.getUser(), which proves someone completed a magic link and
// nothing else, and then used the service role anyway.
//
// This is a lint rule, not a test. It runs in a second, it needs no fixtures,
// and its job is to make the next route that forgets fail loudly at commit
// time rather than quietly in production.

const API_DIR = path.join(process.cwd(), "src", "app", "api");

/** Accepted gates, in rough order of how often they should appear. */
const GATES = [
  "assertLeadInTenant", // per-lead: authenticates AND proves ownership
  "operatorLead",
  "requireOperator", // operator, no lead in the path
  "isAdminSession", // legacy operator check, still valid
  "isVisualQaWorker", // bearer token, for the local Playwright worker
  "constructEvent", // Stripe webhook signature
];

/**
 * Routes that are public on purpose.
 *
 * Each entry is a deliberate decision, not an oversight — adding one should
 * take an argument, so they are listed with the reason they are safe.
 */
const PUBLIC_ROUTES: Record<string, string> = {
  "intake/route.ts": "public lead-capture form on the marketing site",
  "inngest/route.ts": "Inngest's own signed handler",
  "image-proxy/route.ts": "public asset proxy, SSRF-hardened in fetch-site.ts",
  "logout/route.ts": "clears a session; nothing to protect",
  "auth/callback/route.ts": "the magic-link exchange itself",
  "s/[leadSlug]/assistant/route.ts": "public delivered client site",
  "s/[leadSlug]/events/route.ts": "public delivered client site",
  "s/[leadSlug]/quote-request/route.ts": "public delivered client site",
  "s/[leadSlug]/purchase-enquiry/route.ts": "public proposal enquiry form",
  "stripe/checkout/route.ts": "client pays from their own proposal link",
  "stripe/webhook/route.ts": "verified by Stripe signature",
};

function routeFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...routeFiles(full));
    else if (entry.name === "route.ts") out.push(full);
  }
  return out;
}

const failures: string[] = [];

for (const file of routeFiles(API_DIR)) {
  const rel = path.relative(API_DIR, file);
  if (PUBLIC_ROUTES[rel]) continue;

  const source = fs.readFileSync(file, "utf-8");
  if (!source.includes("createAdminClient")) continue;
  if (GATES.some((gate) => source.includes(gate))) continue;

  failures.push(rel);
}

if (failures.length > 0) {
  console.error("\nRoutes using the service-role client with no authorisation gate:\n");
  for (const file of failures) console.error(`  src/app/api/${file}`);
  console.error(
    `\nAdd one of: ${GATES.join(", ")} — or, if the route is public by design,` +
      "\nadd it to PUBLIC_ROUTES in scripts/check-route-auth.ts with the reason.\n"
  );
  process.exit(1);
}

console.log(`route auth: ok (${routeFiles(API_DIR).length} routes checked)`);
