import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for trusted server-only operations (API routes) that need
// to bypass RLS — e.g. inserting a public lead, or the confirmation workflow.
// NEVER import this into a Client Component.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
