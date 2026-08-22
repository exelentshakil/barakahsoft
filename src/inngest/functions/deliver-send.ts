import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildClosePlanSteps } from "@/lib/close-plan";
import { loadPlaybook } from "@/lib/playbooks";
import type { Lead } from "@/types/database";

// deliver.send — RedesignEngine stage 4: Prepares the close plan steps upon QA approval.
// The actual delivery email dispatch is controlled by the operator in the Admin Workspace
// (DeliveryEmailComposer) for personalized, high-converting outreach.
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

    await step.run("schedule-close-plan", async () => {
      const playbook = loadPlaybook(lead.industry || "home-services");
      const steps = buildClosePlanSteps(lead, playbook);
      await admin.from("close_plan_steps").insert(steps.map((s) => ({ lead_id, ...s })));
    });

    await step.run("mark-qa-approved", async () => {
      await admin.from("leads").update({ status: "qa_approved" }).eq("id", lead_id);
    });

    return { lead_id, status: "ready_for_operator_delivery" };
  }
);
