import { LayoutTemplate, Server, Megaphone, ShieldCheck } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/site-shell/primitives/Reveal";
import { SectionEyebrow } from "@/components/site-shell/primitives/SectionEyebrow";
import { IconBadge } from "@/components/site-shell/primitives/IconBadge";
import { Button } from "@/components/ui/button";

const INCLUDED = [
  { icon: LayoutTemplate, title: "A real redesign", body: "Built from your own photos and real business info — see the finished homepage before you pay anything." },
  { icon: Server, title: "Hosting, kept live", body: "Once you go live, we keep it fast, secure, and online — no separate hosting bill to juggle." },
  { icon: Megaphone, title: "Facebook ads lead gen", body: "Optional — turn the new site into an actual lead pipeline with ads we set up and manage for you." },
];

// No public price point (deliberate) — the pitch stays "see it free, decide
// after," with a clear picture of what's actually included once you do,
// plus the same Stripe trust badge already live on barakahsoft.com for
// when someone is ready to pay.
export function ValueBundle() {
  return (
    <section className="relative overflow-hidden border-t border-border py-24">
      <div className="decor-blob -left-32 bottom-0 h-96 w-96" />
      <div className="mx-auto max-w-5xl px-6">
        <div className="text-center">
          <SectionEyebrow>What you get</SectionEyebrow>
          <h2 className="mx-auto max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
            One relationship. Website, hosting, and leads.
          </h2>
        </div>

        <RevealGroup className="mt-14 grid gap-6 sm:grid-cols-3">
          {INCLUDED.map((item, i) => (
            <RevealItem key={item.title} index={i}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 text-center shadow-card">
                <IconBadge icon={item.icon} className="mx-auto" />
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.body}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="mt-14 flex justify-center">
          <Button asChild size="lg">
            <a href="#top">See my free redesign</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
