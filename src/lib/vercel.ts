const API_BASE = "https://api.vercel.com";

function authHeaders() {
  return { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, "Content-Type": "application/json" };
}

function withTeam(path: string) {
  const teamId = process.env.VERCEL_TEAM_ID;
  return teamId ? `${path}${path.includes("?") ? "&" : "?"}teamId=${teamId}` : path;
}

export type VercelDomainStatus = { verified: boolean; misconfigured: boolean };

// Adds a tenant's own domain to the Vercel project — the "bring your own
// domain" feature (distinct from QuoteHaul's own subdomain routing, which
// needs a QuoteHaul-owned domain and isn't this). Requires VERCEL_API_TOKEN
// with project access.
export async function addDomainToProject(domain: string): Promise<{ ok: boolean; error?: string }> {
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!process.env.VERCEL_API_TOKEN || !projectId) return { ok: false, error: "Domain automation isn't configured yet" };

  const res = await fetch(withTeam(`${API_BASE}/v10/projects/${projectId}/domains`), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name: domain }),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error?.message ?? "Could not add that domain" };
  return { ok: true };
}

export async function removeDomainFromProject(domain: string): Promise<{ ok: boolean; error?: string }> {
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!process.env.VERCEL_API_TOKEN || !projectId) return { ok: false, error: "Domain automation isn't configured yet" };

  const res = await fetch(withTeam(`${API_BASE}/v9/projects/${projectId}/domains/${domain}`), {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 404) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.error?.message ?? "Could not remove that domain" };
  }
  return { ok: true };
}

export async function getDomainStatus(domain: string): Promise<VercelDomainStatus | null> {
  if (!process.env.VERCEL_API_TOKEN) return null;
  const res = await fetch(withTeam(`${API_BASE}/v6/domains/${domain}/config`), { headers: authHeaders() });
  if (!res.ok) return null;
  const data = await res.json();
  return { verified: !data.misconfigured, misconfigured: Boolean(data.misconfigured) };
}

// The "buy a domain through us" side -- a real client, at the point of
// sale, frequently doesn't already own a domain. Vercel's own registrar
// API means no separate registrar integration is needed. Real money: the
// buy call below always charges the payment method on file for
// VERCEL_TEAM_ID, never something to call without an explicit operator
// confirmation showing the exact price first (see /api/leads/[id]/domain).
export async function checkDomainAvailability(domain: string): Promise<boolean | null> {
  if (!process.env.VERCEL_API_TOKEN) return null;
  const res = await fetch(withTeam(`${API_BASE}/v1/registrar/domains/${encodeURIComponent(domain)}/availability`), {
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return Boolean(data.available);
}

export type DomainPriceInfo = { years: number; purchasePrice: number; renewalPrice: number; transferPrice: number };

export async function getDomainPrice(domain: string, years = 1): Promise<DomainPriceInfo | null> {
  if (!process.env.VERCEL_API_TOKEN) return null;
  const res = await fetch(
    withTeam(`${API_BASE}/v1/registrar/domains/${encodeURIComponent(domain)}/price?years=${years}`),
    { headers: authHeaders() }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return {
    years: Number(data.years),
    purchasePrice: Number(data.purchasePrice),
    renewalPrice: Number(data.renewalPrice),
    transferPrice: Number(data.transferPrice),
  };
}

export interface DomainRegistrantContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  companyName?: string;
}

// expectedPrice must match the live price exactly (same discipline as the
// Vercel MCP buy_domain tool) -- the operator sees this exact number from
// getDomainPrice before confirming, so a mismatch here means the price
// moved between check and confirm, and the purchase correctly fails rather
// than silently charging a different amount.
export async function buyDomain(
  domain: string,
  opts: { years: number; expectedPrice: number; autoRenew?: boolean; contact: DomainRegistrantContact }
): Promise<{ ok: boolean; error?: string }> {
  if (!process.env.VERCEL_API_TOKEN) return { ok: false, error: "Domain automation isn't configured yet" };

  const res = await fetch(withTeam(`${API_BASE}/v1/registrar/domains/${encodeURIComponent(domain)}/buy`), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      autoRenew: opts.autoRenew ?? true,
      years: opts.years,
      expectedPrice: opts.expectedPrice,
      contactInformation: opts.contact,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.error?.message ?? "Could not purchase that domain" };
  return { ok: true };
}
