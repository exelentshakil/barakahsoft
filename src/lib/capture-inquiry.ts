import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

// One path for every enquiry a delivered site produces.
//
// The hero form, the quote modal and the AI assistant all end here, so an
// enquiry reaches the business the same way whatever produced it: an email
// to the CLIENT's own real address (never BarakahSoft's) and a
// lead_inquiries row so nothing depends on an inbox being watched.
//
// Same discipline as everywhere else here — no real email on file means no
// send, reported honestly, rather than a silently swallowed failure.

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface InquiryInput {
  leadId: string;
  businessName: string;
  /** The client's own address. Nothing is sent when this is null. */
  clientEmail: string | null;
  name: string;
  phone?: string;
  email?: string;
  /** Free-text detail, or the assistant's one-line summary. */
  message?: string;
  /** What produced it, for the admin's inquiry list. */
  source: "website_form" | "website_assistant";
}

/** True when the business was actually reached. */
export async function captureInquiry(input: InquiryInput): Promise<boolean> {
  const name = input.name.trim().slice(0, 200);
  const phone = (input.phone ?? "").trim().slice(0, 40);
  const email = (input.email ?? "").trim().slice(0, 200);
  const message = (input.message ?? "").trim().slice(0, 2000);
  const contact = phone || email;

  if (!name || !contact) return false;

  // The row is written even when the email cannot go out, so an enquiry is
  // never lost just because delivery is misconfigured.
  const admin = createAdminClient();
  await admin.from("lead_inquiries").insert({
    lead_id: input.leadId,
    channel: input.source === "website_assistant" ? "assistant" : "form",
    status: "new",
    name,
    contact,
    source: input.source,
    metadata: { message, phone: phone || undefined, email: email || undefined },
  });

  if (!input.clientEmail) return false;

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("[capture-inquiry] RESEND_API_KEY not set — the row was written but nothing was sent");
    return false;
  }

  const heading =
    input.source === "website_assistant"
      ? `New enquiry from the assistant on your website (${input.businessName}).`
      : `New quote request from your website (${input.businessName}).`;

  try {
    await new Resend(key).emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: input.clientEmail,
      replyTo: EMAIL_SHAPE.test(email) ? email : EMAIL_SHAPE.test(contact) ? contact : undefined,
      subject: `New enquiry from ${name} — ${input.businessName}`,
      html: `
        <p>${escapeHtml(heading)}</p>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ""}
        ${email ? `<p><strong>Email:</strong> ${escapeHtml(email)}</p>` : ""}
        ${message ? `<p><strong>What they need:</strong> ${escapeHtml(message)}</p>` : ""}
      `,
    });
    return true;
  } catch (err) {
    console.error("[capture-inquiry] send failed", err);
    return false;
  }
}
