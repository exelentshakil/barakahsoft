import { tenantBySlug } from "@/tenants";
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

const fromEmail = () => process.env.BREVO_SENDER_EMAIL || process.env.RESEND_FROM_EMAIL || "hello@barakahsoft.com";
const senderName = () => process.env.SENDER_NAME || "BarakahSoft";

// Universal transactional email dispatcher: Native Brevo API with Resend fallback
export async function sendEmail({
  to,
  subject,
  html,
  text,
  headers,
  replyTo,
  from,
  fromName,
}: {
  to: string;
  subject: string;
  html: string;
  /**
   * The plain-text part.
   *
   * A cold first contact sent as HTML only is scored as bulk marketing before
   * anyone reads a word of it. Supplying both parts makes the message a normal
   * multipart email — which is what a person typing in their mail client
   * actually produces.
   */
  text?: string;
  /**
   * Extra SMTP headers. The one that matters is List-Unsubscribe, paired with
   * List-Unsubscribe-Post for RFC 8058 one-click: Gmail and Yahoo render their
   * own unsubscribe control when both are present, and someone who can leave
   * in one click does not reach for the spam button instead.
   */
  headers?: Record<string, string>;
  replyTo?: string;
  /**
   * The sending identity, when it is not the platform's.
   *
   * A partner's mail must leave from their own verified domain — otherwise
   * every message their prospect receives comes from hello@barakahsoft.com,
   * which is both confusing and, once SPF is checked, likely to be filtered.
   */
  from?: string;
  fromName?: string;
}): Promise<boolean> {
  const brevoKey = process.env.BREVO_API_KEY;
  if (brevoKey) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": brevoKey,
        },
        body: JSON.stringify({
          sender: { name: (fromName || senderName()), email: (from || fromEmail()) },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          ...(text ? { textContent: text } : {}),
          ...(headers && Object.keys(headers).length ? { headers } : {}),
          replyTo: replyTo ? { email: replyTo } : undefined,
        }),
      });
      if (res.ok) return true;
      const errData = await res.json().catch(() => ({}));
      console.error("[notifications] Brevo API error", errData);
    } catch (err) {
      console.error("[notifications] Brevo dispatch exception", err);
    }
  }

  const resend = getResend();
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: (from || fromEmail()),
        to,
        subject,
        html,
        ...(text ? { text } : {}),
        ...(headers && Object.keys(headers).length ? { headers } : {}),
        replyTo,
      });
      if (error) {
        console.error("[notifications] Resend API error", error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("[notifications] Resend dispatch exception", err);
    }
  }

  console.log(`[notifications] (stub) would send email to ${to} | ${subject}`);
  return false;
}

/**
 * The brand a lead's mail goes out as.
 *
 * Every message here used to be signed BarakahSoft from
 * hello@barakahsoft.com with a +1 (307) number, which is correct for the
 * platform's own leads and wrong for a partner's: their prospect would get a
 * proposal branded KeyGrowth linking to a portal signed by a Wyoming LLC.
 */
function brandFor(lead: Lead) {
  const tenant = tenantBySlug(lead.tenant_slug);
  return {
    tenant,
    brand: tenant.brand,
    sender: { from: tenant.brand.fromEmail, fromName: tenant.brand.senderName },
  };
}

// Fires synchronously from /api/intake, NOT from an Inngest function
export async function sendInstantLeadAlert(lead: Lead) {
  const { tenant, sender } = brandFor(lead);
  // Where a partner's own new-lead alert goes. Falls back to the platform's
  // env var only for the platform's own leads.
  const operatorEmail =
    tenant.commerce.enquiryEmail || tenant.brand.supportEmail || process.env.OPERATOR_ALERT_EMAIL;
  const operatorPhone = process.env.OPERATOR_ALERT_PHONE;
  const leadUrl = `${tenant.siteBaseUrl}/admin/leads/${lead.id}`;
  const summary = `${lead.business_name || lead.source_url} — ${lead.phone || "no phone"} — ${lead.email || "no email"}`;

  if (operatorEmail) {
    await sendEmail({
      to: operatorEmail,
      ...sender,
      subject: `New lead: ${lead.business_name || lead.source_url}`,
      html: `<p>New lead just submitted the intake form.</p><p>${summary}</p><p><a href="${leadUrl}">Open in admin</a></p>`,
    });
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

// Email #1 (Instant Auto-Confirmation)
export async function sendInstantLeadConfirmationEmail(lead: Lead) {
  if (!lead.email) return;
  const { tenant, brand, sender } = brandFor(lead);
  const trackingUrl = `${tenant.portalBaseUrl}/s/${lead.slug}?auth=${createPortalToken(lead.id)}`;
  const businessName = lead.business_name || lead.source_url;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0d1738; background-color: #ffffff; border: 1px solid #e5e7f2; border-radius: 12px;">
      <div style="margin-bottom: 24px; border-bottom: 1px solid #e5e7f2; padding-bottom: 16px;">
        <span style="font-size: 18px; font-weight: bold; color: #533afd;">${brand.name}</span>
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
        ${brand.emailSignature}
      </p>
    </div>
  `;

  await sendEmail({
    to: lead.email,
    ...sender,
    subject: `We received your website — follow your redesign live (${businessName})`,
    html,
  });
}

// Email #2 (Concept Delivery)
export async function sendPreviewReadyEmail(lead: Lead, magicLink: string) {
  if (!lead.email) return;
  const { brand, sender } = brandFor(lead);
  const businessName = lead.business_name || lead.source_url;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0d1738; background-color: #ffffff; border: 1px solid #e5e7f2; border-radius: 12px;">
      <div style="margin-bottom: 24px; border-bottom: 1px solid #e5e7f2; padding-bottom: 16px;">
        <span style="font-size: 18px; font-weight: bold; color: #07284d;">${brand.name}</span>
        <span style="font-size: 12px; color: #777588; margin-left: 8px;">· Executive Delivery</span>
      </div>
      <h2 style="font-size: 22px; font-weight: 700; color: #0d1738; margin-top: 0;">Your Rebuilt Homepage & Speed Audit are Ready!</h2>
      <p style="font-size: 14px; line-height: 24px; color: #42506a;">
        Hi ${lead.contact_name || "there"}, we finished your free 48-hour homepage redesign for <strong>${businessName}</strong>.
      </p>
      <div style="margin: 28px 0;">
        <a href="${magicLink}" style="background-color: #533afd; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 6px; display: inline-block;">
          Open Your Private Live Proposal & X-Ray →
        </a>
      </div>
      <p style="font-size: 12px; color: #777588; margin-top: 28px; border-top: 1px solid #e5e7f2; padding-top: 16px;">
        ${brand.emailSignature}
      </p>
    </div>
  `;

  await sendEmail({
    to: lead.email,
    ...sender,
    subject: `Your free redesign for ${businessName} is ready`,
    html,
  });
}
