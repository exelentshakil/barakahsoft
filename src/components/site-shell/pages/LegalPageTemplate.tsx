import { Scale } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";
import { PageHeroBand } from "@/components/site-shell/pages/PageHeroBand";
import { Reveal } from "@/components/site-shell/primitives/Reveal";

// Privacy/Terms are the one deliberate exception to this pipeline's
// grounding discipline: standard small-business legal boilerplate isn't a
// factual claim about the business the way service copy is -- virtually
// every real small-business site runs near-identical language here. This
// interpolates the business's real name/contact/domain into a clean,
// genuinely complete static template; nothing is AI-generated, nothing
// needs a grounding check.
export function LegalPageTemplate({ payload, kind }: { payload: SitePayload; kind: "privacy" | "terms" }) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const contactLine = payload.nap.email
    ? `at ${payload.nap.email}`
    : payload.nap.phone
      ? `at ${payload.nap.phone}`
      : "using the contact details on this site";

  return (
    <>
      <PageHeroBand eyebrow="Legal" eyebrowIcon={Scale} title={kind === "privacy" ? "Privacy Policy" : "Terms of Service"} subhead={`Last updated ${today}`} />
      <section className="py-16">
        <Reveal className="mx-auto max-w-3xl space-y-6 px-6 leading-relaxed text-muted-foreground">
          {kind === "privacy" ? (
            <>
              <p>
                {payload.businessName} ("we," "us," or "our") respects your privacy. This policy explains what information we collect when you
                visit this site or contact us, and how we use it.
              </p>
              <p>
                <strong className="text-foreground">Information we collect.</strong> When you submit a contact form, request a quote, or book an
                appointment, we collect the information you provide — typically your name, phone number, email address, and details about the
                service you're requesting.
              </p>
              <p>
                <strong className="text-foreground">How we use it.</strong> We use this information solely to respond to your inquiry, provide the
                services you request, and, where you've agreed to it, follow up about our services. We do not sell your personal information to
                third parties.
              </p>
              <p>
                <strong className="text-foreground">Data sharing.</strong> We may share information with service providers who help us operate
                our business (such as scheduling or communication tools), bound to keep it confidential and use it only to provide services to us.
              </p>
              <p>
                <strong className="text-foreground">Your choices.</strong> You can ask us to access, correct, or delete the personal information
                we hold about you at any time by contacting us {contactLine}.
              </p>
              <p>
                <strong className="text-foreground">Changes to this policy.</strong> We may update this policy from time to time; the "last
                updated" date above reflects the most recent revision.
              </p>
              <p>Questions about this policy? Contact {payload.businessName} {contactLine}.</p>
            </>
          ) : (
            <>
              <p>
                These terms govern your use of this website and any services you request from {payload.businessName}. By contacting us or booking
                a service, you agree to these terms.
              </p>
              <p>
                <strong className="text-foreground">Estimates and pricing.</strong> Any pricing information provided is an estimate based on the
                details available at the time. Final pricing is confirmed before work begins.
              </p>
              <p>
                <strong className="text-foreground">Scheduling.</strong> Appointment times are estimates and may be adjusted due to weather,
                emergencies, or circumstances beyond our control. We'll do our best to keep you informed of any changes.
              </p>
              <p>
                <strong className="text-foreground">Website content.</strong> The content on this site is provided for general informational
                purposes about {payload.businessName}'s services and is not a guarantee of availability, pricing, or outcome for any specific
                project.
              </p>
              <p>
                <strong className="text-foreground">Limitation of liability.</strong> {payload.businessName} is not liable for indirect or
                incidental damages arising from use of this website; nothing here limits any liability related to work actually performed, which
                is governed by the terms agreed to at the time of service.
              </p>
              <p>Questions about these terms? Contact {payload.businessName} {contactLine}.</p>
            </>
          )}
        </Reveal>
      </section>
    </>
  );
}
