import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { deliverArtifact } from "@/lib/deliver";
import { sendClosingSequenceEmail } from "@/lib/notifications";
import { buildClosePlanSteps } from "@/lib/close-plan";
import { loadPlaybook } from "@/lib/playbooks";
import type { Lead } from "@/types/database";

// deliver.send — RedesignEngine stage 4/PRD §7 stage 6-7: DeliverArtifact +
// closeplan.generate. The call step (step 1) is never automated — it just
// appears in close_plan_steps for HowToCloseTab to surface, the operator
// makes it manually. Steps 2-3 (email) are real Inngest step.sleep delays,
// durable across restarts — this function is "running" for days, which is
// exactly the case Inngest's step model exists for.
export const deliverSend = inngest.createFunction(
  { id: "deliver-send" },
  { event: "lead/qa.approved" },
  async ({ event, step }) => {
    const { lead_id } = event.data as { lead_id: string };
    const admin = createAdminClient();

    const lead = await step.run("load-lead", async () => {
      const { data } = await admin.from("leads").select("*").eq("id", lead_id).single<Lead>();
      if (!data) throw new Error(`deliver-send: lead ${lead_id} not found`);
      return data;
    });

    const previewUrl = await step.run("deliver-artifact", async () => deliverArtifact(lead));

    await step.run("schedule-close-plan", async () => {
      const playbook = loadPlaybook(lead.industry || "home-services");
      const steps = buildClosePlanSteps(lead, playbook);
      await admin.from("close_plan_steps").insert(steps.map((s) => ({ lead_id, ...s })));
    });

    await step.sleep("wait-before-email-1", "1d");

    await step.run("send-closing-email-1", async () => {
      await sendClosingSequenceEmail(lead, 1, previewUrl);
      await admin
        .from("close_plan_steps")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("lead_id", lead_id)
        .eq("step_number", 2);
    });

    await step.sleep("wait-before-email-2", "2d");

    await step.run("send-closing-email-2", async () => {
      // Re-check status — if paid/live already, the sequence's job is done.
      const { data: current } = await admin.from("leads").select("status").eq("id", lead_id).single();
      if (current?.status === "paid" || current?.status === "live") return;

      await sendClosingSequenceEmail(lead, 2, previewUrl);
      await admin
        .from("close_plan_steps")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("lead_id", lead_id)
        .eq("step_number", 3);
    });

    return { lead_id };
  }
);
