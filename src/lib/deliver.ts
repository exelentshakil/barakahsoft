import { createAdminClient } from "@/lib/supabase/admin";
import { sendPreviewReadyEmail } from "@/lib/notifications";
import type { Lead } from "@/types/database";

// DeliverArtifact molecule — send_magic_link_email + set leads.delivered_at
// (plan §5). "Magic link" here is just the public preview URL itself
// (/s/[slug] needs no login, it's a public route) — there's no separate
// token/auth step the way the admin magic-link login has one.
export async function deliverArtifact(lead: Lead): Promise<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const previewUrl = `${siteUrl}/s/${lead.slug}`;

  await sendPreviewReadyEmail(lead, previewUrl);

  const admin = createAdminClient();
  await admin.from("leads").update({ delivered_at: new Date().toISOString(), status: "delivered" }).eq("id", lead.id);

  return previewUrl;
}
