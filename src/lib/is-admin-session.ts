import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAccount } from "@/lib/get-or-create-account";
import { getTenant } from "@/lib/tenant";

// Shared admin-session check for public delivered-site route gates
// (innerPagesBuilt/fullSiteBuilt, both tied to Stripe payment). Confirmed
// real gap: an authenticated operator reviewing a lead in QA got redirected
// off every inner page exactly like an anonymous pre-payment visitor,
// making "review the full site before approving" structurally impossible.
// Same accounts-table allowlist check middleware.ts already performs for
// /admin -- any Supabase user isn't automatically an operator.
export async function isAdminSession(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return false;

  // Any account for this email, on any brand. Whether they may act on THIS
  // brand's data is a separate question, answered by requireOperator /
  // operatorLead in lib/tenant-scope.ts, which resolve the tenant from the
  // host. This one only answers "is this person an operator at all", which is
  // what its callers — public delivered-site gates — actually ask.
  const admin = createAdminClient();
  const { data: accounts } = await admin.from("accounts").select("email").eq("email", user.email).limit(1);
  return Boolean(accounts?.length);
}

/**
 * The signed-in operator's `accounts.id`.
 *
 * Not the same value as the Supabase auth user id: accounts rows carry their
 * own uuid and are matched to a login by email, so the two differ for every
 * operator. Columns that attribute an edit — artifacts.last_edited_by among
 * them — have a foreign key to accounts, so writing the auth id there is
 * rejected outright. Anything recording "who did this" must resolve through
 * here rather than reading the session id directly.
 */
export async function operatorAccountId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  // Delegates rather than repeating the lookup: getOrCreateAccount is
  // already the one place that reconciles a login with an accounts row, and
  // a second implementation here would be the thing that drifts.
  // Which brand this edit belongs to comes from the request host, not from the
  // login: the same person holds an account per brand.
  const tenant = await getTenant();
  try {
    return await getOrCreateAccount(user.id, user.email, tenant.slug);
  } catch {
    // Attribution is not worth failing an edit over.
    return null;
  }
}
