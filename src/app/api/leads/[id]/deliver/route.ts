import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPortalToken } from "@/lib/portal-token";
import type { Lead } from "@/types/database";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const fromEmail = () => process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const admin = createAdminClient();

  const { data: lead } = await admin.from("leads").select("*").eq("id", leadId).single<Lead>();
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  if (!lead.email) return NextResponse.json({ error: "Lead has no email address" }, { status: 400 });

  const portalSubdomain = process.env.NEXT_PUBLIC_PORTAL_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://portal.barakahsoft.com";
  const trackingUrl = `${portalSubdomain}/s/${lead.slug}?auth=${createPortalToken(lead.id)}`;
  const businessName = lead.business_name || lead.source_url;

  const subject =
    typeof body.subject === "string" && body.subject.trim()
      ? body.subject.trim()
      : `Your Rebuilt Homepage & Speed Audit are Ready! (${businessName})`;

  const customIntro =
    typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : `Hi ${lead.contact_name || "there"}, we finished your free 48-hour homepage redesign for <strong>${businessName}</strong>. We audited your mobile speed, mapped your local search rankings, and built a fresh concept tailored to your brand.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0d1738; background-color: #ffffff; border: 1px solid #e5e7f2; border-radius: 12px;">
      <div style="margin-bottom: 24px; border-bottom: 1px solid #e5e7f2; padding-bottom: 16px;">
        <span style="font-size: 18px; font-weight: bold; color: #07284d;">Barakah<span style="color: #533afd;">Soft</span></span>
        <span style="font-size: 12px; color: #777588; margin-left: 8px;">· Executive Delivery</span>
      </div>
      <h2 style="font-size: 22px; font-weight: 700; color: #0d1738; margin-top: 0;">${subject}</h2>
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
        <p style="margin: 4px 0 0 0;">• Yours to keep, with no obligation</p>
      </div>
      <p style="font-size: 12px; color: #777588; margin-top: 28px; border-top: 1px solid #e5e7f2; padding-top: 16px;">
        BarakahSoft LLC · Direct Line: +1 (307) 533-6678 · hello@barakahsoft.com
      </p>
    </div>
  `;

  const resend = getResend();
  if (resend) {
    await resend.emails
      .send({
        from: fromEmail(),
        to: lead.email,
        subject,
        html,
      })
      .catch((err) => console.error("[deliver] email dispatch failed", err));
  }

  await admin
    .from("leads")
    .update({
      delivered_at: new Date().toISOString(),
      status: "delivered",
    })
    .eq("id", leadId);

  return NextResponse.json({ ok: true, delivered_at: new Date().toISOString(), trackingUrl });
}
