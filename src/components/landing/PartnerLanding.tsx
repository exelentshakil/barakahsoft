import Image from "next/image";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { RedesignIntakeFlow } from "@/components/landing/RedesignIntakeFlow";
import { CrispChat } from "@/components/CrispChat";
import type { Tenant } from "@/tenants/types";

// A partner's landing page, rendered entirely from their tenant config.
//
// Not a fork of LeadEngineLanding. That page sells a specific thing — a
// managed lead engine with ad spend and a monthly retainer — and a partner
// selling websites and print at a fixed price would be making claims that are
// not theirs. Swapping the logo on somebody else's offer is the mistake this
// avoids; the copy has to be the seller's or it is a lie with their name on it.
//
// Every section renders only when the tenant supplies its content, so a
// partner who has filled in three fields gets a short honest page rather than
// a long one with holes in it.

export function PartnerLanding({ tenant }: { tenant: Tenant }) {
  const { brand, landing } = tenant;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />

      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary" aria-hidden="true" />
        <div className="mx-auto max-w-5xl px-6 py-20 text-center sm:py-28">
          {landing.heroEyebrow && (
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{landing.heroEyebrow}</p>
          )}
          <h1 className="mx-auto mt-5 max-w-4xl font-display text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl">
            {landing.heroHeadline ?? `Websites, built properly.`}
          </h1>
          {landing.heroSubhead && (
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{landing.heroSubhead}</p>
          )}
          <div className="mx-auto mt-10 max-w-xl text-left">
            {/* The free-redesign flow: a URL and a contact detail, which is
                exactly the offer a partner's process section describes. */}
            <RedesignIntakeFlow />
          </div>
          {brand.phoneE164 && (
            <p className="mt-6 text-sm text-muted-foreground">
              Or ring the studio:{" "}
              <a href={`tel:${brand.phoneE164}`} className="font-bold text-foreground hover:text-primary">
                {brand.phoneDisplay}
              </a>
            </p>
          )}
        </div>
      </section>

      {landing.process && landing.process.length > 0 && (
        <section id="how-it-works" className="border-b border-border py-20">
          <div className="mx-auto max-w-5xl px-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Before you spend anything</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              We will redesign your homepage for free.
            </h2>
            <ol className="mt-10 grid gap-6 sm:grid-cols-3">
              {landing.process.map((step, index) => (
                <li key={step.title} className="rounded-2xl border border-border bg-card p-6">
                  <span className="font-display text-2xl font-bold text-primary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {step.when && (
                    <p className="mt-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{step.when}</p>
                  )}
                  <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/*
        Real screenshots of live sites, hotlinked from wherever the tenant
        already hosts them. Deliberately separate from the before/after
        showcase, which is generated from leads in this database — a partner
        arriving with fifteen years of portfolio has proof, it is just not
        proof we produced, and presenting it as ours would misstate authorship.
      */}
      {landing.portfolio.length > 0 && (
        <section id="work" className="border-b border-border py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Our work</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Real sites, shown as they actually are.
            </h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">
              Every image below is a screenshot of the site as it stands today. No mockups, nothing
              staged. Click through and judge them yourself.
            </p>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {landing.portfolio.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:-translate-y-1 hover:shadow-lift"
                >
                  {item.imageUrl && (
                    <div className="relative aspect-[1120/760] overflow-hidden bg-muted">
                      <Image
                        src={item.imageUrl}
                        alt={`${item.name} website`}
                        width={1120}
                        height={760}
                        className="h-full w-full object-cover object-top transition duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary">{item.kind}</p>
                    <h3 className="mt-1 text-lg font-bold">{item.name}</h3>
                    {item.who && <p className="mt-1 text-sm text-muted-foreground">{item.who}</p>}
                    <p className="mt-3 text-xs font-semibold text-muted-foreground">
                      {new URL(item.href).hostname.replace(/^www\./, "")}
                    </p>
                  </div>
                </a>
              ))}
            </div>

            {landing.alsoWorkedOn && landing.alsoWorkedOn.length > 0 && (
              <>
                <h3 className="mt-14 text-lg font-bold">Also on the go, or recently finished</h3>
                <ul className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                  {landing.alsoWorkedOn.map((item) => (
                    <li
                      key={item.name}
                      className="flex flex-wrap items-baseline justify-between gap-x-3 border-b border-border py-2 text-sm"
                    >
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-xs text-muted-foreground">{item.kind}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>
      )}

      {landing.services && landing.services.length > 0 && (
        <section id="services" className="border-b border-border py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">What we do</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {landing.services.length} things, done by the same people.
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {landing.services.map((service) => (
                <div key={service.title} className="rounded-2xl border border-border bg-card p-6">
                  <h3 className="text-lg font-bold">{service.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {landing.pricing && landing.pricing.length > 0 && (
        <section className="border-b border-border py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">What things cost</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {landing.pricing.map((tier) => (
                <div key={tier.title} className="rounded-2xl border border-border bg-card p-6">
                  <p className="font-display text-3xl font-bold text-primary">{tier.figure}</p>
                  <h3 className="mt-2 text-base font-bold">{tier.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{tier.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-3xl text-sm leading-7 text-muted-foreground">
              Every one of those is a starting figure, not a quote. What you get told at the first
              conversation is a fixed price for a described piece of work — and if your budget will
              not stretch to what you have described, you will hear that then rather than three
              weeks in.
            </p>
          </div>
        </section>
      )}

      {landing.promise && (
        <section className="border-b border-border bg-muted/40 py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{landing.promise.eyebrow}</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                {landing.promise.headline}
              </h2>
            </div>
            <div className="space-y-5">
              {landing.promise.paragraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="text-lg leading-8 text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>
      )}

      {landing.team.length > 0 && (
        <section className="border-b border-border py-20">
          <div className="mx-auto max-w-4xl px-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Who you are dealing with</p>
            {landing.team.map((person) => (
              <div key={person.name} className="mt-6">
                <h3 className="font-display text-2xl font-bold">{person.name}</h3>
                <p className="mt-1 text-sm font-semibold text-primary">{person.role}</p>
                {person.bio && <p className="mt-4 text-lg leading-8 text-muted-foreground">{person.bio}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {landing.faq.length > 0 && (
        <section id="faq" className="border-b border-border py-20">
          <div className="mx-auto max-w-3xl px-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Straight answers</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              The questions people ask before they ring.
            </h2>
            <div className="mt-10 space-y-8">
              {landing.faq.map((item) => (
                <div key={item.q}>
                  <h3 className="text-lg font-bold">{item.q}</h3>
                  <p className="mt-2 leading-7 text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="contact" className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Get in touch</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Tell us what you are trying to do.
          </h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            {landing.contact?.addressLines && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">The studio</p>
                <p className="mt-2 leading-7">
                  {landing.contact.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              </div>
            )}
            <div className="space-y-4">
              {brand.phoneE164 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Direct</p>
                  <a href={`tel:${brand.phoneE164}`} className="mt-1 block font-bold hover:text-primary">
                    {brand.phoneDisplay}
                  </a>
                </div>
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</p>
                <a href={`mailto:${brand.supportEmail}`} className="mt-1 block font-bold hover:text-primary">
                  {brand.supportEmail}
                </a>
              </div>
              {landing.contact?.hours && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Hours</p>
                  <p className="mt-1">{landing.contact.hours}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <CrispChat websiteId={brand.analytics?.crispId} />
    </main>
  );
}
