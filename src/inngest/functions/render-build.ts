import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { screenshotPage } from "@/lib/screenshot";

// render.build — RedesignEngine stage 3 (plan §5). Unlike a static-site
// generator, /s/[leadSlug] already renders live from the artifacts row
// enrich-generate just wrote — there's no separate "build" step to
// populate. This stage's real job is the QA screenshot and flipping the
// lead into the human QA gate (PRD §7 stage 5, permanent, not optional).
export const renderBuild = inngest.createFunction(
  { id: "render-build" },
  { event: "enrich/completed" },
  async ({ event, step }) => {
    const { lead_id } = event.data as { lead_id: string };
    const admin = createAdminClient();

    await step.run("mark-rendering", async () => {
      await admin.from("leads").update({ status: "rendering" }).eq("id", lead_id);
      await admin.from("build_jobs").insert({ lead_id, stage: "render", status: "running", pages_total: 1 });
    });

    const leadSlug = await step.run("load-lead-slug", async () => {
      const { data } = await admin.from("leads").select("slug").eq("id", lead_id).single();
      if (!data) throw new Error(`render-build: lead ${lead_id} not found`);
      return data.slug;
    });

    await step.run("screenshot-and-mark-qa", async () => {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const screenshotUrl = await screenshotPage(`${siteUrl}/s/${leadSlug}`, lead_id, "mobile");

      await admin.from("artifacts").update({ screenshot_url: screenshotUrl, qa_status: "pending" }).eq("lead_id", lead_id);
      await admin.from("leads").update({ status: "qa_pending" }).eq("id", lead_id);
      await admin.from("build_jobs").update({ status: "complete", pages_done: 1 }).eq("lead_id", lead_id).eq("stage", "render");
    });

    return { lead_id };
  }
);
