import { getTenant } from "@/lib/tenant";
import type { ReactNode } from "react";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";

type LegalKind = "terms" | "privacy" | "refund";

const CONTENT: Record<LegalKind, { title: string; intro: string; sections: { title: string; body: ReactNode }[] }> = {
  terms: {
    title: "Terms and Conditions",
    intro: "These terms explain how BarakahSoft LLC provides managed lead-generation services for US home-service businesses.",
    sections: [
      { title: "The service", body: <p>BarakahSoft may provide strategy, market research, landing pages, website previews, paid advertising management, creative direction, lead routing, follow-up workflows, reporting, hosting, SEO work, and related support. The exact scope, start date, channels, budget, and target are confirmed in writing before a campaign begins.</p> },
      { title: "Management fee and advertising budget", body: <p>Optional Meta ads management is normally billed at the greater of <strong>$497 per month or 20% of monthly advertising spend</strong>, unless a written agreement says otherwise. Advertising spend is separate and is paid directly to the relevant advertising platform from the customer&apos;s account. BarakahSoft does not charge a per-lead fee unless a separate written agreement expressly says so.</p> },
      { title: "Lead target and qualification", body: <p>A lead target is a campaign KPI, not a promise that every inquiry will become a sale. The written agreement defines a qualified lead, service area, accepted services, duplicate and spam exclusions, required customer response time, minimum advertising budget, campaign dates, and any remedy if the agreed target is missed.</p> },
      { title: "Customer responsibilities", body: <p>The customer must provide accurate business information, approve claims and creative, maintain access to required advertising accounts, fund the agreed advertising budget, comply with applicable laws, and respond promptly to new inquiries. BarakahSoft is not responsible for missed opportunities caused by inaccurate information, unavailable service capacity, delayed responses, account restrictions, platform outages, or events outside its control.</p> },
      { title: "Websites and content", body: <p>Website previews and generated content are created from available business information and require customer review before publication. Customers are responsible for confirming business names, phone numbers, service areas, pricing, licenses, guarantees, photos, testimonials, and other claims. Ownership, export, hosting, revisions, and continued maintenance are governed by the written service agreement.</p> },
      { title: "Advertising and platform policies", body: <p>Campaigns must follow Meta, Google, and other platform policies as well as applicable advertising, privacy, consent, and consumer-protection laws. No campaign can guarantee approval, delivery volume, ranking position, cost per lead, revenue, or closed jobs.</p> },
      { title: "Cancellation", body: <p>There is no long-term obligation unless a written agreement states otherwise. Cancellation stops future recurring management after the applicable billing period. Work already performed, advertising spend, third-party fees, and approved costs remain payable.</p> },
      { title: "Contact", body: <p>Questions about these terms can be sent to <a className="font-semibold text-primary hover:underline" href="mailto:hello@barakahsoft.com">hello@barakahsoft.com</a> or <a className="font-semibold text-primary hover:underline" href="tel:+13075336678">+1 (307) 533-6678</a>.</p> },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro: "This policy explains how BarakahSoft LLC collects and uses information submitted through this website and its lead-generation services.",
    sections: [
      { title: "Information collected", body: <p>We may collect your name, business name, website URL, trade, service area, email address, phone number, message, consent record, campaign details, and information you provide during a qualification or service conversation. We may also receive technical information such as browser, device, approximate location, referral source, and website activity.</p> },
      { title: "How we use information", body: <p>We use information to review a business, prepare a website preview, communicate with you, provide requested services, operate campaigns, route leads, measure performance, prevent abuse, maintain records, and improve our systems. We do not sell submitted lead information as a standalone mailing list.</p> },
      { title: "Service providers", body: <p>We may use providers for hosting, database storage, website crawling, analytics, advertising, email, CRM, forms, payment processing, communications, and deployment. These providers process information only as needed to provide their services and may have their own privacy policies.</p> },
      { title: "Communications consent", body: <p>If you submit a form and provide consent, we may contact you by phone, text, or email about your request and related services, including through automated systems where permitted. Consent is not a condition of purchase. You may ask us to stop marketing communications at any time.</p> },
      { title: "Cookies and analytics", body: <p>We may use cookies, pixels, and similar technologies to understand traffic, measure advertising, protect forms, and improve the website. Advertising platforms may receive events according to their own terms and your settings.</p> },
      { title: "Retention and requests", body: <p>We retain information for as long as reasonably necessary for business, legal, security, reporting, and service purposes. You may request access, correction, deletion, or communication preferences by contacting us. Some information may need to be retained to meet legal or transactional obligations.</p> },
      { title: "Contact", body: <p>Privacy questions can be sent to <a className="font-semibold text-primary hover:underline" href="mailto:hello@barakahsoft.com">hello@barakahsoft.com</a>. BarakahSoft LLC is a Wyoming-registered US company.</p> },
    ],
  },
  refund: {
    title: "Refund Policy",
    intro: "This policy explains cancellations, advertising spend, management fees, and the lead-target remedy for BarakahSoft services.",
    sections: [
      { title: "Management fees", body: <p>Management is billed weekly unless your written agreement says otherwise. You may cancel future service in accordance with the agreement. Fees for a week or billing period in which work has already started are generally not refundable because they cover research, strategy, creative, campaign management, support, and work performed during that period.</p> },
      { title: "Advertising spend", body: <p>Advertising spend is paid directly to Meta or another advertising platform from your own account. BarakahSoft does not control or refund platform charges, and platform spend is not included in any management-fee refund.</p> },
      { title: "Lead-target remedy", body: <p>If your agreement includes a qualified-lead target, the written agreement controls the remedy. Depending on the agreement, the remedy may be a management-fee credit, a management extension, or a refund of an eligible management fee. The remedy does not cover advertising spend, third-party charges, or lost business revenue.</p> },
      { title: "Conditions", body: <p>Any target remedy requires the customer to maintain the agreed advertising budget, provide accurate information, keep the campaign active, remain within the agreed service area, accept valid inquiries, and respond within the agreed time. Spam, duplicate, fraudulent, out-of-area, or unserviceable inquiries do not count as qualified leads.</p> },
      { title: "Website and setup work", body: <p>Free previews and included setup work are provided as part of the offer described in your written agreement. Export, hosting, revisions, continued maintenance, and custom work may have separate terms. Third-party domains, subscriptions, advertising accounts, and software charges are not refundable by BarakahSoft.</p> },
      { title: "Requesting a refund or credit", body: <p>Send refund or credit requests to <a className="font-semibold text-primary hover:underline" href="mailto:hello@barakahsoft.com">hello@barakahsoft.com</a> with your business name and agreement details. We will review the request against the applicable written terms.</p> },
    ],
  },
};

const OWNER = "barakahsoft";

export async function MarketingLegalPage({ kind }: { kind: LegalKind }) {
  const tenant = await getTenant();
  const own = tenant.legal?.[`${kind}Html` as const];

  // The copy below is the platform's own: it names a Wyoming LLC, a $497
  // management fee and a specific refund remedy. Rendering it for another
  // tenant with the entity name swapped would publish a false contract that a
  // customer could rely on — a legal problem, not a branding one. So a tenant
  // gets its own copy or a holding page, never someone else's.
  if (tenant.slug !== OWNER && !own) {
    return (
      <main className="min-h-screen bg-white text-[#1e212b]">
        <Nav />
        <section className="px-6 py-24">
          <div className="mx-auto max-w-2xl">
            <h1 className="font-sans text-4xl font-semibold tracking-[-0.04em] text-[#07284d]">
              {CONTENT[kind].title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-[#60778d]">
              {tenant.brand.legalEntity} has not published this policy online yet. For a copy, or for
              any question about how we handle your information, email{" "}
              <a className="font-semibold text-primary hover:underline" href={`mailto:${tenant.brand.supportEmail}`}>
                {tenant.brand.supportEmail}
              </a>
              .
            </p>
          </div>
        </section>
        <Footer />
      </main>
    );
  }

  if (own) {
    return (
      <main className="min-h-screen bg-white text-[#1e212b]">
        <Nav />
        <section className="border-b border-[#d9e8f4] bg-[#eef7ff] px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">
              {tenant.brand.legalEntity}
            </p>
            <h1 className="mt-4 font-sans text-5xl font-semibold tracking-[-0.05em] text-[#07284d]">
              {CONTENT[kind].title}
            </h1>
          </div>
        </section>
        <section className="px-6 py-16">
          <article
            className="mx-auto max-w-3xl space-y-6 text-base leading-8 text-[#60778d]"
            dangerouslySetInnerHTML={{ __html: own }}
          />
        </section>
        <Footer />
      </main>
    );
  }

  const content = CONTENT[kind];
  return (
    <main className="min-h-screen bg-white text-[#1e212b]">
      <Nav />
      <section className="border-b border-[#d9e8f4] bg-[#eef7ff] px-6 py-20"><div className="mx-auto max-w-4xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0c68c8]">{tenant.brand.legalEntity}</p><h1 className="mt-4 font-sans text-5xl font-semibold tracking-[-0.05em] text-[#07284d]">{content.title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-[#60778d]">{content.intro}</p><p className="mt-5 text-xs font-semibold uppercase tracking-wider text-[#7890a5]">Last updated August 2026</p></div></section>
      <section className="px-6 py-16"><article className="mx-auto max-w-3xl space-y-10 text-base leading-8 text-[#60778d]">{content.sections.map((section) => <section key={section.title}><h2 className="font-sans text-2xl font-semibold tracking-tight text-[#07284d]">{section.title}</h2><div className="mt-3">{section.body}</div></section>)}</article></section>
      <Footer />
    </main>
  );
}
