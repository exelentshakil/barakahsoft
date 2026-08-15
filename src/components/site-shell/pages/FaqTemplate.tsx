import { HelpCircle } from "lucide-react";
import type { SitePayload } from "@/components/site-shell/types";
import { PageHeroBand } from "@/components/site-shell/pages/PageHeroBand";
import { RevealGroup, RevealItem } from "@/components/site-shell/primitives/Reveal";

// The one premium standalone FAQ page -- the same real FAQ content already
// generated for the homepage anchor section, as its own indexable page.
// Available as soon as the fast homepage pass has run.
export function FaqTemplate({ payload }: { payload: SitePayload }) {
  return (
    <>
      <PageHeroBand eyebrow="FAQ" eyebrowIcon={HelpCircle} title="Frequently asked questions" />

      <section className="py-16">
        <RevealGroup className="mx-auto max-w-3xl space-y-6 px-6">
          {payload.faq.map((f, i) => (
            <RevealItem key={f.slug} index={i}>
              <div className="rounded-xl border border-border bg-card p-6 shadow-card">
                <h2 className="font-semibold">{f.h2}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{f.body_content}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>
    </>
  );
}
