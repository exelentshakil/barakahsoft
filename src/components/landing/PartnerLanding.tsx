import Image from "next/image";
import { Check, Clock, Mail, Monitor, PenLine, Smartphone } from "lucide-react";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { RedesignIntakeFlow } from "@/components/landing/RedesignIntakeFlow";
import { CrispChat } from "@/components/CrispChat";
import type { Tenant } from "@/tenants/types";

// A partner's landing page: collect a URL, promise a free redesign, prove it.
//
// Not a reskin of LeadEngineLanding — that page sells a managed lead engine
// with ad spend and a retainer, and a studio selling fixed-price websites would
// be making claims that are not theirs.
//
// The design idea: a studio selling REDESIGNS has to be its own audition, and
// the only proof that matters is what the work looks like. So the screenshots
// are framed as the devices they were designed for — browser chrome on the
// desktop shots, a phone body on the mobile ones — rather than dropped into the
// identical rounded cards every SaaS page uses. That device framing is specific
// to this subject and does not transfer to any other brief, which is the point.
//
// Colour comes from the tenant's own primaryHsl through --primary, so Jonas and
// Jim inherit this layout in their own brand without touching this file.

/**
 * Browser chrome around a desktop screenshot.
 *
 * Reads as "a website" before anyone has processed the image, which is the
 * whole claim of the section.
 */
function BrowserFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_18px_48px_-16px_rgba(16,24,50,0.35)]">
      <div className="flex items-center gap-1.5 border-b border-black/5 bg-[#f6f7fb] px-3 py-2.5">
        <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
        <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
        <span className="h-2 w-2 rounded-full bg-[#28c840]" />
        <span className="ml-2 h-3 flex-1 rounded-full bg-black/[0.06]" />
      </div>
      <Image
        src={src}
        alt={alt}
        width={1000}
        height={625}
        className="block aspect-[1000/625] w-full object-cover object-top"
      />
    </div>
  );
}

function PhoneFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative rounded-[2rem] border-[7px] border-[#101832] bg-[#101832] shadow-[0_20px_50px_-18px_rgba(16,24,50,0.6)]">
      <span className="absolute left-1/2 top-1.5 z-10 h-1.5 w-12 -translate-x-1/2 rounded-full bg-white/25" />
      <Image
        src={src}
        alt={alt}
        width={440}
        height={984}
        className="block aspect-[440/984] w-full rounded-[1.5rem] object-cover object-top"
      />
    </div>
  );
}

/** One icon per step, so the sequence reads at a glance rather than as four paragraphs. */
const STEP_ICONS = [PenLine, Monitor, Mail, Check];

export function PartnerLanding({ tenant }: { tenant: Tenant }) {
  const { brand, landing } = tenant;
  const mobileExamples = landing.examples.filter((example) => example.mobileUrl).slice(0, 4);
  const [lead, ...rest] = landing.examples;

  return (
    <main className="min-h-screen bg-white text-[#101832]">
      <Nav />

      <section className="relative overflow-hidden bg-[#101832] text-white">
        {/* One quiet light source behind the headline, in the tenant's colour.
            The only decoration on the page. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[36rem] w-[52rem] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-[0.22] blur-3xl"
          style={{ background: "radial-gradient(closest-side, hsl(var(--primary)), transparent)" }}
        />

        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-20 sm:pb-24 sm:pt-28">
          <div className="mx-auto max-w-3xl text-center">
            {landing.heroEyebrow && (
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                <Clock className="h-3.5 w-3.5" style={{ color: "hsl(var(--primary))" }} />
                {landing.heroEyebrow} — back in 48 hours
              </p>
            )}
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.03] tracking-[-0.035em] sm:text-6xl">
              {landing.heroHeadline ?? "Get your homepage redesigned for free"}
            </h1>
            {landing.heroSubhead && (
              <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/65">{landing.heroSubhead}</p>
            )}
          </div>

          {/* The form owns its own width here; it no longer carries mx-auto of
              its own, which was what made it sit off-centre. */}
          <div className="mx-auto mt-9 max-w-2xl">
            <RedesignIntakeFlow accent="brand" showNote={false} submitLabel="Show me my redesign" />
            <p className="mt-3 text-center text-xs text-white/45">
              We only look at your public website. Nothing to pay, nothing to cancel.
            </p>
          </div>

          {/* Proof inside the hero, not three scrolls down: the one thing a
              visitor wants before typing their address is evidence. */}
          {lead && (
            <div className="mx-auto mt-14 max-w-3xl">
              <BrowserFrame src={lead.desktopUrl} alt={`${lead.name} homepage`} />
              <p className="mt-3 text-center text-xs text-white/45">
                {lead.name} — {lead.category}
              </p>
            </div>
          )}

          {landing.trustLine && (
            <p className="mx-auto mt-12 max-w-lg text-center text-sm leading-6 text-white/40">
              {landing.trustLine}
            </p>
          )}
        </div>
      </section>

      {rest.length > 0 && (
        <section id="examples" className="border-b border-black/5 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                Real homepages, live today
              </h2>
              <p className="mt-4 text-[#5b657f]">
                Every one of these is a working site you can open and judge for yourself. Nothing
                staged, nothing mocked up.
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((example) => (
                <figure key={example.name}>
                  <BrowserFrame src={example.desktopUrl} alt={`${example.name} homepage`} />
                  <figcaption className="mt-4">
                    <p className="font-semibold">{example.name}</p>
                    <p className="text-sm text-[#5b657f]">{example.category}</p>
                  </figcaption>
                </figure>
              ))}
            </div>

            {landing.moreExamplesHref && (
              <a
                href={landing.moreExamplesHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-[#101832] underline decoration-[hsl(var(--primary))] decoration-2 underline-offset-4 hover:text-[hsl(var(--primary))]"
              >
                See the full portfolio
              </a>
            )}
          </div>
        </section>
      )}

      {mobileExamples.length > 0 && (
        <section className="overflow-hidden border-b border-black/5 bg-[#f6f7fb] py-20 sm:py-24">
          <div className="mx-auto max-w-5xl px-6">
            <div className="max-w-lg">
              <Smartphone className="h-6 w-6" style={{ color: "hsl(var(--primary))" }} />
              <h2 className="mt-4 font-display text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                Designed for the phone first
              </h2>
              <p className="mt-4 text-[#5b657f]">
                Most of your customers arrive on one. The mobile layout is drawn on its own, not
                squeezed out of the desktop version.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-2 gap-5 sm:gap-8 lg:grid-cols-4">
              {mobileExamples.map((example) => (
                <figure key={example.name}>
                  <PhoneFrame src={example.mobileUrl as string} alt={`${example.name} on a phone`} />
                  <figcaption className="mt-3 text-center text-xs font-medium text-[#5b657f]">
                    {example.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {landing.process && landing.process.length > 0 && (
        <section id="how-it-works" className="border-b border-black/5 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="max-w-xl font-display text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              What happens after you type your address
            </h2>

            {/* Numbered because this genuinely is a sequence, and connected by a
                rule so it reads as a timeline rather than four cards. */}
            <ol className="relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              <span
                aria-hidden="true"
                className="absolute left-0 right-0 top-5 hidden h-px bg-black/10 lg:block"
              />
              {landing.process.map((step, index) => {
                const Icon = STEP_ICONS[index] ?? Check;
                return (
                  <li key={step.title} className="relative">
                    <span
                      className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full text-white"
                      style={{ background: "hsl(var(--primary))" }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {step.when && (
                      <p className="mt-5 text-xs font-semibold" style={{ color: "hsl(var(--primary))" }}>
                        {step.when}
                      </p>
                    )}
                    <h3 className="mt-1 font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#5b657f]">{step.body}</p>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      )}

      {landing.included && landing.included.length > 0 && (
        <section className="border-b border-black/5 py-20 sm:py-24">
          <div className="mx-auto grid max-w-5xl gap-12 px-6 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
                What lands in your inbox
              </h2>
              <p className="mt-4 max-w-md text-[#5b657f]">
                A finished visual concept, not a wireframe or a proposal. Like it and we can talk
                about building it. If not, keep it anyway.
              </p>
              {landing.team.length > 0 && (
                <div className="mt-8 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {landing.team.map((person) => (
                      <span
                        key={person.name}
                        title={`${person.name} — ${person.role}`}
                        className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#101832] text-xs font-bold text-white"
                      >
                        {person.name.charAt(0)}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-[#5b657f]">
                    Drawn by {landing.team.map((person) => person.name).join(", ")} — the people who
                    would build it.
                  </p>
                </div>
              )}
            </div>

            <ul className="rounded-2xl border border-black/10 bg-white p-2 shadow-[0_18px_48px_-24px_rgba(16,24,50,0.4)]">
              {landing.included.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 border-b border-black/5 px-5 py-4 last:border-0"
                >
                  <Check className="h-4 w-4 shrink-0" style={{ color: "hsl(var(--primary))" }} />
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {landing.faq.length > 0 && (
        <section id="faq" className="border-b border-black/5 bg-[#f6f7fb] py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="font-display text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
              Before you ask
            </h2>
            <div className="mt-10 overflow-hidden rounded-2xl border border-black/10 bg-white">
              {landing.faq.map((item) => (
                <details key={item.q} className="group border-b border-black/5 last:border-0">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold marker:hidden">
                    {item.q}
                    <span
                      aria-hidden="true"
                      className="text-lg leading-none text-[#9aa4bd] transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-7 text-[#5b657f]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="contact" className="bg-[#101832] py-20 text-white sm:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-3xl font-bold tracking-[-0.03em] sm:text-4xl">
            See it before you decide anything
          </h2>
          <p className="mx-auto mt-4 max-w-md text-white/60">
            Type your address. We will send the concept back within 48 hours.
          </p>

          <div className="mt-9">
            <RedesignIntakeFlow accent="brand" showNote={false} submitLabel="Show me my redesign" />
          </div>

          {brand.phoneE164 && (
            <p className="mt-6 text-sm text-white/50">
              Or ring the studio on{" "}
              <a href={`tel:${brand.phoneE164}`} className="font-semibold text-white hover:underline">
                {brand.phoneDisplay}
              </a>
              {landing.contact?.hours ? `, ${landing.contact.hours.toLowerCase()}` : ""}
            </p>
          )}
        </div>
      </section>

      <Footer />
      <CrispChat websiteId={brand.analytics?.crispId} />
    </main>
  );
}
