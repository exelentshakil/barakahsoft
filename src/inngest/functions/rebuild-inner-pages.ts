import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";

// rebuild.inner_pages — the entire "unlock" (plan §6/§7): flips
// artifacts.inner_pages_built so /services/[slug] and /areas/[slug] stop
// 404ing and the mega menu's hrefs switch from #slug to /services/slug.
// No content is regenerated — funnel_pages was already the source of truth
// for both the anchors and the standalone routes, so payment only changes
// which URL points at the same content. Fan-out sibling to go-live.ts,
// both subscribed to the same "stripe/invoice.paid" event.
export const rebuildInnerPages = inngest.createFunction(
  { id: "rebuild-inner-pages" },
  { event: "stripe/invoice.paid" },
  async ({ event, step }) => {
    const { lead_id } = event.data as { lead_id: string };
    const admin = createAdminClient();

    await step.run("mark-rebuilding", async () => {
      await admin.from("build_jobs").insert({ lead_id, stage: "rebuild_inner_pages", status: "running", pages_total: 1 });
    });

    await step.run("unlock-inner-pages", async () => {
      await admin.from("artifacts").update({ inner_pages_built: true }).eq("lead_id", lead_id);
      await admin.from("leads").update({ status: "paid" }).eq("id", lead_id);
      await admin.from("build_jobs").update({ status: "complete", pages_done: 1 }).eq("lead_id", lead_id).eq("stage", "rebuild_inner_pages");
    });

    return { lead_id };
  }
);
