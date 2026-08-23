import { NextResponse } from "next/server";
import { getSiteData } from "@/lib/get-site-data";
import { captureInquiry } from "@/lib/capture-inquiry";

// Public, unauthenticated -- any visitor to a delivered site can submit
// this. The hero form (data-lead-form) and the quote modal both post here.
//
// Delivery itself lives in captureInquiry, shared with the AI assistant, so
// an enquiry reaches the business the same way whatever produced it: an
// email to the CLIENT's own real scraped address (never BarakahSoft's) plus
// a lead_inquiries row. Same "never invent a contact channel" discipline as
// everywhere else here -- no real email on file means no send, reported,
// not a silently-swallowed failure.
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
      {
        error: result.payload.nap.phone
          ? `No email on file — please call ${result.payload.nap.phone} directly.`
          : "Unable to send right now.",
      },
      { status: 422 }
    );
  }

  const message = typeof body.message === "string" ? body.message : "";

  const sent = await captureInquiry({
    leadId: result.lead.id,
    businessName: result.payload.businessName,
    clientEmail,
    name: body.name,
    // A modal submission puts the phone-or-email in `contact`; split it so
    // the right field is labelled in the email the owner receives.
    phone: phone || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ? "" : contact),
    email: email || (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ? contact : ""),
    message: [service, message].filter(Boolean).join(" — "),
    source: "website_form",
  });

  if (!sent) {
    return NextResponse.json({ error: "Unable to send right now — please try again shortly." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
