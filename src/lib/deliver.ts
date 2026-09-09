import { tenantBySlug } from "@/tenants";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPreviewReadyEmail } from "@/lib/notifications";
import { createPortalToken } from "@/lib/portal-token";
import type { Lead } from "@/types/database";

// DeliverArtifact molecule — send_magic_link_email + set leads.delivered_at
// (plan §5). The delivered preview uses the same signed, expiring portal
// token as the intake confirmation so the report is not publicly enumerable.
export async function deliverArtifact(lead: Lead): Promise<string> {
  // The link a client clicks has to be on the domain of whoever sold to them.
  const previewUrl = `${tenantBySlug(lead.tenant_slug).portalBaseUrl}/s/${lead.slug}?auth=${createPortalToken(lead.id)}`;

  await sendPreviewReadyEmail(lead, previewUrl);

  const admin = createAdminClient();
  await admin.from("leads").update({ delivered_at: new Date().toISOString(), status: "delivered" }).eq("id", lead.id);

  return previewUrl;
}
