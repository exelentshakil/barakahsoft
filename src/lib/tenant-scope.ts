import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tenantBySlug, type Tenant } from "@/tenants";
import type { Lead } from "@/types/database";

// Who is asking, and are they allowed to touch this row?
//
// Almost every route handler in this app reads and writes through the
// service-role client, which bypasses RLS by definition. So RLS cannot be the
// thing that keeps one brand's operator out of another brand's leads — the
// database never sees a user on those paths. The check has to happen at the
// route boundary, and it has to be hard to skip.
//
// Hence operatorLead(): it authenticates AND proves ownership in one call, so
// a handler physically cannot do the first half and forget the second. The
// tightened SELECT policies in the tenants migration cover the one path this
// cannot reach — the browser's realtime subscription on the anon key.

export interface OperatorContext {
  email: string;
  tenant: Tenant;
  tenantSlug: string;
}

/**
 * The signed-in operator and the brand they work for, or null.
 *
 * Replaces the `auth.getUser()` check that fifteen routes were using: being
 * signed in is not being authorised, and now it is not being authorised *for
 * this brand* either.
 */
export async function requireOperator(): Promise<OperatorContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const admin = createAdminClient();
  const { data: account } = await admin
    .from("accounts")
    .select("email, tenant_slug")
    .eq("email", user.email)
    .maybeSingle<{ email: string; tenant_slug: string | null }>();
  if (!account) return null;

  const tenantSlug = account.tenant_slug ?? "barakahsoft";
  return { email: account.email, tenant: tenantBySlug(tenantSlug), tenantSlug };
}

/**
 * Load a lead, having proved the caller may see it.
 *
 * Null means "no" for every reason — not signed in, not an operator, or the
 * lead belongs to another brand. Callers return 404 rather than 403: a 403
 * confirms the lead exists, which tells a partner exactly how many clients the
 * platform has and lets them enumerate ids.
 *
 * Most handlers loaded the lead anyway, so this usually removes a query.
 */
export async function operatorLead(
  leadId: string
): Promise<{ lead: Lead; ctx: OperatorContext } | null> {
  const ctx = await requireOperator();
  if (!ctx) return null;

  const admin = createAdminClient();
  const { data: lead } = await admin
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .eq("tenant_slug", ctx.tenantSlug)
    .maybeSingle<Lead>();
  if (!lead) return null;

  return { lead, ctx };
}

/**
 * Prove a lead belongs to the caller without loading the whole row.
 *
 * For handlers that only need the id — a delete, a status flip, a queued job.
 */
export async function assertLeadInTenant(leadId: string): Promise<OperatorContext | null> {
  const ctx = await requireOperator();
  if (!ctx) return null;

  const admin = createAdminClient();
  const { data } = await admin
    .from("leads")
    .select("id")
    .eq("id", leadId)
    .eq("tenant_slug", ctx.tenantSlug)
    .maybeSingle<{ id: string }>();
  return data ? ctx : null;
}
