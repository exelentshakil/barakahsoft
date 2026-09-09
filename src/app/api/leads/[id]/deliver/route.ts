import { assertLeadInTenant } from "@/lib/tenant-scope";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPortalToken } from "@/lib/portal-token";
import { sendEmail } from "@/lib/notifications";
import type { Lead } from "@/types/database";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;

  // Authenticates and proves the lead belongs to this operator's brand in
  // one call. 404 rather than 403: a 403 confirms the lead exists.
  if (!(await assertLeadInTenant(leadId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const admin = createAdminClient();

  const { data: lead } = await admin.from("leads").select("*").eq("id", leadId).single<Lead>();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!lead.email) return NextResponse.json({ error: "Lead has no email address" }, { status: 400 });

  if (lead.status === "lost") {
    return NextResponse.json(
      { error: "Outreach is blocked because this lead is marked as 'Not Interested / Lost'." },
      { status: 400 }
    );
  }

  const portalSubdomain = process.env.NEXT_PUBLIC_PORTAL_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://portal.barakahsoft.com";
  const trackingUrl = `${portalSubdomain}/s/${lead.slug}?auth=${createPortalToken(lead.id)}`;
  const businessName = lead.business_name || lead.source_url;

  const stepNumber = typeof body.step === "number" ? body.step : 1;

  const subject =
    typeof body.subject === "string" && body.subject.trim()
      ? body.subject.trim()
      : stepNumber === 2
      ? `Quick follow up regarding ${businessName}'s homepage rebuild`
      : stepNumber === 3
      ? `Final check regarding ${businessName} website concept`
      : `Your Rebuilt Homepage & Speed Audit are Ready! (${businessName})`;

  const customIntro =
    typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : stepNumber === 2
      ? `Hi ${lead.contact_name || "there"}, just checking if you had a moment to review the high-speed homepage concept we put together for <strong>${businessName}</strong>.`
      : stepNumber === 3
      ? `Hi ${lead.contact_name || "there"}, following up one last time on the custom website files and Google speed audit for <strong>${businessName}</strong> before we archive the staging preview.`
      : `Hi ${lead.contact_name || "there"}, we finished your free 48-hour homepage redesign for <strong>${businessName}</strong>. We audited your mobile speed, mapped your local search rankings, and built a fresh concept tailored to your brand.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0d1738; background-color: #ffffff; border: 1px solid #e5e7f2; border-radius: 12px;">
      <div style="margin-bottom: 24px; border-bottom: 1px solid #e5e7f2; padding-bottom: 16px;">
        <span style="font-size: 18px; font-weight: bold; color: #07284d;">Barakah<span style="color: #533afd;">Soft</span></span>
        <span style="font-size: 12px; color: #777588; margin-left: 8px;">· Executive Delivery</span>
      </div>
      <h2 style="font-size: 20px; font-weight: 700; color: #0d1738; margin-top: 0;">${subject}</h2>
      <p style="font-size: 14px; line-height: 24px; color: #42506a;">
        ${customIntro}
      </p>
      <div style="margin: 28px 0;">
        <a href="${trackingUrl}" style="background-color: #533afd; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block;">
          Open Your Private Live Proposal & X-Ray →
        </a>
      </div>
      <div style="background-color: #f9f9ff; border: 1px solid #e5e7f2; border-radius: 8px; padding: 16px; font-size: 12px; color: #42506a; margin-top: 24px;">
        <p style="margin: 0 0 6px 0; font-weight: 600; color: #0d1738;">What you will see in your portal:</p>
        <p style="margin: 0;">• Your new homepage, live, next to the one you have now</p>
        <p style="margin: 4px 0 0 0;">• Your real mobile speed score, measured by Google</p>
        <p style="margin: 4px 0 0 0;">• Where you appear in local search across your area, and who is beating you</p>
        <p style="margin: 4px 0 0 0;">• Yours to keep, with zero obligation</p>
      </div>
      <p style="font-size: 12px; color: #777588; margin-top: 28px; border-top: 1px solid #e5e7f2; padding-top: 16px;">
        BarakahSoft LLC · Direct Line: +1 (307) 533-6678 · hello@barakahsoft.com
      </p>
    </div>
  `;

  const hasEmailConfig = Boolean(process.env.BREVO_API_KEY || process.env.RESEND_API_KEY);
  const emailSent = await sendEmail({
    to: lead.email,
    subject,
    html,
  });

  if (hasEmailConfig && !emailSent) {
    return NextResponse.json(
      { error: "Email delivery failed. Please check your Brevo/Resend API key and verified sender configuration." },
      { status: 502 }
    );
  }

  const now = new Date().toISOString();
  const nextStatus = stepNumber === 1 ? "delivered" : "contacted";

  await admin
    .from("leads")
    .update({
      delivered_at: lead.delivered_at || now,
      outreach_stage: stepNumber,
      outreach_last_sent_at: now,
      status: nextStatus,
    })
    .eq("id", leadId);

  return NextResponse.json({
    ok: true,
    emailSent,
    delivered_at: now,
    step: stepNumber,
    status: nextStatus,
    trackingUrl,
    warning: !hasEmailConfig
      ? "No email service configured (missing BREVO_API_KEY / RESEND_API_KEY). You can copy the proposal link directly."
      : undefined,
  });
}
