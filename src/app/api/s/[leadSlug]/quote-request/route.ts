import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getSiteData } from "@/lib/get-site-data";
import { createAdminClient } from "@/lib/supabase/admin";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const fromEmail = () => process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] ?? character);
}

// Public, unauthenticated -- any visitor to a delivered site can submit
// this. Sends directly to the CLIENT's own real scraped email (never
// BarakahSoft's), so a real visitor's request actually reaches the
// business, not an inbox nobody's watching. Same "never invent a contact
// channel" discipline as everywhere else here: no real email on file means
// no send, not a silently-swallowed failure.
export async function POST(req: Request, { params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  const body = await req.json().catch(() => null);

  // The hero form (name/phone/email/service, no combined "contact" field)
  // and the modal (name/contact/message) both land here. `contact` is kept
  // for the modal; the hero form's phone/email collapse into it below.
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const service = typeof body?.service === "string" ? body.service.trim() : "";
  const contact = (typeof body?.contact === "string" ? body.contact.trim() : "") || phone || email;

  if (typeof body?.name !== "string" || !body.name.trim() || !contact) {
    return NextResponse.json({ error: "Name and email or phone are required" }, { status: 400 });
  }

  const result = await getSiteData(leadSlug);
  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const clientEmail = result.payload.nap.email;
  if (!clientEmail) {
    return NextResponse.json(
      { error: result.payload.nap.phone ? `No email on file — please call ${result.payload.nap.phone} directly.` : "Unable to send right now." },
      { status: 422 }
    );
  }

  const resend = getResend();
  if (!resend) {
    console.error("[quote-request] RESEND_API_KEY not set — cannot send");
    return NextResponse.json({ error: "Unable to send right now — please try again shortly." }, { status: 500 });
  }

  const name = body.name.trim().slice(0, 200);
  const contactValue = contact.slice(0, 200);
  const message = typeof body.message === "string" ? body.message.trim().slice(0, 2000) : "";
  const safeName = escapeHtml(name);
  const safeContact = escapeHtml(contactValue);
  const safeMessage = escapeHtml(message);
  const safePhone = phone ? escapeHtml(phone.slice(0, 40)) : "";
  const safeEmail = email ? escapeHtml(email.slice(0, 200)) : "";
  const safeService = service ? escapeHtml(service.slice(0, 200)) : "";
  // Reply-To prefers an explicit email field, then falls back to contact
  // only when it actually looks like an email -- a phone number there isn't
  // a valid Reply-To header.
  const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || contactValue) ? email || contactValue : undefined;

  try {
    await resend.emails.send({
      from: fromEmail(),
      to: clientEmail,
      replyTo,
      subject: `New quote request from ${name} — ${result.payload.businessName}`,
      html: `
        <p>New quote request from your website (${result.payload.businessName}).</p>
        <p><strong>Name:</strong> ${safeName}</p>
        ${safePhone ? `<p><strong>Phone:</strong> ${safePhone}</p>` : ""}
        ${safeEmail ? `<p><strong>Email:</strong> ${safeEmail}</p>` : ""}
        ${!safePhone && !safeEmail ? `<p><strong>Contact:</strong> ${safeContact}</p>` : ""}
        ${safeService ? `<p><strong>What they need:</strong> ${safeService}</p>` : ""}
        ${message ? `<p><strong>Message:</strong> ${safeMessage}</p>` : ""}
      `,
    });
    await createAdminClient().from("lead_inquiries").insert({
      lead_id: result.lead.id,
      channel: "form",
      status: "new",
      name,
      contact: contactValue,
      source: "website_form",
      metadata: { message, phone: phone || undefined, email: email || undefined, service: service || undefined },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[quote-request] send failed", err);
    return NextResponse.json({ error: "Unable to send right now — please try again shortly." }, { status: 500 });
  }
}
