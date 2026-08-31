import { createAdminClient } from "@/lib/supabase/admin";

// What the landing page's "Design Quality Bar" renders.
//
// Deliberately narrow: this returns only what a public marketing card needs
// and nothing else off the lead row. The showcase is rendered for anonymous
// visitors, so contact details, email, phone and status must never travel
// into that component in the first place — a select("*") here would put a
// real client's email address one careless prop-spread away from the public
// page.

export interface ShowcaseEntry {
  slug: string;
  businessName: string;
  label: string | null;
  beforeUrl: string;
  afterUrl: string;
  /** Set only when the built page may be browsed live by the public. */
  liveUrl: string | null;
}

interface ShowcaseRow {
  slug: string;
  business_name: string | null;
  showcase_label: string | null;
  showcase_before_url: string | null;
  showcase_after_url: string | null;
  status: string | null;
}

// A build is only browsable by the public once it has cleared review. Anything
// still in QA is a draft, and a draft is a screenshot at most.
const APPROVED_STATUSES = new Set<string>(["qa_approved", "delivered", "paid", "live", "won"]);

/**
 * Approved showcases, highest sort weight first.
 *
 * A row missing either image is dropped rather than rendered half-empty — a
 * one-sided "before/after" is worse than one fewer card.
 */
export async function listApprovedShowcases(limit = 12): Promise<ShowcaseEntry[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }

  try {
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("leads")
      .select("slug, business_name, showcase_label, showcase_before_url, showcase_after_url, status")
      .eq("showcase_approved", true)
      .order("showcase_sort", { ascending: false })
      .order("showcase_approved_at", { ascending: false })
      .limit(limit)
      .returns<ShowcaseRow[]>();

    if (error || !data) return [];

    return data
      .filter((row) => row.showcase_before_url && row.showcase_after_url)
      .map((row) => ({
        slug: row.slug,
        businessName: row.business_name ?? "Client redesign",
        label: row.showcase_label,
        beforeUrl: row.showcase_before_url as string,
        afterUrl: row.showcase_after_url as string,
        // A live, browsable copy of a business's site carries their name,
        // phone, logo and reviews. Approving a screenshot for the showcase is
        // not the same act as publishing a working site in their name, so the
        // live embed additionally requires the build to have been approved —
        // showcase_approved alone is not enough.
        liveUrl: APPROVED_STATUSES.has(row.status ?? "") ? `/s/${row.slug}?showcase=1` : null,
      }));
  } catch {
    return [];
  }
}
