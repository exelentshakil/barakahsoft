import {
  ArrowRight,
  Check,
  Clock3,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import { MegaMenu } from "@/components/site-shell/MegaMenu";
import { PremiumFooter } from "@/components/site-shell/PremiumFooter";
import { StickyMobileCTA } from "@/components/site-shell/StickyMobileCTA";
import { PremiumLeadButton, PremiumPhoneButton } from "@/components/site-shell/PremiumLeadActions";
import type { SitePayload, ResolvedSection } from "@/components/site-shell/types";
import { getShellStyle } from "@/components/site-shell/shell-style";

function ServiceCard({ service, index, payload }: { service: ResolvedSection; index: number; payload: SitePayload }) {
  return (
    <article className={`group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift ${index === 0 ? "lg:col-span-2" : ""}`}>
      {service.imageUrl ? (
        <div className={`relative overflow-hidden bg-muted ${index === 0 ? "h-64" : "h-48"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={service.imageUrl} alt={service.h2} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
          <span className="absolute bottom-4 left-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-900">
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
          {service.body_content && <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.body_content}</p>}
        </div>
        <a href={`#${service.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary">
          Explore this service <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </a>
      </div>
    </article>
  );
}

export function PremiumLeadHomepage({ payload }: { payload: SitePayload }) {
  const style = getShellStyle(payload);
  const phone = payload.nap.phone;
  const featuredReviews = payload.reviews.slice(0, 3);
  const featuredServices = payload.services.slice(0, 6);
  const featuredAreas = payload.areas.slice(0, 12);

  return (
    <div style={style} className="bg-background pb-20 text-foreground lg:pb-0">
      <MegaMenu payload={payload} />

      <div className="border-b border-border bg-slate-950 px-6 py-2 text-center text-[11px] font-semibold tracking-wide text-slate-300">
        <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Local service team available now{payload.nap.address ? ` from ${payload.nap.address}` : ""}
      </div>

      <main>
        <section className="relative overflow-hidden border-b border-border bg-card">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-14 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
            <div className="relative z-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Real local service. Clear next step.
              </div>
              <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.03] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-7xl">
                {payload.headline}
              </h1>
              {payload.subhead && <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">{payload.subhead}</p>}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <PremiumLeadButton>Request a free quote</PremiumLeadButton>
                {phone && (
                  <PremiumPhoneButton phone={phone} />
                )}
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-border pt-5 text-xs font-semibold text-muted-foreground">
                {payload.proof.rating && <span className="inline-flex items-center gap-1.5"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {payload.proof.rating} from {payload.proof.reviewCount ?? 0} reviews</span>}
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" /> Licensed and insured</span>
                <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-primary" /> Straightforward scheduling</span>
              </div>
            </div>

            <div className="relative">
              {payload.heroImageUrl ? (
                <div className="relative overflow-visible">
                  <div className="aspect-[4/4.5] overflow-hidden rounded-[2rem] bg-slate-100 shadow-lift">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={payload.heroImageUrl} alt={`${payload.businessName} real project`} className="h-full w-full object-cover" />
                  </div>
                  <div className="absolute -bottom-6 -left-4 max-w-[230px] rounded-2xl border border-border bg-card p-4 shadow-lift sm:-left-8">
                    <div className="flex items-start gap-3"><div className="rounded-xl bg-primary/10 p-2 text-primary"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">The standard</p><p className="mt-1 text-sm font-bold">Real work. Clear communication. No guesswork.</p></div></div>
                  </div>
                </div>
              ) : <div className="aspect-[4/4.5] rounded-[2rem] bg-slate-950" />}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-muted/50">
          <div className="mx-auto grid max-w-7xl gap-px px-6 py-6 sm:grid-cols-3">
            {[
              ["01", "Tell us what you need", "A short request is enough to start."],
              ["02", "Get a clear next step", "The team follows up directly."],
              ["03", "Move forward with confidence", "Scope, timing, and pricing are confirmed."],
            ].map(([number, title, body]) => <div key={number} className="border-border py-4 sm:border-r sm:px-8 sm:first:pl-0 sm:last:border-0"><p className="font-display text-3xl font-bold text-primary/30">{number}</p><h2 className="mt-2 text-sm font-bold">{title}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p></div>)}
          </div>
        </section>

        {featuredServices.length > 0 && <section id="services" className="border-b border-border py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">What we do</p><h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Work that solves the real problem.</h2></div><p className="max-w-sm text-sm leading-6 text-muted-foreground">A focused set of services built around the needs already found in this business&apos;s real information.</p></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{featuredServices.map((service, index) => <ServiceCard key={service.slug} service={service} index={index} payload={payload} />)}</div>
          </div>
        </section>}

        {payload.differentiator && <section className="border-b border-border bg-slate-950 py-20 text-white lg:py-28"><div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Why choose {payload.businessName}</p><h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">A better experience from the first call.</h2><p className="mt-5 max-w-lg leading-7 text-slate-300">{payload.differentiator}</p><div className="mt-8"><PremiumLeadButton>Start with a free quote</PremiumLeadButton></div></div><div className="grid gap-3 sm:grid-cols-2">{["Clear communication", "Real local service", "Careful workmanship", "A direct path to booking"].map((item) => <div key={item} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"><Check className="h-5 w-5 text-primary" /><p className="mt-8 font-bold">{item}</p></div>)}</div></div></section>}

        {featuredReviews.length > 0 && <section id="reviews" className="border-b border-border py-20 lg:py-28"><div className="mx-auto max-w-7xl px-6"><div className="max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Real customer feedback</p><h2 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">Proof from people who already called.</h2></div><div className="mt-12 grid gap-5 md:grid-cols-3">{featuredReviews.map((review) => <figure key={`${review.author_name}-${review.text}`} className="flex min-h-56 flex-col rounded-2xl border border-border bg-muted/40 p-6"><div className="flex gap-1">{Array.from({ length: Math.min(review.rating, 5) }).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}</div><blockquote className="mt-5 flex-1 text-sm leading-6 text-foreground">&ldquo;{review.text}&rdquo;</blockquote><figcaption className="mt-5 border-t border-border pt-4 text-xs font-bold text-muted-foreground">{review.author_name}</figcaption></figure>)}</div></div></section>}

        {featuredAreas.length > 0 && <section id="service-area" className="border-b border-border bg-muted/40 py-16"><div className="mx-auto max-w-5xl px-6 text-center"><MapPin className="mx-auto h-6 w-6 text-primary" /><h2 className="mt-3 font-display text-3xl font-bold tracking-tight">Serving the areas that matter.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Explore the real service areas found in this business&apos;s website and local information.</p><div className="mt-8 flex flex-wrap justify-center gap-2">{featuredAreas.map((area) => <a key={area.slug} href={`#${area.slug}`} className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary">{area.h2}</a>)}</div></div></section>}

        <section id="contact" className="bg-slate-950 px-6 py-20 text-center text-white lg:py-28"><div className="mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Ready when you are</p><h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-6xl">Let&apos;s make the next step simple.</h2><p className="mx-auto mt-5 max-w-xl text-lg leading-7 text-slate-300">Tell {payload.businessName} what you need and get a direct response without a long form or a confusing handoff.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><PremiumLeadButton>Request a free quote</PremiumLeadButton>{phone && <a href={`tel:${phone}`} className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-6 py-3 text-sm font-bold text-white transition hover:border-white"><Phone className="h-4 w-4" /> Call {phone}</a>}</div></div></section>
      </main>

      <PremiumFooter payload={payload} />
      <StickyMobileCTA payload={payload} />
    </div>
  );
}
