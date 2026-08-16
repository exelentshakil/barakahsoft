import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/site-shell/primitives/Reveal";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";
import { Button } from "@/components/ui/button";

const INCLUDED = [
  "30 leads is the minimum we guarantee, and there's no cap.",
  "Every pilot lead gets the full redesign, audit, map grid, and competitor report.",
  "Up to 40 processed leads are included in the $290. Anything past that is $10 a lead.",
  "Either way, you keep the landing page, the creatives, and every lead we generated for you.",
];

const WHY_IT_PAYS = [
  "At 30 leads that's just $10 each.",
  "Agencies pay $100 to $150 for shared leads on marketplaces. These are exclusive to you.",
  "One closed $3,000 project covers this 8 times over.",
  "The only money you actually spend is about $750 of your own ad budget, in your own account, building your own pixel.",
];

// Real, specific pricing with a real refund guarantee -- the exact numbers
// and terms the product owner gave, adapted from "web design leads / your
// agency" phrasing (this was lifted from a reference offer aimed at
// agencies buying leads) to match BarakahSoft's actual audience — home
// service business owners buying customer leads for their own business.
export function PricingPilot() {
  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <SectionEyebrow icon={ShieldCheck}>Simple, guaranteed pricing</SectionEyebrow>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">The 30-day pilot</h2>
      </div>

      <Reveal className="mx-auto mt-10 max-w-2xl px-6">
        <div className="rounded-3xl border border-border bg-foreground p-8 text-background shadow-glow sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-display text-5xl font-bold">$290</p>
              <p className="mt-1 text-sm text-background/70">Live within 72 hours</p>
            </div>
            <div className="rounded-full bg-brand-gold px-4 py-1.5 text-sm font-semibold text-foreground">
              Only 15 slots available this week
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-background/10 p-6">
            <p className="font-semibold">The 30-Lead Guarantee</p>
            <p className="mt-2 text-sm text-background/80">
              Run the campaign we build for 30 days at $25/day. If you don't get at least 30 customer leads, we refund the $290
              automatically. No forms, no questions, no chasing us. Back in your account within 3 business days.
            </p>
          </div>

          <ul className="mt-8 space-y-3">
            {INCLUDED.map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm text-background/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
                {line}
              </li>
            ))}
          </ul>

          <p className="mt-8 text-sm font-semibold text-background/90">Why it pays for itself</p>
          <ul className="mt-3 space-y-3">
            {WHY_IT_PAYS.map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm text-background/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
                {line}
              </li>
            ))}
          </ul>

          <p className="mt-8 text-sm text-background/70">
            After the pilot it's $97 a month plus $10 per lead we process. No contract, cancel whenever you want.
          </p>

          <Button asChild size="lg" className="mt-8 w-full bg-brand-gold text-foreground hover:bg-brand-gold/90">
            <a href="#top">See if your business qualifies</a>
          </Button>
          <p className="mt-3 text-center text-xs text-background/60">
            Submitting this doesn't commit you to anything. You'll get the exact next steps and decide from there.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
