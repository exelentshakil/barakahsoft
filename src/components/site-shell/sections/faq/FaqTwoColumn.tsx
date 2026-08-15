import type { SitePayload } from "@/components/site-shell/types";

// Two-column grid instead of one stacked column — reads denser/more
// "reference doc" for a longer real question list, less scroll to reach
// the rest of the page.
export function FaqTwoColumn({ payload }: { payload: SitePayload }) {
  if (payload.faq.length === 0) return null;
  return (
    <section id="faq" className="border-t border-border py-16">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center font-display text-3xl font-bold tracking-tight">Frequently asked questions</h2>
        <div className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {payload.faq.map((f) => (
            <div key={f.slug} className="border-b border-border pb-5">
              <p className="font-medium">{f.h2}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.body_content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
