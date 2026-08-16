import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const admin = createAdminClient();
  const { data: account } = await admin.from("accounts").select("email").eq("email", user.email).maybeSingle();
  return !!account;
}
