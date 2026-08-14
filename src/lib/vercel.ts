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
