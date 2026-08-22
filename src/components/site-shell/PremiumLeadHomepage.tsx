import {
  ArrowRight,
  Check,
  Clock3,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Wrench,
  Sparkles,
  Zap,
} from "lucide-react";
import { MegaMenu } from "@/components/site-shell/MegaMenu";
import { PremiumFooter } from "@/components/site-shell/PremiumFooter";
import { StickyMobileCTA } from "@/components/site-shell/StickyMobileCTA";
import { PremiumLeadButton, PremiumPhoneButton } from "@/components/site-shell/PremiumLeadActions";
import type { SitePayload, ResolvedSection } from "@/components/site-shell/types";
import { getShellStyle } from "@/components/site-shell/shell-style";

function ServiceCard({ service, index, payload }: { service: ResolvedSection; index: number; payload: SitePayload }) {
  return (
    <article className={`group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition duration-300 hover:-translate-y-1.5 hover:border-primary hover:shadow-lift ${index === 0 ? "lg:col-span-2" : ""}`}>
      {service.imageUrl ? (
        <div className={`relative overflow-hidden bg-muted ${index === 0 ? "h-64" : "h-48"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={service.imageUrl} alt={service.h2} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
          <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-900 shadow">
            {index === 0 ? "Featured service" : "Specialized service"}
          </span>
        </div>
      ) : (
        <div className="flex h-48 items-end bg-slate-950 p-6">
          <Wrench className="h-9 w-9 text-primary" strokeWidth={1.5} />
        </div>
      )}
      <div className="flex min-h-48 flex-col justify-between p-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">{String(index + 1).padStart(2, "0")}</p>
          <h3 className="font-display text-xl font-bold tracking-tight text-foreground">{service.h2}</h3>
          {service.body_content && <p className="mt-3 text-sm leading-6 text-muted-foreground line-clamp-3">{service.body_content}</p>}
        </div>
        <a href={payload.innerPagesBuilt ? `/s/${payload.leadSlug}/services/${service.slug}` : `#${service.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline">
          Explore this service <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </a>
      </div>
    </article>
  );
}

export function PremiumLeadHomepage({ payload }: { payload: SitePayload }) {
  const style = getShellStyle(payload);
  const plan = payload.bespokeDesignPlan ?? {};
  const surfaceClass = plan.surface === "dark-contrast" ? "bg-slate-950 text-white" : plan.surface === "warm-neutral" ? "bg-[#f7f3ed]" : "bg-card";
  const serviceGridClass = plan.serviceLayout === "editorial-list" ? "md:grid-cols-2" : plan.serviceLayout === "bento-grid" ? "md:grid-cols-2 lg:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-3";
  const phone = payload.nap.phone;
  const featuredReviews = payload.reviews.slice(0, 3);
  const featuredServices = payload.services.slice(0, 6);
  const featuredAreas = payload.areas.slice(0, 12);
  const rating = payload.proof.rating || "5.0";
  const reviewCount = payload.proof.reviewCount || 200;

  return (
    <div style={style} className="bg-background pb-20 text-foreground lg:pb-0 font-sans">
      {/* 1. TOP UTILITY STRIP (Spennato/BlueBuilt Standard) */}
      <div className="border-b border-border bg-slate-950 px-6 py-2 text-xs font-semibold text-slate-300">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>24/7 Priority Service Available Now{payload.nap.address ? ` · ${payload.nap.address}` : ""}</span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-slate-400">
            {phone && (
              <a href={`tel:${phone.replace(/\D/g, "")}`} className="text-white hover:text-primary font-bold transition flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-primary" /> {phone}
              </a>
            )}
            <span>⭐ {rating} ★ ({reviewCount}+ Reviews)</span>
          </div>
        </div>
      </div>

      <MegaMenu payload={payload} />

      <main>
        {/* 2. HIGH-IMPACT HERO SECTION */}
        <section className={`relative overflow-hidden border-b border-border ${surfaceClass}`}>
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
            <div className="relative z-10 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Licensed & Insured Local Experts
              </div>

              <h1 className="max-w-3xl font-display text-4xl font-extrabold leading-[1.04] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-7xl uppercase">
                {payload.headline}
              </h1>

              {payload.subhead && (
                <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  {payload.subhead}
                </p>
              )}

              {/* Proof Badges Strip */}
              <div className="flex flex-wrap gap-2.5 pt-1 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 shadow-sm">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {rating} on Google ({reviewCount}+ Reviews)
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-primary" /> 100% Guaranteed Workmanship
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 shadow-sm">
                  <Clock3 className="h-4 w-4 text-primary" /> Same-Day Estimates
                </span>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3 pt-2">
                <PremiumLeadButton>Get Your Free Quote</PremiumLeadButton>
                {phone && <PremiumPhoneButton phone={phone} />}
              </div>
            </div>

            {/* Hero Visual Column (Owner Cutout or Branded Project Photo) */}
            <div className="relative">
              {payload.heroImageUrl ? (
                <div className="relative overflow-visible">
                  <div className="aspect-[4/4.2] overflow-hidden rounded-[2rem] bg-slate-100 shadow-lift border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={payload.heroImageUrl} alt={`${payload.businessName} verified project`} className="h-full w-full object-cover" />
                  </div>
                  <div className="absolute -bottom-6 -left-4 max-w-[240px] rounded-2xl border border-border bg-card p-4 shadow-lift sm:-left-6">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">The Standard</p>
                        <p className="mt-0.5 text-xs font-bold">Real work. Clear pricing. No guesswork.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/4.2] rounded-[2rem] bg-slate-950 flex items-center justify-center p-8 text-center text-white">
                  <Wrench className="h-16 w-16 text-primary mb-2" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. 3-STEP PROCESS STRIP */}
        <section className="border-b border-border bg-muted/40">
          <div className="mx-auto grid max-w-7xl gap-px px-6 py-6 sm:grid-cols-3">
            {[
              ["01", "Request a Fast Estimate", "Tell us what you need in under 2 minutes."],
              ["02", "Upfront Clear Scope", "We diagnose the work and provide transparent pricing."],
              ["03", "Quality Guaranteed", "Experienced licensed team completes the work with full warranty."],
            ].map(([number, title, body]) => (
              <div key={number} className="border-border py-4 sm:border-r sm:px-8 sm:first:pl-0 sm:last:border-0">
                <p className="font-display text-3xl font-black text-primary/40">{number}</p>
                <h2 className="mt-2 text-sm font-bold text-foreground">{title}</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. CORE SERVICES SECTION (6 High-Def Cards) */}
        {featuredServices.length > 0 && (
          <section id="services" className="border-b border-border py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-6">
              <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Core Specializations</p>
                  <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Work that solves the real problem.</h2>
                </div>
                <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                  High-ticket, dedicated service routes engineered for instant quote capture and verified local relevance.
                </p>
              </div>
              <div className={`grid gap-6 ${serviceGridClass}`}>
                {featuredServices.map((service, index) => (
                  <ServiceCard key={service.slug} service={service} index={index} payload={payload} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5. WHY CHOOSE SECTION */}
        {payload.differentiator && (
          <section className="border-b border-border bg-slate-950 py-20 text-white lg:py-28">
            <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Why Choose {payload.businessName}</p>
                <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">A better experience from the first call.</h2>
                <p className="mt-5 max-w-lg leading-7 text-slate-300">{payload.differentiator}</p>
                <div className="mt-8">
                  <PremiumLeadButton>Start with a free quote</PremiumLeadButton>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {["Clear upfront communication", "Licensed & insured team", "Careful workmanship", "Direct 1-tap call & booking"].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
                    <Check className="h-5 w-5 text-primary" />
                    <p className="mt-6 font-bold text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 6. REVIEWS & PROOF */}
        {featuredReviews.length > 0 && (
          <section id="reviews" className="border-b border-border py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-6">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Real Customer Feedback</p>
                <h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Proof from people who already called.</h2>
              </div>
              <div className="mt-12 grid gap-5 md:grid-cols-3">
                {featuredReviews.map((review) => (
                  <figure key={`${review.author_name}-${review.text}`} className="flex min-h-56 flex-col rounded-2xl border border-border bg-muted/40 p-6">
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(review.rating, 5) }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <blockquote className="mt-5 flex-1 text-sm leading-6 text-foreground">&ldquo;{review.text}&rdquo;</blockquote>
                    <figcaption className="mt-5 border-t border-border pt-4 text-xs font-bold text-muted-foreground">{review.author_name}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 7. SERVICE AREAS */}
        {featuredAreas.length > 0 && (
          <section id="service-area" className="border-b border-border bg-muted/40 py-16">
            <div className="mx-auto max-w-5xl px-6 text-center">
              <MapPin className="mx-auto h-6 w-6 text-primary" />
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">Serving your surrounding territory.</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Dedicated location routes engineered for direct local search visibility.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {featuredAreas.map((area) => (
                  <a key={area.slug} href={payload.innerPagesBuilt ? `/s/${payload.leadSlug}/areas/${area.slug}` : `#${area.slug}`} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary">
                    {area.h2}
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 8. FAQ ACCORDION */}
        {payload.faq.length > 0 && (
          <section id="faq" className="border-b border-border py-20 lg:py-28">
            <div className="mx-auto max-w-3xl px-6">
              <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-primary">Useful Answers</p>
              <h2 className="mt-3 text-center font-display text-4xl font-bold tracking-tight">Questions customers ask before calling.</h2>
              <div className="mt-10 divide-y divide-border rounded-2xl border border-border bg-card">
                {payload.faq.slice(0, 8).map((item) => (
                  <details key={item.slug} className="group p-5">
                    <summary className="cursor-pointer list-none pr-8 text-sm font-bold marker:hidden">
                      {item.h2}
                      <span className="float-right text-primary transition group-open:rotate-45">+</span>
                    </summary>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{item.body_content}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 9. BOTTOM CONTACT CALLOUT */}
        <section id="contact" className="bg-slate-950 px-6 py-20 text-center text-white lg:py-28">
          <div className="mx-auto max-w-3xl space-y-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Ready when you are</p>
            <h2 className="font-display text-4xl font-bold tracking-tight sm:text-6xl">Let&apos;s make the next step simple.</h2>
            <p className="mx-auto max-w-xl text-base text-slate-300">
              Tell {payload.businessName} what you need and get a direct response without long forms or complicated phone trees.
            </p>
            <div className="pt-4 flex flex-wrap justify-center gap-3">
              <PremiumLeadButton>Request a Free Quote</PremiumLeadButton>
              {phone && (
                <a href={`tel:${phone.replace(/\D/g, "")}`} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-6 py-3 text-sm font-bold text-white transition hover:border-white">
                  <Phone className="h-4 w-4 text-primary" /> Call {phone}
                </a>
              )}
            </div>
          </div>
        </section>
      </main>

      <PremiumFooter payload={payload} />
      <StickyMobileCTA payload={payload} />
    </div>
  );
}
