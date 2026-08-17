import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/site-shell/primitives/Reveal";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";
import { Button } from "@/components/ui/button";

const INCLUDED = [
  "A conversion-focused landing page built around your trade, service area, offer, photos, and proof.",
  "Meta campaign setup, ad copy, creative direction, tracking, testing, and weekly optimization.",
  "Lead routing and follow-up workflow so inquiries reach your team with useful job context.",
  "Hosting, support, content updates, and no long-term obligation.",
];

// Real pricing: one clear recurring bundle price, matching what
// ValueBundle already describes (redesign + hosting + ads). No borrowed
// pilot/guarantee numbers from a different business model — see the
// product owner's explicit call to keep this simple rather than reuse a
// reference offer that wasn't calibrated for this audience.
export function PricingPilot() {
  return (
    <section className="border-t border-border py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <SectionEyebrow icon={ShieldCheck}>Simple pricing</SectionEyebrow>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">One weekly price. One job: create opportunities.</h2>
      </div>

      <Reveal className="mx-auto mt-10 max-w-lg px-6">
        <div className="rounded-3xl border border-border bg-foreground p-8 text-background shadow-glow sm:p-10">
          <div className="text-center">
            <p className="font-display text-5xl font-bold">
              $500<span className="text-2xl font-normal text-background/60">/week</span>
            </p>
             <p className="mt-2 text-sm text-background/70">One week to judge the work. No long-term obligation.</p>
          </div>

           <div className="mt-8 grid gap-3 border-y border-background/15 py-5 sm:grid-cols-3 sm:text-center"><div><p className="text-xs uppercase tracking-wider text-background/50">You pay us</p><p className="mt-1 font-bold">$500 / week</p></div><div><p className="text-xs uppercase tracking-wider text-background/50">You pay Meta</p><p className="mt-1 font-bold">Your ad budget</p></div><div><p className="text-xs uppercase tracking-wider text-background/50">You receive</p><p className="mt-1 font-bold">The lead engine</p></div></div>
           <ul className="mt-8 space-y-3">
            {INCLUDED.map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm text-background/85">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" />
                {line}
              </li>
            ))}
          </ul>

          <Button asChild size="lg" className="mt-8 w-full bg-brand-gold text-foreground hover:bg-brand-gold/90">
             <a href="#top">Start with a qualification review</a>
          </Button>
           <p className="mt-3 text-center text-xs text-background/60">Your Meta ad budget is separate and paid directly to Meta. No long-term obligation.</p>
        </div>
      </Reveal>
    </section>
  );
}
