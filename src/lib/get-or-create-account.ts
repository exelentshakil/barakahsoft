import { createAdminClient } from "@/lib/supabase/admin";

// Single-operator app — every Supabase Auth user that reaches /admin should
// have a matching accounts row, but nothing provisions one at signup (there
// is no signup flow; access is granted by inviting an email via Supabase
// Auth directly). This is the one place that gap gets papered over, so
// FK columns like artifacts.last_edited_by / leads.owner_account_id have
// something real to point at.
export async function getOrCreateAccount(authUserId: string, email: string): Promise<string> {
  const admin = createAdminClient();

  const { data: existing } = await admin.from("accounts").select("id").eq("email", email).maybeSingle();
  if (existing) return existing.id;

  const { data: created, error } = await admin.from("accounts").insert({ id: authUserId, email }).select("id").single();
  if (error) throw new Error(`getOrCreateAccount: failed to create account — ${error.message}`);
  return created.id;
}
