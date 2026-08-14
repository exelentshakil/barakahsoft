import { inngest } from "@/inngest/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { addDomainToProject } from "@/lib/vercel";

// go_live — ProvisionGoLive (plan §5), fan-out sibling to
// rebuild-inner-pages.ts on the same "stripe/invoice.paid" event. Domain
// attach is best-effort: leads.custom_domain is set by the operator during
// the sales call (PRD "you register/manage it if they don't have one, or
// handle DNS cutover if they do" — zero technical burden on the client,
// but that means a human step, not something this function can invent).
// If it's not set yet, this just leaves the lead ready for a manual
// go-live once the operator has a domain to attach.
export const goLive = inngest.createFunction(
  { id: "go-live" },
  { event: "stripe/invoice.paid" },
  async ({ event, step }) => {
    const { lead_id } = event.data as { lead_id: string };
    const admin = createAdminClient();

    const lead = await step.run("load-lead", async () => {
      const { data } = await admin.from("leads").select("id, custom_domain, live_at").eq("id", lead_id).single();
      return data;
    });

    if (!lead?.custom_domain) {
      console.log(`[go-live] lead ${lead_id} has no custom_domain set yet — skipping until operator adds one`);
      return { lead_id, skipped: true };
    }

    await step.run("attach-domain", async () => {
      const result = await addDomainToProject(lead.custom_domain!);
      if (!result.ok) {
        console.error(`[go-live] failed to attach domain ${lead.custom_domain} for lead ${lead_id} — ${result.error}`);
        return;
      }
      await admin.from("leads").update({ live_at: new Date().toISOString(), status: "live" }).eq("id", lead_id);
    });

    return { lead_id };
  }
);
