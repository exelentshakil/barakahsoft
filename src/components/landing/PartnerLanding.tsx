import Image from "next/image";
import { Check } from "lucide-react";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { RedesignIntakeFlow } from "@/components/landing/RedesignIntakeFlow";
import { CrispChat } from "@/components/CrispChat";
import type { Tenant } from "@/tenants/types";

// A partner's landing page: collect a URL, promise a free redesign, prove it.
//
// Deliberately not a reskin of LeadEngineLanding. That page sells a specific
// thing — a managed lead engine with ad spend and a monthly retainer — and a
// partner who sells websites at a fixed price would be making claims that are
// not theirs. Putting their logo on someone else's offer is a lie with their
// name on it.
//
// Deliberately short, too. Everything here earns its place against one
// question the visitor is actually asking — "what would mine look like" — and
// the six screenshots answer it better than any amount of copy. Every section
// renders only when the tenant supplies its content, so a partner who has
// filled in four fields gets a short honest page rather than a long one with
// holes in it.

export function PartnerLanding({ tenant }: { tenant: Tenant }) {
  const { brand, landing } = tenant;
  const mobileExamples = landing.examples.filter((example) => example.mobileUrl);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />

      <section className="relative overflow-hidden border-b border-border bg-[#12141c] text-white">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary" aria-hidden="true" />
        <div className="mx-auto max-w-4xl px-6 py-20 text-center sm:py-28">
          {landing.heroEyebrow && (
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{landing.heroEyebrow}</p>
          )}
          <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-6xl">
            {landing.heroHeadline ?? "Get your homepage redesigned for free"}
          </h1>
          {landing.heroSubhead && (
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-white/70">{landing.heroSubhead}</p>
          )}

          <div className="mx-auto mt-10 max-w-xl text-left">
            <RedesignIntakeFlow />
          </div>

          <p className="mt-4 text-xs font-semibold text-white/50">
            Free · No credit card · Yours to keep
          </p>
          {landing.trustLine && (
            <p className="mx-auto mt-10 max-w-xl text-sm leading-6 text-white/45">{landing.trustLine}</p>
          )}
        </div>
      </section>

      {/*
        The proof. A prospect deciding whether to hand over their URL is asking
        one question, and real screenshots of live sites answer it.
      */}
      {landing.examples.length > 0 && (
        <section id="examples" className="border-b border-border py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-primary">Real redesigns</p>
            <h2 className="mt-3 text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
              See what your new website could look like
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
              Real homepages we built for real businesses — every one of them live today.
            </p>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {landing.examples.map((example) => (
                <figure
                  key={example.name}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
                >
                  <div className="aspect-[1000/625] overflow-hidden bg-muted">
                    <Image
                      src={example.desktopUrl}
                      alt={`${example.name} homepage redesign`}
                      width={1000}
                      height={625}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                  <figcaption className="p-5">
                    <p className="font-bold">{example.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{example.category}</p>
                  </figcaption>
                </figure>
              ))}
            </div>

            {landing.moreExamplesHref && (
              <div className="mt-10 text-center">
                <a
                  href={landing.moreExamplesHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-bold transition hover:border-primary hover:text-primary"
                >
                  Show more examples
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/*
        Mobile is a separate screenshot rather than a CSS crop of the desktop
        one, because the mobile design IS a different design — and that it was
        designed at all is the claim this section makes.
      */}
      {mobileExamples.length > 0 && (
        <section className="border-b border-border bg-muted/40 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Looks great on mobile, too
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
              Every redesign is built mobile-first. Here is how they look in your hand.
            </p>
            <div className="mt-12 flex flex-wrap items-start justify-center gap-6">
              {mobileExamples.map((example) => (
                <figure key={example.name} className="w-[168px] sm:w-[200px]">
                  <div className="overflow-hidden rounded-[1.6rem] border-[6px] border-[#12141c] bg-[#12141c] shadow-lift">
                    <Image
                      src={example.mobileUrl as string}
                      alt={`${example.name} homepage on a phone`}
                      width={440}
                      height={984}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                  <figcaption className="mt-3 text-center text-xs font-semibold text-muted-foreground">
                    {example.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {landing.process && landing.process.length > 0 && (
        <section id="how-it-works" className="border-b border-border py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-primary">How it works</p>
            <h2 className="mt-3 text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
              From form to fresh design — in 48 hours
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
              No payment, no obligation. Just a professional redesign concept delivered to your inbox.
            </p>
            <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {landing.process.map((step, index) => (
                <li key={step.title} className="rounded-2xl border border-border bg-card p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  {step.when && (
                    <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {step.when}
                    </p>
                  )}
                  <h3 className="mt-1 font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {landing.included && landing.included.length > 0 && (
        <section id="included" className="border-b border-border py-20">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Everything you get, free</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              We show the work before asking for anything.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Like it and want the full site build? Good. Not now? The concept is yours to keep, no
              strings.
            </p>
            <ul className="mx-auto mt-10 max-w-sm space-y-3 text-left">
              {landing.included.map((item) => (
                <li key={item} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm font-semibold">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {landing.team.length > 0 && (
        <section id="team" className="border-b border-border py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Who we are</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">The team</h2>
            <div className="mt-12 flex flex-wrap justify-center gap-8">
              {landing.team.map((person) => (
                <div key={person.name} className="w-40">
                  {person.photoUrl ? (
                    <Image
                      src={person.photoUrl}
                      alt={person.name}
                      width={120}
                      height={120}
                      className="mx-auto h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 font-display text-2xl font-bold text-primary">
                      {person.name.charAt(0)}
                    </div>
                  )}
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {person.role}
                  </p>
                  <p className="mt-0.5 font-bold">{person.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {landing.faq.length > 0 && (
        <section id="faq" className="border-b border-border py-20">
          <div className="mx-auto max-w-2xl px-6">
            <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Common questions
            </p>
            <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card">
              {landing.faq.map((item) => (
                <details key={item.q} className="group p-5">
                  <summary className="cursor-pointer list-none text-sm font-bold marker:hidden">
                    {item.q}
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="contact" className="py-20">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to transform your homepage?
          </h2>
          <p className="mt-4 text-muted-foreground">
            A redesign concept that turns visitors into customers. Delivered in 48 hours, completely
            free.
          </p>
          <div className="mx-auto mt-8 max-w-md text-left">
            <RedesignIntakeFlow />
          </div>
          {brand.phoneE164 && (
            <p className="mt-6 text-sm text-muted-foreground">
              Or call us on{" "}
              <a href={`tel:${brand.phoneE164}`} className="font-bold text-foreground hover:text-primary">
                {brand.phoneDisplay}
              </a>
              {landing.contact?.hours ? ` · ${landing.contact.hours}` : ""}
            </p>
          )}
        </div>
      </section>

      <Footer />
      <CrispChat websiteId={brand.analytics?.crispId} />
    </main>
  );
}
