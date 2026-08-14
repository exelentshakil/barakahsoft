import { Resend } from "resend";
import twilio from "twilio";
import type { Lead } from "@/types/database";

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
