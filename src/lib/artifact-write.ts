import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Write to a lead's artifact row, and prove the write landed.
 *
 * Every artifact write in the build used to be a bare
 * `.update(...).eq("lead_id", id)` with no error check. supabase-js reports
 * failures by RETURNING an error rather than throwing, and an update whose
 * filter matches nothing is not an error at all — it is a successful statement
 * affecting zero rows.
 *
 * So a build could finish with every Inngest step green and write nothing: a
 * missing artifact row, a column the schema no longer has, an RLS policy, all
 * looked identical to success. The symptom is the page still serving the
 * PREVIOUS build's HTML, which is indistinguishable from "the generator did
 * not change anything" and sends you looking in the wrong place entirely.
 *
 * `.select("id")` makes the statement return the rows it touched, so zero rows
 * becomes something we can detect and throw on. A build that cannot persist
 * must fail loudly at the step that could not write, not succeed quietly and
 * leave a stale site up.
 */
export async function updateArtifact(
  leadId: string,
  patch: Record<string, unknown>,
  label: string
): Promise<void> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("artifacts")
    .update(patch)
    .eq("lead_id", leadId)
    .select("id");

  if (error) {
    throw new Error(
      `[${label}] artifact write failed for lead ${leadId}: ${error.message}` +
        `${error.hint ? ` — ${error.hint}` : ""} (fields: ${Object.keys(patch).join(", ")})`
    );
  }
  if (!data || data.length === 0) {
    throw new Error(
      `[${label}] artifact write matched no row for lead ${leadId}. ` +
        `The update succeeded and changed nothing, so the site would keep serving the previous build.`
    );
  }
}
