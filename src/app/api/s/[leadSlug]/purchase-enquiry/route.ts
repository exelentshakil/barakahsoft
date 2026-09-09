import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/notifications";
import { tenantBySlug } from "@/tenants";

// "I want this built" — the enquiry alternative to Stripe Checkout.
//
// A partner cannot take money through the platform's Stripe account: the card
// statement carries the platform's descriptor, the funds land in the
// platform's balance, and a UK partner billing a UK client through a US entity
// is a VAT problem on top of the branding one. So a partner's proposal asks
// for the enquiry instead, and it arrives in THEIR inbox.
//
// Public and unauthenticated by design — the person filling it in is the
// prospect, who has a proposal link and no account. Everything it can do is
// write one row and send one mail to an address this codebase already knows;
// nothing here takes a recipient from the request.

export async function POST(req: Request, { params }: { params: Promise<{ leadSlug: string }> }) {
  const { leadSlug } = await params;
  const body = await req.json().catch(() => null);

  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 200) : "";
  const contact = typeof body?.contact === "string" ? body.contact.trim().slice(0, 200) : "";
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 2000) : "";

  if (!name || !contact) {
    return NextResponse.json({ error: "Name and email or phone are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: lead } = await admin
    .from("leads")
    .select("id, business_name, tenant_slug, slug")
    .eq("slug", leadSlug)
    .maybeSingle<{ id: string; business_name: string | null; tenant_slug: string | null; slug: string }>();
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // The recipient comes from the tenant that owns the lead — never from the
  // request, and never from the platform default.
  const tenant = tenantBySlug(lead.tenant_slug);
  const recipient = tenant.commerce.enquiryEmail || tenant.brand.supportEmail;

  const business = lead.business_name || leadSlug;

  // The row first: an enquiry that reaches the dashboard is not lost even if
  // the mail bounces, and mail is the part that can fail silently.
  await admin.from("lead_inquiries").insert({
    lead_id: lead.id,
    channel: "form",
    status: "new",
    name,
    contact,
    source: "proposal_purchase",
    metadata: { message, tenant: tenant.slug },
  });

  const sent = await sendEmail({
    to: recipient,
    from: tenant.brand.fromEmail,
    fromName: tenant.brand.senderName,
    replyTo: contact.includes("@") ? contact : undefined,
    subject: `Build request — ${business}`,
    html: `<h2>${escapeHtml(business)} wants their site built</h2>
<p><b>Name:</b> ${escapeHtml(name)}<br/>
<b>Contact:</b> ${escapeHtml(contact)}</p>
${message ? `<p><b>Message:</b><br/>${escapeHtml(message)}</p>` : ""}
<p><a href="${tenant.portalBaseUrl}/s/${escapeHtml(lead.slug)}">Open their proposal</a></p>
<hr/><p style="color:#6b7280;font-size:12px">${escapeHtml(tenant.brand.emailSignature)}</p>`,
  });

  // The enquiry is recorded either way, so the visitor is told it landed.
  // `sent` is returned for the dashboard's benefit, not the visitor's.
  return NextResponse.json({ ok: true, sent });
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character
  );
}
