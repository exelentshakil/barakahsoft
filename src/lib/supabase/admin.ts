import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for trusted server-only operations (API routes) that need
// to bypass RLS — e.g. inserting a public lead, or the confirmation workflow.
// NEVER import this into a Client Component.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  return createSupabaseClient(
    url,
    key,
    { auth: { persistSession: false } }
  );
}
