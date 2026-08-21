import { Resend } from "resend";
import twilio from "twilio";
import type { Lead } from "@/types/database";
import { createPortalToken } from "@/lib/portal-token";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  return twilio(sid, token);
}

const fromEmail = () => process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Fires synchronously from /api/intake, NOT from an Inngest function — the
// call must happen within minutes, decoupled from the 48h build (PRD §1d).
export async function sendInstantLeadAlert(lead: Lead) {
  const operatorEmail = process.env.OPERATOR_ALERT_EMAIL;
  const operatorPhone = process.env.OPERATOR_ALERT_PHONE;
  const leadUrl = `${siteUrl()}/admin/leads/${lead.id}`;
  const summary = `${lead.business_name || lead.source_url} — ${lead.phone || "no phone"} — ${lead.email || "no email"}`;

  const resend = getResend();
  if (resend && operatorEmail) {
    await resend.emails
      .send({
        from: fromEmail(),
        to: operatorEmail,
        subject: `New lead: ${lead.business_name || lead.source_url}`,
        html: `<p>New lead just submitted the intake form.</p><p>${summary}</p><p><a href="${leadUrl}">Open in admin</a></p>`,
      })
      .catch((err) => console.error("[notifications] instant alert email failed", err));
  } else {
    console.log("[notifications] (stub) would email operator instant alert —", summary);
  }

  const client = getTwilioClient();
  const from = process.env.TWILIO_FROM_NUMBER;
  if (client && from && operatorPhone) {
    await client.messages
      .create({ to: operatorPhone, from, body: `New lead: ${summary}. ${leadUrl}` })
      .catch((err) => console.error("[notifications] instant alert SMS failed", err));
  } else {
    console.log("[notifications] (stub) would SMS operator instant alert —", summary);
  }
}

export async function sendInstantLeadConfirmationEmail(lead: Lead) {
  const resend = getResend();
  if (!lead.email) return;
  const portalSubdomain = process.env.NEXT_PUBLIC_PORTAL_URL || "https://portal.barakahsoft.com";
  const trackingUrl = `${portalSubdomain}/s/${lead.slug}?auth=${createPortalToken(lead.id)}`;
  const businessName = lead.business_name || lead.source_url;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0d1738; background-color: #ffffff; border: 1px solid #e5e7f2; border-radius: 12px;">
      <div style="margin-bottom: 24px; border-bottom: 1px solid #e5e7f2; padding-bottom: 16px;">
        <span style="font-size: 18px; font-weight: bold; color: #533afd;">BarakahSoft</span>
        <span style="font-size: 12px; color: #777588; margin-left: 8px;">· Live Redesign Portal</span>
      </div>
      <h2 style="font-size: 22px; font-weight: 700; color: #0d1738; margin-top: 0;">We received your website request</h2>
      <p style="font-size: 14px; line-height: 24px; color: #42506a;">
        Hi ${lead.contact_name || "there"}, our team received your submission for <strong>${businessName}</strong>.
      </p>
      <p style="font-size: 14px; line-height: 24px; color: #42506a;">
        We are currently auditing your website, running your local search grid, and rebuilding your mobile homepage concept. You can track our progress in real-time on your private portal below:
      </p>
      <div style="margin: 28px 0;">
        <a href="${trackingUrl}" style="background-color: #533afd; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block;">
          Track Your Live Redesign & Audit →
        </a>
      </div>
      <div style="background-color: #f9f9ff; border: 1px solid #e5e7f2; border-radius: 8px; padding: 16px; font-size: 12px; color: #42506a; margin-top: 24px;">
        <p style="margin: 0 0 6px 0; font-weight: 600; color: #0d1738;">What happens next:</p>
        <p style="margin: 0;">1. We audit mobile speed & local search visibility</p>
        <p style="margin: 4px 0 0 0;">2. We build your new high-converting homepage</p>
        <p style="margin: 4px 0 0 0;">3. You review the concept in 48 hours with zero obligation</p>
      </div>
      <p style="font-size: 12px; color: #777588; margin-top: 28px; border-top: 1px solid #e5e7f2; padding-top: 16px;">
        BarakahSoft LLC · Direct Line: +1 (307) 533-6678 · hello@barakahsoft.com
      </p>
    </div>
  `;

  if (resend) {
    await resend.emails
      .send({
        from: fromEmail(),
        to: lead.email,
        subject: `We received your website — follow your redesign live (${businessName})`,
        html,
      })
      .catch((err) => console.error("[notifications] confirmation email failed", err));
  } else {
    console.log("[notifications] (stub) would send confirmation email to", lead.email, trackingUrl);
  }
}

export async function sendPreviewReadyEmail(lead: Lead, magicLink: string) {
  const resend = getResend();
  if (!resend || !lead.email) {
    console.log("[notifications] (stub) would email preview-ready link to", lead.email, magicLink);
    return;
  }
  await resend.emails
    .send({
      from: fromEmail(),
      to: lead.email,
      subject: `Your free redesign for ${lead.business_name || "your website"} is ready`,
      html: `<p>Hi — we built a free homepage redesign for ${lead.business_name || "your business"}, no strings attached.</p>
        <p><a href="${magicLink}">View your new homepage</a></p>`,
    })
    .catch((err) => console.error("[notifications] preview-ready email failed", err));
}

// The 2 auto-sent closing-sequence emails (PRD §1c) — from hello@ the
// client's own verified domain in production; falls back to RESEND_FROM_EMAIL
// until a per-client sending domain is verified in Resend.
export async function sendClosingSequenceEmail(lead: Lead, step: 1 | 2, magicLink: string) {
  const resend = getResend();
  if (!resend || !lead.email) {
    console.log(`[notifications] (stub) would send closing-sequence email #${step} to`, lead.email);
    return;
  }
  const subject =
    step === 1
      ? `Any thoughts on your new homepage, ${lead.business_name || "there"}?`
      : `Last check-in — your homepage preview for ${lead.business_name || "your business"}`;
  const html =
    step === 1
      ? `<p>Just checking you saw the free redesign we built — <a href="${magicLink}">take another look here</a>.</p><p>Happy to jump on a quick call if useful.</p>`
      : `<p>Following up one more time on the free homepage we built for you — <a href="${magicLink}">it's still live here</a>.</p><p>Let us know if you'd like to go live with it.</p>`;
  await resend.emails
    .send({ from: fromEmail(), to: lead.email, subject, html })
    .catch((err) => console.error(`[notifications] closing-sequence email #${step} failed`, err));
}
