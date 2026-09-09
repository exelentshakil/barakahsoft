import { createAdminClient } from "@/lib/supabase/admin";

// Every Supabase Auth user that reaches /admin should have a matching accounts
// row, but nothing provisions one at signup (there is no signup flow; access is
// granted by inserting a row and inviting the email). This is the one place
// that gap gets papered over, so FK columns like artifacts.last_edited_by have
// something real to point at.
//
// Scoped by tenant, because one person can hold an account for several brands:
// the platform's operator opening a partner's dashboard is the whole reason
// accounts.email stopped being unique. Looking up by email alone would return
// an arbitrary row and attribute an edit to the wrong brand.
export async function getOrCreateAccount(
  authUserId: string,
  email: string,
  tenantSlug: string
): Promise<string> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("accounts")
    .select("id")
    .eq("email", email)
    .eq("tenant_slug", tenantSlug)
    .maybeSingle();
  if (existing) return existing.id;

  // The auth user id is only usable as the primary key for the FIRST account a
  // person holds; a second brand needs its own row and therefore its own id.
  const { data: created, error } = await admin
    .from("accounts")
    .insert({ email, tenant_slug: tenantSlug })
    .select("id")
    .single();
  if (error) throw new Error(`getOrCreateAccount: failed to create account — ${error.message}`);

  void authUserId;
  return created.id;
}
